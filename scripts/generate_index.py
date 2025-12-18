import os
import json
import xml.etree.ElementTree as ET
import requests
import glob
import datetime

# 配置
BLUEPRINTS_DIR = "blueprints"
OUTPUT_FILE = "index.json"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") 

def parse_size(size_str):
    """解析 '(13,13)' 格式的字符串"""
    try:
        clean = size_str.replace('(', '').replace(')', '')
        parts = clean.split(',')
        return int(parts[0]), int(parts[1])
    except:
        return 0, 0

def parse_full_xml_metadata(file_path):
    """
    [兜底模式专用] 完整解析 XML 文件。
    当数据库挂掉时，我们需要从这里获取 Name, Author, ID 等所有信息。
    """
    try:
        if not os.path.exists(file_path):
            return None
            
        tree = ET.parse(file_path)
        root = tree.getroot()
        extra_info = root.find("extraInfo")
        if extra_info is None:
            return None
            
        # 辅助函数：安全获取文本
        def get_text(node, tag, default=""):
            child = node.find(tag)
            return child.text if child is not None else default

        # 提取基础字段
        bp_id = get_text(extra_info, "BuildingID")
        if not bp_id:
            # 如果 XML 没 ID，尝试用文件名兜底
            bp_id = os.path.splitext(os.path.basename(file_path))[0]

        name = get_text(extra_info, "name", "Unnamed")
        author = get_text(extra_info, "author", "Unknown")
        # 注意：XML里通常没有 author_steam_id 或者只有未加密的，这里做个兼容
        # 如果是 fallback 模式，sid 可能拿不到或者是空的
        
        category = get_text(extra_info, "category", "Custom")
        version = get_text(extra_info, "version", "1.0")
        tags = get_text(extra_info, "tags", "")
        
        # 提取 Size
        size_node = root.find("size")
        width, height = (0, 0)
        if size_node is not None:
            width, height = parse_size(size_node.text)

        # 提取 Mods
        mods = []
        mod_packages = extra_info.find("modPackages")
        if mod_packages is not None:
            for mod in mod_packages.findall("mod"):
                pkg_id = mod.find("packageId")
                if pkg_id is not None and pkg_id.text:
                    mods.append(pkg_id.text)
        
        return {
            "id": bp_id,
            "n": name,
            "a": author,
            "c": category,
            "v": version,
            "t": tags,
            "w": width,
            "h": height,
            "m": mods,
            # Fallback 模式下，统计数据只能为 0
            "s_l": 0, "s_d": 0, "s_dl": 0
        }
    except Exception as e:
        print(f"Error parsing XML {file_path}: {e}")
        return None

def fetch_from_database():
    """尝试从数据库获取数据"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise Exception("Missing Credentials")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    print("🔌 Attempting to connect to Database...")
    # 只获取活跃的蓝图
    url = f"{SUPABASE_URL}/rest/v1/blueprints?select=id,name,author,author_steam_id,category,tags,width,height,version,github_path,stat_likes,stat_dislikes,stat_added_to_library,created_at&is_active=eq.true"
    
    response = requests.get(url, headers=headers, timeout=10) # 设置超时防止卡死
    if response.status_code != 200:
        raise Exception(f"DB Error {response.status_code}: {response.text}")
        
    return response.json()

def scan_filesystem_fallback():
    """[防御策略] 文件系统扫描模式"""
    print("⚠️  Starting Filesystem Scan (Fallback Mode)...")
    
    search_path = os.path.join(BLUEPRINTS_DIR, "**/*.xml")
    files = glob.glob(search_path, recursive=True)
    # 排除 .cleanup
    files = [f for f in files if '.cleanup' not in f]
    
    blueprints = []
    for f in files:
        data = parse_full_xml_metadata(f)
        if data:
            # 补全路径字段 (统一正斜杠)
            data["p"] = f.replace("\\", "/")
            # 补全时间字段 (Fallback 模式用当前时间，或者文件修改时间)
            # 这里为了简单用当前时间，或者你可以用 os.path.getmtime(f)
            data["dt"] = datetime.datetime.utcnow().isoformat() + "Z"
            blueprints.append(data)
            
    return blueprints

def main():
    print("🚀 Starting index generation...")
    final_list = []
    source_mode = "unknown"
    
    try:
        # --- PLAN A: 数据库模式 ---
        db_records = fetch_from_database()
        print(f"✅ Database connected. Found {len(db_records)} active records.")
        source_mode = "database"

        for record in db_records:
            file_path = record.get("github_path", "")
            if not os.path.exists(file_path):
                # 数据库有记录但文件没了，跳过
                continue

            # 仅解析 Mods (因为 DB 里没有)
            # 复用 parse_full_xml_metadata 获取 mods，虽然有点浪费但代码复用性高
            # 或者只提取 mods 部分
            xml_data = parse_full_xml_metadata(file_path)
            mods_list = xml_data["m"] if xml_data else []

            entry = {
                "id": record["id"],
                "n": record["name"],
                "a": record["author"],
                "sid": record.get("author_steam_id"),
                "c": record["category"],
                "v": record["version"],
                "t": record["tags"],
                "w": record["width"],
                "h": record["height"],
                "m": mods_list,
                "p": file_path,
                "s_l": record.get("stat_likes", 0),
                "s_d": record.get("stat_dislikes", 0),
                "s_dl": record.get("stat_added_to_library", 0),
                "dt": record["created_at"]
            }
            final_list.append(entry)

    except Exception as e:
        # --- PLAN B: 容灾兜底模式 ---
        print(f"❌ Database connection failed: {e}")
        print("🛡️  Activating Defense Strategy: Fallback to Filesystem Scan")
        
        final_list = scan_filesystem_fallback()
        source_mode = "filesystem_fallback"

    # 生成文件
    output_data = {
        "version": "1.2",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "mode": source_mode, # 标记数据来源，方便客户端判断
        "count": len(final_list),
        "blueprints": final_list
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))

    print(f"✅ Generated {OUTPUT_FILE} successfully.")
    print(f"   Mode: {source_mode}")
    print(f"   Count: {len(final_list)}")

if __name__ == "__main__":
    main()