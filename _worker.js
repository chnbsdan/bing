// _worker.js - 处理所有请求
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const base = `${url.protocol}//${url.host}`;

    // ===== 静态资源白名单：直接放行 =====
    if (
      path.startsWith('/webp/') ||
      path.startsWith('/images/') ||
      path.startsWith('/1080pimages/') ||
      path.startsWith('/json/') ||
      path === '/daily.jpeg' ||
      path === '/original.jpeg' ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.webp') ||
      path.endsWith('.ico') ||
      path.endsWith('.svg') ||
      path.endsWith('.css') ||
      path.endsWith('.js')
    ) {
      return fetch(request);
    }

    // ===== 1. API 文档 /api =====
    if (path === '/api') {
      const html = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>图片 API 服务</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 1rem; line-height: 1.6; }
    h1 { color: #333; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
    .endpoint { margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <h1>📷 图片 API 服务</h1>
  <p>提供 <strong>随机图像</strong> 和 <strong>每日图像</strong> 接口。</p>
  <div class="endpoint">
    <h2>/api/random</h2>
    <ul>
      <li><code>${base}/api/random</code> → 随机图片</li>
      <li><code>${base}/api/random?redirect=true</code> → 随机图片（重定向）</li>
    </ul>
  </div>
  <div class="endpoint">
    <h2>/api/daily</h2>
    <ul>
      <li><code>${base}/api/daily</code> → 今日图像（WebP）</li>
      <li><code>${base}/api/daily?format=jpeg</code> → 压缩 JPEG</li>
      <li><code>${base}/api/daily?format=original</code> → 原始 JPEG</li>
      <li><code>${base}/api/daily?redirect=true</code> → 今日图像（重定向）</li>
    </ul>
  </div>
  <footer><p style="margin-top:2rem; color:#777;">Powered by Cloudflare</p></footer>
</body>
</html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // ===== 2. 随机图片 /api/random =====
    if (path === '/api/random') {
      try {
        const jsonUrl = `${base}/webp/index.json`;
        const resp = await fetch(jsonUrl);
        if (!resp.ok) {
          return new Response('Failed to load index.json', { status: 502 });
        }
        const data = await resp.json();
        if (!data.images || data.images.length === 0) {
          return new Response('No images found', { status: 404 });
        }
        const images = data.images;
        const randomImage = images[Math.floor(Math.random() * images.length)];
        const redirect = url.searchParams.get('redirect') === 'true';
        
        if (redirect) {
          return Response.redirect(randomImage.path, 302);
        }
        
        const imageResp = await fetch(`${base}${randomImage.path}`);
        return new Response(imageResp.body, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=10800'
          }
        });
      } catch (e) {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    // ===== 3. 今日图片 /api/daily =====
    if (path === '/api/daily') {
      try {
        const format = url.searchParams.get('format') || 'webp';
        const redirect = url.searchParams.get('redirect') === 'true';
        
        let imagePath;
        if (format === 'jpeg') {
          imagePath = '/daily.jpeg';
        } else if (format === 'original') {
          imagePath = '/original.jpeg';
        } else {
          imagePath = '/webp/latest.webp';
        }
        
        if (redirect) {
          return Response.redirect(imagePath, 302);
        }
        
        const imageResp = await fetch(`${base}${imagePath}`);
        const contentType = format === 'jpeg' || format === 'original' 
          ? 'image/jpeg' 
          : 'image/webp';
        return new Response(imageResp.body, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=10800'
          }
        });
      } catch (e) {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    // ===== 4. 首页和其他请求 =====
    return fetch(request);
  }
};
