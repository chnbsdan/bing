// functions/api/daily.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true";

  const allowedFormats = ["webp", "jpeg", "original"];
  if (!allowedFormats.includes(format)) {
    return new Response("Invalid format parameter", { status: 400 });
  }

  try {
    const host = url.origin;
    // ★★★ 读取 bing-wallpaper2 的 data.json ★★★
    const jsonUrl = `${host}/json/data.json`;

    const fetchResp = await fetch(new Request(jsonUrl, request));
    if (!fetchResp.ok) {
      return new Response("Failed to load data.json", { status: 502 });
    }

    let data = await fetchResp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response("No data found", { status: 404 });
    }

    // ★★★ 按 startdate 排序，取最新 ★★★
    data.sort((a, b) => b.startdate.localeCompare(a.startdate));
    const latest = data[0];

    // ★★★ 构造图片 URL ★★★
    const baseUrl = 'https://www.bing.com';
    let imageUrl;
    if (format === 'webp') {
      imageUrl = `${baseUrl}${latest.urlbase}_UHD.jpg`;
    } else {
      imageUrl = `${baseUrl}${latest.urlbase}_UHD.jpg`;
    }

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    // 代理图片
    const resp = await fetch(imageUrl);
    return new Response(resp.body, {
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=10800",
        "X-Image-Date": latest.startdate,
        "X-Image-Copyright": encodeURIComponent(latest.copyright || '')
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}