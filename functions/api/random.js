export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;

  try {
    const jsonUrl = `${base}/webp/index.json`;
    const resp = await fetch(jsonUrl);
    if (!resp.ok) {
      return new Response("Failed to load index.json", { status: 502 });
    }
    const data = await resp.json();
    if (!data.images || data.images.length === 0) {
      return new Response("No images found", { status: 404 });
    }
    const images = data.images;
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const redirect = url.searchParams.get("redirect") === "true";
    
    if (redirect) {
      // 改成完整 URL
      const fullUrl = base + randomImage.path;
      return Response.redirect(fullUrl, 302);
    }
    
    const imageResp = await fetch(`${base}${randomImage.path}`);
    return new Response(imageResp.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=10800",
      },
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
