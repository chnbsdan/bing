import json
import random
import shutil
import requests
import re
from PIL import Image
from io import BytesIO
import os
from datetime import datetime, timedelta

def validate_title(raw):
    new_title = re.sub("UHD.jpg", "1920x1080.jpg", raw)
    return new_title

def downloads(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
    }
    json_data = requests.get(url=url, headers=headers).json()
    pic_url = r'https://cn.bing.com{0}'.format(
        json_data['images'][0]['url'].split("&")[0])
    start_date = json_data['images'][0]['startdate']
    
    # 确保 webp 文件夹存在
    os.makedirs('./webp', exist_ok=True)
    
    # 保存 JSON
    open(f'./json/{start_date}.json', 'wb').write(requests.get(url=url, headers=headers).content)
    
    # 只生成一张 WebP：从 1080p 图片转换，命名为 日期.webp
    pic_1080p = requests.get(validate_title(pic_url), stream=True)
    if pic_1080p.status_code == 200:
        png_1080p_path = f'./1080pimages/{start_date}.png'
        open(png_1080p_path, 'wb').write(pic_1080p.content)
        shutil.copyfile(png_1080p_path, f'./1080pimages/latest.png')
        print(f'Create {start_date} 1080P_PNG Success!')
        
        try:
            img = Image.open(png_1080p_path)
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            # 直接命名为 日期.webp，不加 _1080p
            webp_path = f'./webp/{start_date}.webp'
            img.save(webp_path, 'WEBP', quality=85, method=6)
            shutil.copyfile(webp_path, f'./webp/latest.webp')
            print(f'Create {start_date} WebP Success!')
        except Exception as e:
            print(f'Create {start_date} WebP Failed: {e}')
    else:
        print(f'Create {start_date} 1080P_PNG Failed!')
    
    # ===== 新增：生成 webp/index.json =====
    generate_index_json()
    
    return

def generate_index_json():
    """扫描 webp 目录，生成 index.json"""
    webp_dir = './webp'
    if not os.path.exists(webp_dir):
        print('webp directory not found')
        return
    
    images = []
    for filename in os.listdir(webp_dir):
        if filename.endswith('.webp') and filename != 'latest.webp':
            date_str = filename.replace('.webp', '')
            if len(date_str) == 8 and date_str.isdigit():
                images.append({
                    'startdate': date_str,
                    'path': f'/webp/{filename}'
                })
    
    images.sort(key=lambda x: x['startdate'], reverse=True)
    
    # 只保留最近90天
    ninety_days_ago = (datetime.now() - timedelta(days=90)).strftime('%Y%m%d')
    images = [img for img in images if img['startdate'] >= ninety_days_ago]
    
    with open('./webp/index.json', 'w', encoding='utf-8') as f:
        json.dump({'images': images}, f, ensure_ascii=False, indent=2)
    
    print(f'Create webp/index.json success! {len(images)} images')
