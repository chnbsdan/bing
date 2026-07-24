export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ===== 静态资源直接放行 =====
    if (
      path === '/' ||
      path === '/index.html' ||
      path.startsWith('/webp/') ||
      path.startsWith('/images/') ||
      path.startsWith('/1080pimages/') ||
      path.startsWith('/json/') ||
      path === '/favicon.ico' ||
      path.endsWith('.css') ||
      path.endsWith('.js') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg') ||
      path.endsWith('.jpeg') ||
      path.endsWith('.webp')
    ) {
      return fetch(request);
    }

    // ===== API 处理 =====
    const base = `${url.protocol}//${url.host}`;

    // API 文档
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

    // 随机图片
    if (path === '/api/random') {
      try {
        const resp = await fetch(`${base}/webp/index.json`);
        if (!resp.ok) return new Response('No index', { status: 502 });
        const data = await resp.json();
        if (!data.images || data.images.length === 0) {
          return new Response('No images', { status: 404 });
        }
        const random = data.images[Math.floor(Math.random() * data.images.length)];
        if (url.searchParams.get('redirect') === 'true') {
          return Response.redirect(random.path, 302);
        }
        const img = await fetch(`${base}${random.path}`);
        return new Response(img.body, {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=10800' }
        });
      } catch {
        return new Response('Error', { status: 500 });
      }
    }

    // 今日图片
    if (path === '/api/daily') {
      try {
        const format = url.searchParams.get('format') || 'webp';
        const redirect = url.searchParams.get('redirect') === 'true';
        const paths = { webp: '/webp/latest.webp', jpeg: '/daily.jpeg', original: '/original.jpeg' };
        const imgPath = paths[format] || paths.webp;
        if (redirect) return Response.redirect(imgPath, 302);
        const img = await fetch(`${base}${imgPath}`);
        const contentType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        return new Response(img.body, {
          headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=10800' }
        });
      } catch {
        return new Response('Error', { status: 500 });
      }
    }

    // 所有其他请求（包括首页）直接放行
    return fetch(request);
  }
};
