// functions/api/daily.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 处理参数
  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true";
  // ★★★ 新增：size 参数，用于控制图片尺寸 ★★★
  const size = parseInt(url.searchParams.get("size")) || 0;

  // 验证参数
  const allowedFormats = ["webp", "jpeg", "original"];
  if (!allowedFormats.includes(format)) {
    return new Response("Invalid format parameter", { status: 400 });
  }

  // ★★★ 验证 size 参数 ★★★
  if (size < 0 || size > 3840) {
    return new Response("Invalid size parameter, must be between 0 and 3840", { status: 400 });
  }

  try {
    const host = url.origin;
    const jsonUrl = `${host}/json/data.json`;

    const fetchResp = await fetch(new Request(jsonUrl, request));
    if (!fetchResp.ok) {
      return new Response("Failed to load data.json", { status: 502 });
    }

    let data = await fetchResp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response("No data found", { status: 404 });
    }

    // 按 startdate 排序，取最新一张
    data.sort((a, b) => b.startdate.localeCompare(a.startdate));
    const latest = data[0];

    // ★★★ 构造图片 URL ★★★
    const baseUrl = 'https://www.bing.com';
    let imageUrl;

    // ★★★ 根据 size 参数构造不同尺寸的 URL ★★★
    if (size > 0) {
      // 计算高度：保持 16:9 比例
      const height = Math.round(size * 9 / 16);
      // 构造带尺寸的 URL
      imageUrl = `${baseUrl}${latest.urlbase}_${size}x${height}.jpg`;
    } else {
      // 默认返回 UHD 原图
      imageUrl = `${baseUrl}${latest.urlbase}_UHD.jpg`;
    }

    console.log(`📸 daily: ${latest.startdate}, size: ${size || 'UHD'}, url: ${imageUrl}`);

    // 如果请求重定向，直接跳转
    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    // ★★★ 多格式降级支持 ★★★
    const imageUrls = [
      imageUrl,
      `${baseUrl}${latest.urlbase}_1920x1080.jpg`,
      `${baseUrl}${latest.urlbase}_1920x1200.jpg`,
    ];

    // 尝试加载图片，失败则降级
    async function fetchImageWithFallback(urls) {
      for (const url of urls) {
        try {
          const resp = await fetch(url, {
            headers: { 'User-Agent': 'CloudflarePages-Function' }
          });
          if (resp.ok) {
            return new Response(resp.body, {
              headers: {
                "Content-Type": resp.headers.get("Content-Type") || "image/jpeg",
                "Cache-Control": "public, max-age=10800",
                "X-Image-Date": latest.startdate,
                "X-Image-Copyright": encodeURIComponent(latest.copyright || '')
              },
            });
          }
        } catch (e) {
          // 继续尝试下一个格式
        }
      }
      return new Response("Image not found", { status: 404 });
    }

    return await fetchImageWithFallback(imageUrls);

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
