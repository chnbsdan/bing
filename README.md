# 🖼️ Bing Wallpaper

> 一个完整的必应壁纸存档项目，包含每日自动更新、历史壁纸存档（2010-2019）、RESTful API 和优雅的展示页面。

[![GitHub stars](https://img.shields.io/github/stars/chnbsdan/bing)](https://github.com/chnbsdan/bing/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/chnbsdan/bing)](https://github.com/chnbsdan/bing/network)
[![GitHub license](https://img.shields.io/github/license/chnbsdan/bing)](https://github.com/chnbsdan/bing/blob/main/LICENSE)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)](https://bing.hangdn.net)
[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-2088FF?logo=github-actions)](https://github.com/chnbsdan/bing/actions)

## ✨ 特性

- 📅 **每日自动更新** - 通过 GitHub Actions 每天自动抓取 Bing 中国区壁纸
- 📚 **历史存档** - 完整的 2010-2019 年历史壁纸数据（3374+ 张）
- 🚀 **高性能** - 缩略图 + 原图分离，加载速度极快
- 🌐 **RESTful API** - 完整的 API 接口，支持 JSON 和图片重定向
- 🎨 **现代 UI** - 暗色/亮色主题，响应式设计，流畅滚动加载
- 📱 **移动端适配** - 完美的手机和平板浏览体验
- 💬 **评论系统** - 集成 Twikoo 评论，方便用户反馈

---


## 📖 API 接口

### 今日壁纸
```bash
# 返回 JSON 数据
curl https://bing.***.net/api/daily

# 直接显示图片
curl https://bing.***.net/api/daily?redirect=true
```

### 随机壁纸
```bash
# 返回 JSON 数据
curl https://bing.***.net/api/random

# 直接显示图片
curl https://bing.***.net/api/random?redirect=true
```

### 指定日期
```bash
# 返回 JSON 数据
curl https://bing.***.net/api/image?date=20260807

# 直接显示图片
curl https://bing.***net/api/image?date=20260807&redirect=true
```

### 壁纸列表（分页）
```bash
curl https://bing.***.net/api/list?page=1&size=30
```

### 历史壁纸 API

| 接口 | 说明 | 示例 |
|------|------|------|
| `/api/history/random` | 随机历史壁纸 | `?redirect=true` 直接显示图片 |
| `/api/history/image` | 指定日期历史 | `?date=2010-01-01` |
| `/api/history/daily` | 历史上的今天 | `?redirect=true` 直接显示图片 |

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端** | HTML5 + CSS3 + JavaScript (原生) |
| **图标** | Font Awesome 6 |
| **后端** | Cloudflare Pages Functions |
| **数据库** | JSON 文件 (GitHub 托管) |
| **自动化** | GitHub Actions |
| **图片处理** | Cloudflare Images / weserv.nl |
| **评论系统** | Twikoo |
| **版本控制** | Git + GitHub |

---

## 📂 项目结构

```
bing/
├── functions/
│   └── api/
│       ├── index.js          # API 文档页面
│       ├── daily.js          # 今日壁纸
│       ├── random.js         # 随机壁纸
│       ├── image.js          # 指定日期
│       ├── list.js           # 壁纸列表
│       └── history/          # 历史壁纸 API
│           ├── random.js
│           ├── image.js
│           └── daily.js
├── json/
│   ├── data.json             # 每日壁纸数据
│   └── history-2010-2019.json # 历史壁纸数据
├── originals/                # 历史原图（按年份分类）
│   ├── 2010/
│   ├── 2011/
│   └── ...
├── thumbs/                   # 历史缩略图（400x240）
│   ├── 2010/
│   ├── 2011/
│   └── ...
├── index.html                # 主页面
├── history.html              # 历史时光页面
├── .github/workflows/
│   └── main.yml              # GitHub Actions 自动更新
└── README.md
```

---

## 🔄 自动更新机制

项目使用 GitHub Actions 每天自动抓取最新的 Bing 壁纸数据：

```yaml
# .github/workflows/main.yml
name: 'Update Images Data'

on:
  schedule:
    - cron: '0 1 * * *'   # UTC 1:00 = 北京时间 09:00
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install
      - name: Update Data
        run: npm run update-data
      - name: Commit and Push
        run: |
          git config --global user.name 'GitHub Action'
          git config --global user.email 'noreply@github.com'
          git add .
          git diff --staged --quiet || git commit -m "update images data $(date +'%Y-%m-%d')"
          git push
```

---

## 🔧 本地开发

### 环境要求
- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 本地运行

```bash
pnpm run dev
```

### 手动更新数据

```bash
npm run update-data
```

---

## 📊 数据统计

| 数据项 | 数量 |
|--------|------|
| 每日壁纸 | 持续更新 |
| 历史壁纸 | 3,374+ 张 |
| 覆盖年份 | 2010-2019 |
| 仓库大小 | ~800 MB |
| API 接口 | 8+ 个 |

---

## 🌟 相关项目

| 项目 | 说明 |
|------|------|
| [bing-wallpaper2](https://github.com/chnbsdan/bing-wallpaper2) | 原始 API 项目 |
| [bing-history-images](https://github.com/chnbsdan/bing-history-images) | 历史壁纸图片仓库 |
| [zenghongtu/bing-wallpaper](https://github.com/zenghongtu/bing-wallpaper) | 上游数据源 |
| [npanuhin/Bing-Wallpaper-Archive](https://github.com/npanuhin/Bing-Wallpaper-Archive) | 上游数据源 |

---

## 📝 License

MIT © [chnbsdan](https://github.com/chnbsdan)

---

## 🙏 致谢

- [Bing](https://www.bing.com) - 壁纸数据源
- [Cloudflare](https://cloudflare.com) - 托管与 CDN
- [Font Awesome](https://fontawesome.com) - 图标库
- [Twikoo](https://twikoo.js.org) - 评论系统

---


<details>
<summary>原项目readme（点击展开）</summary>

# bing-wallpaper

A RESTful API for Bing wallpaper to use easy.

<img width="800" src="https://bing-wallpaper2.pages.dev/api/daily"/>

> `<img src="https://bing-wallpaper2.pages.dev/api/daily"/>`

## Usage

### API

Endpoint: [https://bing-wallpaper2.pages.dev](https://bing-wallpaper2.pages.dev/)

### Parameters

#### resolution

The resolution of wallpaper image. Default is `1920x1080`.

Option values:

- `UHD`
- `1920x1200`
- `1920x1080`
- `1366x768`
- `1280x768`
- `1024x768`
- `800x600`
- `800x480`
- `768x1280`
- `720x1280`
- `640x480`
- `480x800`
- `400x240`
- `320x240`
- `240x320`

#### format

The response format, can be `json`. **If not set, it will be redirected to the wallpaper image directly**.

#### index

The index of wallpaper, starts from 0. By default, `0` means to get today's image, `1` means to get the image of yesterday, and so on. Negative number is reverse sort, `-1` will get the earliest wallpaper. Or you can specify it as `random` to choose a random index.

#### date

Get wallpaper by date, from `20190309` to today (format is `YYYYMMDD`).

#### w

The width of the wallpaper.

#### h

The height of the wallpaper.

#### qlt

The quality of wallpaper, from `0` to `100`.

### Example

- Request

```text
http://bingw.jasonzeng.dev?resolution=UHD&index=random&w=1000&format=json
```

- Response

```json
{
	"startdate": "20220105",
	"copyright": "Plate-billed mountain toucan in Bellavista Cloud Forest Reserve, Ecuador (© Tui De Roy/Minden Pictures)",
	"urlbase": "/th?id=OHR.MountainToucan_EN-US7120632569",
	"title": "A plate-billed mountain toucan",
	"url": "https://www.bing.com/th?id=OHR.MountainToucan_EN-US7120632569_UHD.jpg&w=1000"
}
```

### CSS background image

You can also use this API to set CSS background image:

```text
background-image: url(https://bingw.jasonzeng.dev/?index=random);
height: 100%;
background-position: center;
background-repeat: no-repeat;
background-size: cover;
```

**Demo**

[https://blog.jasonzeng.dev/](https://blog.jasonzeng.dev/)

## Development

```
pnpm run dev
```

## Related

- [TimothyYe/bing-wallpaper](https://github.com/TimothyYe/bing-wallpaper) - A RESTful API to fetch daily wallpaper from Bing.com

</details>
