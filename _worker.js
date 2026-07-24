// _worker.js - 只处理 /api/*，其他全部放行
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 非 /api/* 请求直接放行（包括首页、图片、静态资源）
    if (!path.startsWith('/api/')) {
      return fetch(request);
    }

    const base = `${url.protocol}//${url.host}`;

    // ===== API 文档 =====
    if (path === '/api') {
      const html = `<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"><title>图片 API 服务</title>
<style>
body { font-family: system-ui; max-width: 720px; margin: 2rem auto; padding: 1rem; line-height: 1.6; }
h1 { color: #333; }
code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
</style>
</head>
<body>
<h1>📷 图片 API 服务</h1>
<p><code>${base}/api/random</code> → 随机图片</p>
<p><code>${base}/api/daily</code> → 今日图片</p>
</body>
</html>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ===== 随机图片 =====
    if (path === '/api/random') {
      try {
        const resp = await fetch(`${base}/webp/index.json`);
        if (!resp.ok) {
          return new Response('Failed to load index.json', { status: 502 });
        }
        const data = await resp.json();
        if (!data.images || data.images.length === 0) {
          return new Response('No images found', { status: 404 });
        }
        const randomImage = data.images[Math.floor(Math.random() * data.images.length)];
        if (url.searchParams.get('redirect') === 'true') {
          return Response.redirect(randomImage.path, 302);
        }
        const imgResp = await fetch(`${base}${randomImage.path}`);
        return new Response(imgResp.body, {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=10800' }
        });
      } catch {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    // ===== 今日图片 =====
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
        const imgResp = await fetch(`${base}${imagePath}`);
        const contentType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        return new Response(imgResp.body, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=10800' }
        });
      } catch {
        return new Response('Internal Server Error', { status: 500 });
      }
    }

    // 其他 /api/* 请求放行
    return fetch(request);
  }
};
