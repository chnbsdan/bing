export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const base = `${url.protocol}//${url.host}`;

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
        // 从 json 目录获取最新的日期列表
        const resp = await fetch(`${base}/json/`);
        // 但 GitHub 目录列表有限制，改用另一种方式：从图片文件名反向获取
        
        // 直接读取 webp 目录下的图片列表（需要有个 index.json）
        // 既然没有，我们换一种方式：每天生成一个 json 文件，我们读取今天和昨天的
        
        // 简单方案：尝试读取最近30天的 json 文件，找到第一个有图片的
        const today = new Date();
        let images = [];
        let imagePaths = [];
        
        // 从 webp 目录读取已有的文件（通过 GitHub API 比较麻烦，我们换个思路）
        // 用现有的 json 文件获取日期列表
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.getFullYear() +
                         String(d.getMonth() + 1).padStart(2, '0') +
                         String(d.getDate()).padStart(2, '0');
          
          // 检查 webp 目录下是否有对应日期的 webp 文件
          const checkResp = await fetch(`${base}/webp/${dateStr}.webp`, { method: 'HEAD' });
          if (checkResp.ok) {
            imagePaths.push(`/webp/${dateStr}.webp`);
          }
        }
        
        if (imagePaths.length === 0) {
          return new Response('No images found', { status: 404 });
        }
        
        const randomPath = imagePaths[Math.floor(Math.random() * imagePaths.length)];
        const redirect = url.searchParams.get('redirect') === 'true';
        
        if (redirect) {
          return Response.redirect(randomPath, 302);
        }
        
        const img = await fetch(`${base}${randomPath}`);
        return new Response(img.body, {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=10800' }
        });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }

    // ===== 今日图片 =====
    if (path === '/api/daily') {
      try {
        const format = url.searchParams.get('format') || 'webp';
        const redirect = url.searchParams.get('redirect') === 'true';
        
        // 先找今天，找不到找昨天
        const today = new Date();
        let dateStr = today.getFullYear() +
                     String(today.getMonth() + 1).padStart(2, '0') +
                     String(today.getDate()).padStart(2, '0');
        
        let imagePath = `/webp/${dateStr}.webp`;
        let checkResp = await fetch(`${base}${imagePath}`, { method: 'HEAD' });
        
        if (!checkResp.ok) {
          // 今天没有，找昨天
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          dateStr = yesterday.getFullYear() +
                   String(yesterday.getMonth() + 1).padStart(2, '0') +
                   String(yesterday.getDate()).padStart(2, '0');
          imagePath = `/webp/${dateStr}.webp`;
          checkResp = await fetch(`${base}${imagePath}`, { method: 'HEAD' });
        }
        
        if (!checkResp.ok) {
          return new Response('No daily image found', { status: 404 });
        }
        
        if (redirect) {
          return Response.redirect(imagePath, 302);
        }
        
        const img = await fetch(`${base}${imagePath}`);
        return new Response(img.body, {
          headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=10800' }
        });
      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 });
      }
    }

    // ===== 首页和其他请求 =====
    return fetch(request);
  }
};
