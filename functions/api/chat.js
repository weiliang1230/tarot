export async function onRequestPost(context) {
  const { COZE_API_KEY, COZE_BOT_ID } = context.env;

  try {
    const { message } = await context.request.json();

    // 第一步：发起对话
    const chatRes = await fetch("https://api.coze.cn/v3/chat", {
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

    const chatData = await chatRes.json();
    const chatId = chatData.data?.id;
    const conversationId = chatData.data?.conversation_id;

    if (!chatId) {
      return new Response(JSON.stringify({ reply: "发起对话失败" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 第二步：轮询拉取结果（优化版：首轮等 1 秒，之后每 500ms 查一次，最多 20 次）
    let status = "in_progress";
    for (let i = 0; i < 20; i++) {
      // 第一次等 1 秒，之后每次等 500ms
      await new Promise(r => setTimeout(r, i === 0 ? 1000 : 500));

      const pollRes = await fetch(
        `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
        {
          method: "GET",
          headers: { "Authorization": `Bearer ${COZE_API_KEY}` }
        }
      );
      const pollData = await pollRes.json();
      status = pollData.data?.status;

      if (status === "completed") {
        // 第三步：拉取消息列表
        const msgRes = await fetch(
          `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
          {
            method: "GET",
            headers: { "Authorization": `Bearer ${COZE_API_KEY}` }
          }
        );
        const msgData = await msgRes.json();
        const messages = msgData.data || [];
        const answerMsg = messages.find(m => m.type === "answer");
        const answer = answerMsg?.content || "（未获得回答）";
        return new Response(JSON.stringify({ reply: answer }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (status === "failed" || status === "requires_action") {
        return new Response(JSON.stringify({ reply: "对话失败，请稍后重试" }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ reply: "等待超时，请稍后再试" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "调用出错：" + String(error) }), {
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
