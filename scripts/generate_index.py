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
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") # 必须是 Service Role Key

def parse_size(size_str):
    """解析 '(13,13)' 格式的字符串"""
    try:
        clean = size_str.replace('(', '').replace(')', '')
        parts = clean.split(',')
        return int(parts[0]), int(parts[1])
    except:
        return 0, 0

def parse_blueprint_xml(file_path):
    """解析单个 XML 文件"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # 查找 extraInfo 节点
        extra_info = root.find("extraInfo")
        if extra_info is None:
            print(f"Skipping {file_path}: No <extraInfo> found.")
            return None
            
        # 提取字段
        def get_text(node, tag, default=""):
            child = node.find(tag)
            return child.text if child is not None else default

        building_id = get_text(extra_info, "BuildingID")
        if not building_id:
            print(f"Warning {file_path}: No <BuildingID> found.")
            return None

        name = get_text(extra_info, "name", "Unnamed")
        author = get_text(extra_info, "author", "Unknown")
        category = get_text(extra_info, "category", "Uncategorized")
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
        
        # 相对路径 (统一使用正斜杠)
        # file_path 可能是 "blueprints\subdir\file.xml"
        relative_path = file_path.replace("\", "/")
        
        return {
            "id": building_id,
            "n": name,
            "a": author,
            "c": category,
            "v": version,
            "t": tags,
            "w": width,
            "h": height,
            "m": mods,
            "p": relative_path
        }
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None

def sync_to_supabase(blueprints_data):
    """同步到 Supabase"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Supabase credentials not found. Skipping sync.")
        return

    print(f"Syncing {len(blueprints_data)} blueprints to Supabase...")
    
    db_payload = []
    for bp in blueprints_data:
        # 注意：这里只同步元数据字段，不含 mod 依赖列表等复杂结构，
        # 复杂结构通常只在 json 里，或者需要关联表。
        # 我们的数据库设计中 mod_dependencies 是另一张表。
        # 简单起见，这里只更新 blueprints 主表。
        db_payload.append({
            "id": bp["id"],
            "name": bp["n"],
            "author": bp["a"],
            "category": bp["c"],
            "version": bp["v"],
            "tags": bp["t"],
            "width": bp["w"],
            "height": bp["h"],
            "github_path": bp["p"]
        })
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" # Upsert 策略
    }
    
    # 分批发送
    batch_size = 50
    for i in range(0, len(db_payload), batch_size):
        batch = db_payload[i:i+batch_size]
        url = f"{SUPABASE_URL}/rest/v1/blueprints"
        try:
            resp = requests.post(url, headers=headers, json=batch)
            if resp.status_code >= 400:
                print(f"Batch {i//batch_size + 1} Error: {resp.text}")
            else:
                print(f"Batch {i//batch_size + 1} Success.")
        except Exception as e:
            print(f"Network error: {e}")

def main():
    print("Starting index generation...")
    all_blueprints = []
    
    # 查找所有 xml 文件
    # 使用 glob 递归查找 blueprints 目录
    search_path = os.path.join(BLUEPRINTS_DIR, "**/*.xml")
    files = glob.glob(search_path, recursive=True)
    
    print(f"Found {len(files)} XML files in {BLUEPRINTS_DIR}")
    
    for f in files:
        data = parse_blueprint_xml(f)
        if data:
            all_blueprints.append(data)
            
    # 生成 index.json
    output_data = {
        "version": "1.0",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "blueprints": all_blueprints
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))
        
    print(f"Generated {OUTPUT_FILE} with {len(all_blueprints)} entries.")
    
    # 同步数据库
    sync_to_supabase(all_blueprints)

if __name__ == "__main__":
    main()
