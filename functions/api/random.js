export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // 获取图片索引 JSON
  const host = url.origin;
  const jsonUrl = `${host}/picture/index.json`;

  try {
    const fetchResp = await fetch(jsonUrl);
    if (!fetchResp.ok) {
      return new Response("Failed to load index.json", { status: 502 });
    }

    let images = await fetchResp.json();
    if (images.length > 1) {
      images = images.slice(0, -1);
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];
    const redirect = url.searchParams.get("redirect") === "true";
    const imagePath = randomImage.path;

    if (redirect) {
      return Response.redirect(imagePath, 302);
    }

    const imageUrl = new URL(imagePath, request.url);
    const resp = await fetch(imageUrl.toString());
    if (!resp.ok) {
      return new Response("Failed to fetch image", { status: 502 });
    }

    return new Response(resp.body, {
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "image/webp",
        "Cache-Control": "public, max-age=10800",
      },
    });
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
