export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body;

  try {
    // 注意：Coze 的对话接口和 DeepSeek 不一样
    const response = await fetch("https://api.coze.cn/v1/conversation/message/create", { // 示例端点，请以官方文档为准[citation:1]
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pat_x2ZfifQ5flKF1uusLrDM8sqkW3A6Schet4ZjkhpA4sHRUKzAdiQGu1tUxVMgKCHi}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        bot_id: process.env.7681199813144150035,
        user: "user_001",
        query: message,
        stream: false
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Coze 调用失败' });
  }
}
