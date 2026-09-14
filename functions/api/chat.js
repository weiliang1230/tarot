export async function onRequestPost(context) {
  // 从 Cloudflare 环境变量中读取 Coze 的 Token 和 Bot ID
  const { pat_natbLqQO8yNCceRSYqzVL4f8tjilVp4mr1KQqaMV0PftoOhNgZOdJ9w1lQilaSNZ, 7681199813144150035 } = context.env;

  try {
    const { message } = await context.request.json();

    // 调用 Coze API
    const response = await fetch("https://api.coze.cn/v3/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pat_natbLqQO8yNCceRSYqzVL4f8tjilVp4mr1KQqaMV0PftoOhNgZOdJ9w1lQilaSNZ}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bot_id: 7681199813144150035,
        user_id: "user_001",
        additional_messages: [
          { role: "user", content: message, content_type: "text" }
        ],
        stream: false
      })
    });

    const data = await response.json();

    // 把 Coze 的回复返回给前端
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Coze 调用失败' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// 处理 CORS 预检请求，确保你的 GitHub Pages 前端可以调用
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
