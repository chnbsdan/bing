export default async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const format = url.searchParams.get("format") || "webp";
  const redirect = url.searchParams.get("redirect") === "true";

  const allowedFormats = ["webp", "jpeg", "original"];
  if (!allowedFormats.includes(format)) {
    return new Response("Invalid format parameter", { status: 400 });
  }

  const imagePath = format === "jpeg" 
    ? "/daily.jpeg" 
    : format === "original" 
      ? "/original.jpeg" 
      : "/daily.webp";

  if (redirect) {
    return Response.redirect(imagePath, 302);
  }

  const imageUrl = new URL(imagePath, request.url);
  try {
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
