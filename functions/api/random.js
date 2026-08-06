// functions/api/random.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") === "true";
  const host = url.origin;

  try {
    // ★★★ 读取 bing-wallpaper2 的 data.json ★★★
    const jsonUrl = `${host}/json/data.json`;
    const resp = await fetch(new Request(jsonUrl, request));
    if (!resp.ok) {
      return new Response('Failed to load data.json', { status: 502 });
    }

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      return new Response('No data found', { status: 404 });
    }

    // ★★★ 随机选一张 ★★★
    const randomItem = data[Math.floor(Math.random() * data.length)];
    const baseUrl = 'https://www.bing.com';
    const imageUrl = `${baseUrl}${randomItem.urlbase}_UHD.jpg`;

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    const imgResp = await fetch(imageUrl);
    return new Response(imgResp.body, {
      headers: {
        'Content-Type': imgResp.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-Image-Date': randomItem.startdate,
        'X-Image-Copyright': encodeURIComponent(randomItem.copyright || '')
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}