// functions/api/image.js
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const date = url.searchParams.get('date');
  const format = url.searchParams.get('format') || 'webp';
  const redirect = url.searchParams.get('redirect') === 'true';

  if (!date) {
    return new Response(JSON.stringify({
      error: '缺少 date 参数',
      example: '/api/image?date=20260731'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ★★★ 日期标准化：支持 20260731 或 2026-07-31 ★★★
  function normalizeDate(dateStr) {
    if (!dateStr) return '';
    const digits = dateStr.replace(/\D/g, '');
    if (digits.length === 8) {
      return digits;
    }
    return dateStr;
  }

  try {
    const host = url.origin;
    // ★★★ 读取 bing-wallpaper2 的 data.json ★★★
    const jsonUrl = `${host}/json/data.json`;

    const fetchResp = await fetch(new Request(jsonUrl, request));
    if (!fetchResp.ok) {
      return new Response(JSON.stringify({
        error: '无法加载壁纸数据'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let data = await fetchResp.json();

    if (!Array.isArray(data) || data.length === 0) {
      return new Response(JSON.stringify({
        error: '暂无壁纸数据'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ★★★ 用 startdate 匹配 ★★★
    const normalizedInput = normalizeDate(date);
    const item = data.find(w => w.startdate === normalizedInput);

    if (!item) {
      const recentDates = data.slice(0, 10).map(w => w.startdate);
      return new Response(JSON.stringify({
        error: `未找到 ${date} 的壁纸`,
        available_dates: recentDates,
        hint: '可用日期格式: YYYYMMDD (如 20260731)'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ★★★ 构造图片 URL ★★★
    const baseUrl = 'https://www.bing.com';
    const imageUrl = `${baseUrl}${item.urlbase}_UHD.jpg`;

    if (redirect) {
      return Response.redirect(imageUrl, 302);
    }

    const resp = await fetch(imageUrl);
    return new Response(resp.body, {
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=10800',
        'X-Image-Date': item.startdate,
        'X-Image-Copyright': encodeURIComponent(item.copyright || '')
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '服务器错误',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}