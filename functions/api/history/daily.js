// functions/api/history/daily.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') === 'true';
  const host = url.origin;

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

    // ★★★ 获取今天的月日，匹配历史上的今天 ★★★
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayMD = `${month}-${day}`;

    // ★★★ 筛选出所有月日相同的数据 ★★★
    const matches = data.filter(item => {
      const parts = item.date.split('-');
      return parts[1] === month && parts[2] === day;
    });

    if (matches.length === 0) {
      return new Response(JSON.stringify({
        error: `没有找到 ${month}月${day}日 的历史壁纸`
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ★★★ 随机选一张（如果有多个年份） ★★★
    const item = matches[Math.floor(Math.random() * matches.length)];
    const year = item.date.split('-')[0];
    const imageUrl = `https://bing.hangdn.net/originals/${year}/${item.date}.jpg`;
    const thumbUrl = `https://bing.hangdn.net/thumbs/${year}/${item.date}.jpg`;

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    return new Response(JSON.stringify({
      success: true,
      date: item.date,
      title: item.title,
      copyright: item.copyright,
      url: imageUrl,
      thumb: thumbUrl,
      total_matches: matches.length
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