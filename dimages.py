import json
import random
import shutil
import requests
import re
from PIL import Image
from io import BytesIO
import os

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
    
    # ===== 从 images 目录的 PNG 读取并转 WebP =====
    png_path = f'./images/{start_date}.png'
    webp_path = f'./webp/{start_date}.webp'
    
    # 先下载 PNG 到 images 目录（保持原有逻辑）
    pic = requests.get(pic_url, stream=True)
    if pic.status_code == 200:
        open(png_path, 'wb').write(pic.content)
        shutil.copyfile(png_path, f'./images/latest.png')
        print(f'Create {start_date} PNG Image Success!')
        
        # 转换为 WebP
        try:
            img = Image.open(png_path)
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            img.save(webp_path, 'WEBP', quality=85, method=6)
            shutil.copyfile(webp_path, f'./webp/latest.webp')
            print(f'Create {start_date} WebP Image Success!')
        except Exception as e:
            print(f'Create {start_date} WebP Image Failed: {e}')
    else:
        print(f'Create {start_date} PNG Image Failed!')
    
    # ===== 1080p 版本也转 WebP =====
    pic_1080p = requests.get(validate_title(pic_url), stream=True)
    if pic_1080p.status_code == 200:
        png_1080p_path = f'./1080pimages/{start_date}.png'
        open(png_1080p_path, 'wb').write(pic_1080p.content)
        shutil.copyfile(png_1080p_path, f'./1080pimages/latest.png')
        print(f'Create {start_date} 1080P_PNG Success!')
        
        # 1080p 也转 WebP
        try:
            img = Image.open(png_1080p_path)
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            webp_1080p_path = f'./webp/{start_date}_1080p.webp'
            img.save(webp_1080p_path, 'WEBP', quality=85, method=6)
            shutil.copyfile(webp_1080p_path, f'./webp/latest_1080p.webp')
            print(f'Create {start_date} 1080P_WebP Success!')
        except Exception as e:
            print(f'Create {start_date} 1080P_WebP Failed: {e}')
    else:
        print(f'Create {start_date} 1080P_PNG Failed!')
    
    return
