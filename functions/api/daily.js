// functions/api/daily.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true";
  const size = parseInt(url.searchParams.get("size")) || 0;

  // ★★★ Bing 官方支持的尺寸列表 ★★★
  const SUPPORTED_SIZES = [400, 640, 768, 1024, 1366, 1920, 2560];
  // ★★★ 尺寸到实际分辨率的映射 ★★★
  const SIZE_MAP = {
    400: '400x240',
    640: '640x360',
    768: '768x432',
    1024: '1024x576',
    1366: '1366x768',
    1920: '1920x1080',
    2560: '2560x1440',
  };

  const allowedFormats = ["webp", "jpeg", "original"];
  if (!allowedFormats.includes(format)) {
    return new Response("Invalid format parameter", { status: 400 });
  }

  // ★★★ 验证 size 参数 ★★★
  if (size < 0 || size > 3840) {
    return new Response("Invalid size parameter, must be between 0 and 3840", { status: 400 });
  }

  // ★★★ 如果指定了不支持的尺寸，自动修正为最接近的支持尺寸 ★★★
  let actualSize = size;
  if (size > 0 && !SUPPORTED_SIZES.includes(size)) {
    // 找到最接近的支持尺寸
    const closest = SUPPORTED_SIZES.reduce((prev, curr) => {
      return Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev;
    });
    actualSize = closest;
    console.log(`⚠️ 尺寸 ${size} 不支持，自动修正为 ${actualSize}`);
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

    data.sort((a, b) => b.startdate.localeCompare(a.startdate));
    const latest = data[0];

    const baseUrl = 'https://www.bing.com';
    let imageUrl;

    // ★★★ 根据实际尺寸构造 URL ★★★
    if (actualSize > 0 && SIZE_MAP[actualSize]) {
      imageUrl = `${baseUrl}${latest.urlbase}_${SIZE_MAP[actualSize]}.jpg`;
    } else {
      imageUrl = `${baseUrl}${latest.urlbase}_UHD.jpg`;
    }

    console.log(`📸 daily: ${latest.startdate}, size: ${actualSize || 'UHD'}, url: ${imageUrl}`);

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    // ★★★ 降级支持 ★★★
    const imageUrls = [
      imageUrl,
      `${baseUrl}${latest.urlbase}_1920x1080.jpg`,
      `${baseUrl}${latest.urlbase}_1920x1200.jpg`,
    ];

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
