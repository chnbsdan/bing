// functions/api/history/image.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const redirect = url.searchParams.get('redirect') === 'true';
  const host = url.origin;

  if (!date) {
    return new Response(JSON.stringify({
      error: '缺少 date 参数',
      example: '/api/history/image?date=2010-01-01'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const jsonUrl = `${host}/json/history-2010-2019.json`;
    const resp = await fetch(new Request(jsonUrl, request));
    if (!resp.ok) {
      return new Response('Failed to load history data', { status: 502 });
    }

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      return new Response('No history data found', { status: 404 });
    }

    // ★★★ 查找匹配日期的壁纸 ★★★
    const item = data.find(d => d.date === date);
    if (!item) {
      return new Response(JSON.stringify({
        error: `未找到 ${date} 的历史壁纸`,
        hint: '日期格式: YYYY-MM-DD (如 2010-01-01)'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const year = date.split('-')[0];
    const imageUrl = `https://bing.hangdn.net/originals/${year}/${date}.jpg`;
    const thumbUrl = `https://bing.hangdn.net/thumbs/${year}/${date}.jpg`;

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    return new Response(JSON.stringify({
      success: true,
      date: item.date,
      title: item.title,
      copyright: item.copyright,
      url: imageUrl,
      thumb: thumbUrl
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}