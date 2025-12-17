#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理孤儿文件脚本
删除GitHub仓库中存在但数据库中不存在的蓝图文件
"""

import os
import sys
import json
import glob
import requests
import xml.etree.ElementTree as ET
import datetime
import subprocess

# 配置
BLUEPRINTS_DIR = "blueprints"
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

class OrphanedFileCleaner:
    def __init__(self, supabase_url, supabase_key):
        self.supabase_url = supabase_url.rstrip('/')
        self.supabase_key = supabase_key
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json"
        }

    def get_valid_blueprint_ids(self):
        """从数据库获取所有有效的blueprint ID"""
        try:
            url = f"{self.supabase_url}/rest/v1/blueprints?select=id,is_active"
            response = requests.get(url, headers=self.headers)

            if response.status_code == 200:
                blueprints = response.json()
                valid_ids = {
                    bp["id"] for bp in blueprints
                    if bp.get("is_active", True)
                }
                print(f"Found {len(valid_ids)} valid blueprint IDs in database")
                return valid_ids
            else:
                print(f"Failed to fetch database data: {response.status_code}")
                return None

        except Exception as e:
            print(f"Error fetching valid blueprint IDs: {e}")
            return None

    def scan_local_files(self):
        """扫描本地的XML文件"""
        search_path = os.path.join(BLUEPRINTS_DIR, "**/*.xml")
        files = glob.glob(search_path, recursive=True)

        # 排除.cleanup目录中的文件
        files = [f for f in files if '.cleanup' not in f]

        print(f"Found {len(files)} XML files in {BLUEPRINTS_DIR}")
        return files

    def scan_all_files(self):
        """扫描所有相关文件（XML + PNG + Minimap）"""
        xml_files = self.scan_local_files()

        # 扫描图片文件
        images_dir = "images"
        png_files = glob.glob(os.path.join(images_dir, "*.png"))
        jpg_files = glob.glob(os.path.join(images_dir, "*.jpg"))

        # 排除.cleanup目录
        image_files = [f for f in png_files + jpg_files if '.cleanup' not in f]

        print(f"Found {len(image_files)} image files")

        return xml_files, image_files

    def extract_blueprint_id(self, file_path):
        """从XML文件中提取blueprint ID"""
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()

            extra_info = root.find("extraInfo")
            if extra_info is not None:
                building_id_elem = extra_info.find("BuildingID")
                if building_id_elem is not None and building_id_elem.text:
                    return building_id_elem.text.strip()

            return None
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
            return None

    def identify_orphaned_files(self, valid_ids):
        """识别孤儿文件组"""
        xml_files, image_files = self.scan_all_files()

        valid_groups = []
        orphaned_groups = []

        processed_ids = set()

        for xml_file in xml_files:
            blueprint_id = self.extract_blueprint_id(xml_file)

            if not blueprint_id:
                print(f"⚠️  {xml_file}: No blueprint ID found")
                continue

            if blueprint_id in processed_ids:
                continue

            processed_ids.add(blueprint_id)

            if blueprint_id in valid_ids:
                valid_group = self.find_related_files(blueprint_id)
                if valid_group['xml']:  # 只有找到XML才算有效
                    valid_groups.append(valid_group)
            else:
                orphaned_group = self.find_related_files(blueprint_id)
                if orphaned_group['xml']:  # 只有找到XML才算孤儿
                    orphaned_groups.append(orphaned_group)

        return valid_groups, orphaned_groups

    def find_related_files(self, blueprint_id):
        """查找与blueprint ID相关的所有文件"""
        related_files = {
            'blueprint_id': blueprint_id,
            'xml': None,
            'png': None,
            'minimap_png': None,
            'minimap_jpg': None,
            'total_size': 0
        }

        # 查找XML文件
        xml_files = self.scan_local_files()
        for xml_file in xml_files:
            if self.extract_blueprint_id(xml_file) == blueprint_id:
                related_files['xml'] = xml_file
                if os.path.exists(xml_file):
                    related_files['total_size'] += os.path.getsize(xml_file)
                break

        if related_files['xml']:
            # 基于XML文件名查找相关图片
            base_name = os.path.splitext(os.path.basename(related_files['xml']))[0]

            # 主图片
            png_path = os.path.join("images", f"{base_name}.png")
            if os.path.exists(png_path):
                related_files['png'] = png_path
                related_files['total_size'] += os.path.getsize(png_path)

            # 小地图
            minimap_png_path = os.path.join("images", f"{base_name}_minimap.png")
            if os.path.exists(minimap_png_path):
                related_files['minimap_png'] = minimap_png_path
                related_files['total_size'] += os.path.getsize(minimap_png_path)

            minimap_jpg_path = os.path.join("images", f"{base_name}_minimap.jpg")
            if os.path.exists(minimap_jpg_path):
                related_files['minimap_jpg'] = minimap_jpg_path
                related_files['total_size'] += os.path.getsize(minimap_jpg_path)

        return related_files

    def move_blueprint_group(self, blueprint_group, dry_run=True):
        """移动完整的蓝图文件组到.cleanup目录"""
        cleanup_dir = '.cleanup/blueprints'
        cleanup_images_dir = '.cleanup/images'

        if not dry_run:
            os.makedirs(cleanup_dir, exist_ok=True)
            os.makedirs(cleanup_images_dir, exist_ok=True)

        moved_files = []
        # blueprint_id = blueprint_group['blueprint_id'] # 未使用变量

        # 移动XML文件
        if blueprint_group['xml'] and os.path.exists(blueprint_group['xml']):
            xml_dest = os.path.join(cleanup_dir, os.path.basename(blueprint_group['xml']))
            if dry_run:
                print(f"  Would move XML: {blueprint_group['xml']} -> {xml_dest}")
                moved_files.append(blueprint_group['xml'])
            else:
                try:
                    os.makedirs(os.path.dirname(xml_dest), exist_ok=True)
                    os.rename(blueprint_group['xml'], xml_dest)
                    print(f"  Moved XML: {xml_dest}")
                    moved_files.append(xml_dest)
                except Exception as e:
                    print(f"  Failed to move XML {blueprint_group['xml']}: {e}")

        # 移动图片文件
        for image_key in ['png', 'minimap_png', 'minimap_jpg']:
            image_file = blueprint_group[image_key]
            if image_file and os.path.exists(image_file):
                image_dest = os.path.join(cleanup_images_dir, os.path.basename(image_file))
                if dry_run:
                    print(f"  Would move {image_key}: {image_file} -> {image_dest}")
                    moved_files.append(image_file)
                else:
                    try:
                        os.makedirs(os.path.dirname(image_dest), exist_ok=True)
                        os.rename(image_file, image_dest)
                        print(f"  Moved {image_key}: {image_dest}")
                        moved_files.append(image_dest)
                    except Exception as e:
                        print(f"  Failed to move {image_key} {image_file}: {e}")

        return moved_files

    def delete_file(self, file_path, dry_run=True):
        """删除文件（包括相关图片文件）"""
        base_name = os.path.splitext(file_path)[0]

        files_to_delete = [
            file_path,  # .xml文件
            f"{base_name}.png",  # 主图片
            f"{base_name}_minimap.png",  # 小地图
            f"{base_name}_minimap.jpg"  # 小地图（jpg格式）
        ]

        deleted_files = []
        for f in files_to_delete:
            if os.path.exists(f):
                if dry_run:
                    print(f"  Would delete: {f}")
                    deleted_files.append(f)
                else:
                    try:
                        os.remove(f)
                        print(f"  Deleted: {f}")
                        deleted_files.append(f)
                    except Exception as e:
                        print(f"  Failed to delete {f}: {e}")

        return deleted_files

    def cleanup_orphaned_files(self, dry_run=True, auto_delete=False):
        """执行清理操作"""
        print("=== Orphaned Files Cleanup ===")
        print(f"Dry run: {dry_run}")
        print(f"Auto delete: {auto_delete}")
        print()

        # 1. 获取有效的blueprint ID列表
        valid_ids = self.get_valid_blueprint_ids()
        if valid_ids is None:
            print("Failed to get valid blueprint IDs from database")
            return False

        # 2. 识别孤儿文件组
        valid_groups, orphaned_groups = self.identify_orphaned_files(valid_ids)

        total_orphaned_files = sum(
            1 for group in orphaned_groups
            for key in ['xml', 'png', 'minimap_png', 'minimap_jpg']
            if group[key] is not None
        )

        print(f"Valid blueprint groups: {len(valid_groups)}")
        print(f"Orphaned blueprint groups: {len(orphaned_groups)}")
        print(f"Total orphaned files: {total_orphaned_files}")
        print()

        if not orphaned_groups:
            print("✅ No orphaned blueprint groups found!")
            return True

        # 4. 显示孤儿文件信息
        total_size = sum(group['total_size'] for group in orphaned_groups)
        print("🔍 Orphaned blueprint groups found:")
        for i, group in enumerate(orphaned_groups, 1):
            file_count = sum(1 for key in ['xml', 'png', 'minimap_png', 'minimap_jpg']
                           if group[key] is not None)
            print(f"  {i}. {group['blueprint_id']} - {file_count} files, {group['total_size']} bytes")

        print(f"\nTotal space to be freed: {total_size} bytes ({total_size / 1024 / 1024:.2f} MB)")
        print()

        # 5. 处理清理操作
        # 【修改】改进判断逻辑，在自动模式下跳过 input
        should_cleanup = False
        if auto_delete:
            should_cleanup = True
        elif not dry_run:
            # 检测是否为交互式终端
            if sys.stdin.isatty():
                should_cleanup = input("Cleanup these orphaned files? (y/N): ").lower() == 'y'
            else:
                # 非交互模式但没有 auto_delete，通常不应执行，但这里设置为 False 确保安全
                print("⚠️  Non-interactive mode detected without --auto-delete. Skipping cleanup check.")
                should_cleanup = False
        
        if should_cleanup:
            strategy = 'move' # 默认策略
            
            if auto_delete:
                print("🤖 Auto cleanup mode - Moving files to .cleanup directory")
                strategy = 'move'
            elif not dry_run and sys.stdin.isatty():
                # 只有在交互模式下才询问策略
                user_strategy = input("Choose cleanup strategy (move/delete/backup): ").lower()
                if user_strategy in ['move', 'delete', 'backup']:
                    strategy = user_strategy
            else:
                print("🤖 Non-interactive mode - Defaulting to 'move' strategy")

            if strategy in ['move', 'backup'] or auto_delete:
                print("📦 Moving orphaned blueprint groups to .cleanup directory...")
                total_moved = []

                for group in orphaned_groups:
                    print(f"\nProcessing group: {group['blueprint_id']}")
                    moved = self.move_blueprint_group(group, dry_run=False)
                    total_moved.extend(moved)

                print(f"\n✅ Moved {len(total_moved)} files to .cleanup directory")

                # 6. 清理后重新生成index
                if not dry_run:
                    print("\n🔄 Regenerating index after cleanup...")
                    self.regenerate_index_after_cleanup()

            elif strategy == 'delete':
                print("🗑️  Permanently deleting orphaned files...")
                total_deleted = []

                for group in orphaned_groups:
                    print(f"\nProcessing group: {group['blueprint_id']}")
                    if group['xml']:
                        deleted = self.delete_file(group['xml'], dry_run=False)
                        total_deleted.extend(deleted)

                print(f"\n✅ Deleted {len(total_deleted)} files permanently")

                # 6. 清理后重新生成index
                if not dry_run:
                    print("\n🔄 Regenerating index after cleanup...")
                    self.regenerate_index_after_cleanup()
        else:
            print("📋 Cleanup cancelled (dry run or user declined)")

        # 7. 生成报告
        self.generate_cleanup_report(valid_groups, orphaned_groups, dry_run)

        return True

    def regenerate_index_after_cleanup(self):
        """清理后重新生成index.json"""
        try:
            print("Running generate_index.py...")
            result = subprocess.run(
                ['python', 'scripts/generate_index.py'],
                capture_output=True,
                text=True,
                check=False
            )

            if result.returncode == 0:
                print("✅ Index regenerated successfully")
                print("Output:", result.stdout)
            else:
                print("❌ Index regeneration failed")
                print("Error:", result.stderr)
        except Exception as e:
            print(f"❌ Failed to regenerate index: {e}")

    def generate_cleanup_report(self, valid_files, orphaned_files, dry_run):
        """生成清理报告"""
        report_data = {
            "cleanup_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "dry_run": dry_run,
            "statistics": {
                "total_files_scanned": len(valid_files) + len(orphaned_files),
                "valid_files": len(valid_files),
                "orphaned_files": len(orphaned_files)
            },
            "orphaned_files": orphaned_files,
            "valid_files_count": len(valid_files)
        }

        report_filename = f"cleanup_report_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(report_filename, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)

        print(f"\n📄 Report generated: {report_filename}")

def main():
    """主函数"""
    # 检查环境变量
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("错误: 缺少SUPABASE_URL或SUPABASE_SERVICE_KEY环境变量")
        sys.exit(1)

    # 解析命令行参数
    dry_run = True  # 默认是干运行
    auto_delete = False
    
    # 检查是否在 CI 环境中 (GitHub Actions 会设置 CI=true)
    is_ci_env = os.environ.get('CI', 'false').lower() == 'true' or not sys.stdin.isatty()

    if "--execute" in sys.argv:
        dry_run = False
        print("🚨 执行模式 - 将实际处理文件!")
        
        # 【修改】如果是在 CI/无交互环境下用了 --execute，强制开启自动删除模式，避免卡住
        if is_ci_env:
            print("🤖 检测到无交互环境 (CI/GitHub Actions)。将 --execute 视为 --auto-delete。")
            auto_delete = True

    if "--auto-delete" in sys.argv:
        auto_delete = True
        dry_run = False
        print("🤖 自动删除模式 - 将移动/删除所有孤儿文件!")

    # 确认危险操作
    if not dry_run and not auto_delete:
        # 【修改】如果是本地终端，才询问；如果是 CI 环境，上面已经处理过 auto_delete=True，或者保持 dry_run
        if sys.stdin.isatty():
            print("⚠️  这将实际删除文件! 请确保你有备份。")
            try:
                if input("继续执行? (yes/no): ").lower() != 'yes':
                    print("操作已取消")
                    sys.exit(0)
            except EOFError:
                print("❌ 无法读取输入 (EOF)。请使用 --auto-delete 参数跳过确认。")
                sys.exit(1)
        else:
            # 理论上不应该走到这里，除非环境监测有误，做个兜底
            print("❌ 非交互环境不能等待输入。请使用 --auto-delete 参数。")
            sys.exit(1)

    # 执行清理
    cleaner = OrphanedFileCleaner(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    success = cleaner.cleanup_orphaned_files(dry_run=dry_run, auto_delete=auto_delete)

    if success:
        print("\n✅ Cleanup completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Cleanup failed")
        sys.exit(1)

if __name__ == "__main__":
    main()