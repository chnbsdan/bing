// functions/api/history/random.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') === 'true';
  const host = url.origin;

  try {
    // ★★★ 读取历史数据 ★★★
    const jsonUrl = `${host}/json/history-2010-2019.json`;
    const resp = await fetch(new Request(jsonUrl, request));
    if (!resp.ok) {
      return new Response('Failed to load history data', { status: 502 });
    }

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      return new Response('No history data found', { status: 404 });
    }

    // ★★★ 随机选一张 ★★★
    const randomItem = data[Math.floor(Math.random() * data.length)];
    
    // ★★★ 获取年份，构造图片地址 ★★★
    const dateStr = randomItem.date;
    const year = dateStr.split('-')[0];
    const imageUrl = `https://bing.hangdn.net/originals/${year}/${dateStr}.jpg`;

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    return new Response(JSON.stringify({
      success: true,
      date: randomItem.date,
      title: randomItem.title,
      copyright: randomItem.copyright,
      url: imageUrl,
      thumb: `https://bing.hangdn.net/thumbs/${year}/${dateStr}.jpg`,
      total: data.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
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