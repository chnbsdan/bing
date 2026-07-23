import json
import random
import shutil
import requests
import re
from PIL import Image
from io import BytesIO

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
    
    # 保存 JSON
    open(f'./json/{start_date}.json', 'wb').write(requests.get(url=url, headers=headers).content)
    
    # 下载原图并转换为 WebP
    pic = requests.get(pic_url, stream=True)
    if pic.status_code == 200:
        try:
            img = Image.open(BytesIO(pic.content))
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            # 保存为 WebP，质量 85
            img.save(f'./images/{start_date}.webp', 'WEBP', quality=85, method=6)
            shutil.copyfile(f'./images/{start_date}.webp', f'./images/latest.webp')
            print(f'Create {start_date} WebP Image Success!')
        except Exception as e:
            print(f'Create {start_date} WebP Image Failed: {e}')
    else:
        print(f'Create {start_date} Image Failed!')
    
    # 1080p 版本也转 WebP
    pic_1080p = requests.get(validate_title(pic_url), stream=True)
    if pic_1080p.status_code == 200:
        try:
            img = Image.open(BytesIO(pic_1080p.content))
            if img.mode in ('RGBA', 'LA'):
                img = img.convert('RGB')
            img.save(f'./1080pimages/{start_date}.webp', 'WEBP', quality=85, method=6)
            shutil.copyfile(f'./1080pimages/{start_date}.webp', f'./1080pimages/latest.webp')
            print(f'Create {start_date} 1080P_WebP Success!')
        except Exception as e:
            print(f'Create {start_date} 1080P_WebP Failed: {e}')
    else:
        print(f'Create {start_date} 1080P_Image Failed!')
    
    return
