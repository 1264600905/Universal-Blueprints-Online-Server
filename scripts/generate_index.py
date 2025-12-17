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
        relative_path = file_path.replace("\\", "/")
        
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

    # 🔥 优先从数据库获取数据（推荐方式）
    if SUPABASE_URL and SUPABASE_KEY:
        print("Fetching blueprints from database...")
        try:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }

            # 只获取有效（有BuildingID）的记录
            url = f"{SUPABASE_URL}/rest/v1/blueprints?select=id,name,author,category,tags,width,height,github_path,version,created_at"
            response = requests.get(url, headers=headers)

            if response.status_code == 200:
                db_blueprints = response.json()
                print(f"Found {len(db_blueprints)} blueprints in database")

                for bp in db_blueprints:
                    if bp.get("id") and bp.get("name"):
                        all_blueprints.append({
                            "id": bp["id"],
                            "n": bp["name"],
                            "a": bp.get("author", "Unknown"),
                            "c": bp.get("category", "Custom"),
                            "v": bp.get("version", "1.0"),
                            "t": bp.get("tags", ""),
                            "w": bp.get("width", 0),
                            "h": bp.get("height", 0),
                            "m": [], # 从数据库无法直接获取mod依赖，暂时为空
                            "p": bp.get("github_path", f"blueprints/{bp['id']}.xml")
                        })
                print(f"Successfully processed {len(all_blueprints)} blueprints from database")
            else:
                print(f"Failed to fetch from database: {response.status_code} - {response.text}")
                print("Falling back to file system scan...")
                # 如果数据库查询失败，回退到文件扫描
                scan_from_filesystem(all_blueprints)
        except Exception as e:
            print(f"Database fetch error: {e}")
            print("Falling back to file system scan...")
            # 如果出错，回退到文件扫描
            scan_from_filesystem(all_blueprints)
    else:
        print("No Supabase credentials found, scanning from file system...")
        scan_from_filesystem(all_blueprints)

def scan_from_filesystem(all_blueprints):
    """从文件系统扫描XML文件（原始方式）"""
    # 查找所有 xml 文件
    # 使用 glob 递归查找 blueprints 目录
    search_path = os.path.join(BLUEPRINTS_DIR, "**/*.xml")
    files = glob.glob(search_path, recursive=True)

    # 🆕 排除.cleanup目录中的文件
    files = [f for f in files if '.cleanup' not in f]

    print(f"Found {len(files)} XML files in {BLUEPRINTS_DIR} (excluding .cleanup)")

    if SUPABASE_URL and SUPABASE_KEY:
        # 🆕 新策略：只添加数据库中存在的蓝图
        print("Using database existence validation strategy...")

        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        # 获取数据库中所有有效的blueprint ID
        db_url = f"{SUPABASE_URL}/rest/v1/blueprints?select=id,is_active"
        db_response = requests.get(db_url, headers=headers)

        if db_response.status_code == 200:
            db_blueprints = db_response.json()
            valid_blueprint_ids = {
                bp["id"] for bp in db_blueprints
                if bp.get("is_active", True)  # 只包含活跃的蓝图
            }

            print(f"Found {len(valid_blueprint_ids)} valid blueprint IDs in database")

            # 只处理数据库中存在的文件
            valid_count = 0
            invalid_count = 0

            for f in files:
                data = parse_blueprint_xml(f)
                if data:
                    # 检查这个blueprint是否在数据库中存在且活跃
                    if data["id"] in valid_blueprint_ids:
                        all_blueprints.append(data)
                        valid_count += 1
                    else:
                        print(f"⚠️  Skipping {f}: Blueprint ID {data['id']} not found in database or inactive")
                        invalid_count += 1

            print(f"✅ Added {valid_count} valid blueprints to index")
            print(f"❌ Skipped {invalid_count} invalid blueprints")

            # 生成包含警告信息的index.json
            output_data = {
                "version": "1.0",
                "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
                "blueprints": all_blueprints,
                "generation_stats": {
                    "total_files_scanned": len(files),
                    "valid_blueprints": valid_count,
                    "skipped_blueprints": invalid_count,
                    "strategy": "database_validated",
                    "excluded_cleanup_files": True
                }
            }

            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))

            print(f"Generated {OUTPUT_FILE} with {len(all_blueprints)} entries (database validated).")

            # 不再同步到数据库，因为数据已经存在
            print("Skipping database sync (data already exists)")

            # 生成报告文件
            if invalid_count > 0:
                generate_skip_report(files, valid_blueprint_ids)

        else:
            print(f"Failed to fetch database data: {db_response.status_code} - {db_response.text}")
            print("Falling back to filesystem scanning without validation...")
            # 回退到原始方式
            fallback_scan(files, all_blueprints)
    else:
        print("No Supabase credentials found, using filesystem scanning...")
        fallback_scan(files, all_blueprints)

def fallback_scan(files, all_blueprints):
    """回退到原始的文件系统扫描方式"""
    for f in files:
        data = parse_blueprint_xml(f)
        if data:
            all_blueprints.append(data)

    # 生成 index.json
    output_data = {
        "version": "1.0",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "blueprints": all_blueprints,
        "generation_stats": {
            "strategy": "filesystem_only",
            "warning": "No database validation performed"
        }
    }

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, separators=(',', ':'))

    print(f"Generated {OUTPUT_FILE} with {len(all_blueprints)} entries (filesystem only).")

    # 同步数据库
    sync_to_supabase(all_blueprints)

def generate_skip_report(files, valid_blueprint_ids):
    """生成跳过文件的报告"""
    skipped_files = []

    for f in files:
        data = parse_blueprint_xml(f)
        if data and data["id"] not in valid_blueprint_ids:
            skipped_files.append({
                "file": f,
                "blueprint_id": data["id"],
                "name": data["n"],
                "author": data["a"]
            })

    if skipped_files:
        report_data = {
            "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
            "skipped_count": len(skipped_files),
            "skipped_files": skipped_files,
            "message": "These files were not included in index.json because they don't exist in database or are inactive"
        }

        with open('skipped_blueprints_report.json', 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        print(f"Generated skipped files report: skipped_blueprints_report.json")

if __name__ == "__main__":
    main()
