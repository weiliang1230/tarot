export async function onRequestPost(context) {
  const { COZE_API_KEY, COZE_BOT_ID } = context.env;

  try {
    const { message } = await context.request.json();

    const response = await fetch("https://api.coze.cn/v3/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COZE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        user_id: "user_001",
        additional_messages: [
          { role: "user", content: message, content_type: "text" }
        ],
        stream: false,
        auto_save_history: true
      })
    });

    const data = await response.json();

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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
