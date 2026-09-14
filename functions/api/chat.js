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
      return new Response(JSON.stringify({ error: '发起对话失败', detail: chatData }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }

    // 第二步：轮询拉取结果（最多等 30 秒）
    let answer = "";
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));

      const pollRes = await fetch(
        `https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${conversationId}`,
        {
          method: "GET",
          headers: { "Authorization": `Bearer ${COZE_API_KEY}` }
        }
      );
      const pollData = await pollRes.json();

      if (pollData.data?.status === "completed") {
        // 第三步：拉取消息列表，找到 AI 的回复
        const msgRes = await fetch(
          `https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${conversationId}`,
          {
            method: "GET",
            headers: { "Authorization": `Bearer ${COZE_API_KEY}` }
          }
        );
        const msgData = await msgRes.json();
        const answerMsg = msgData.data?.find(m => m.type === "answer");
        answer = answerMsg?.content || "（未获得回答）";
        break;
      }

      if (pollData.data?.status === "failed") {
        return new Response(JSON.stringify({ error: '对话失败', detail: pollData }), {
          status: 500, headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ reply: answer }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Coze 调用失败', detail: String(error) }), {
      status: 500, headers: { "Content-Type": "application/json" }
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
