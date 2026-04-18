export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, bizName } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    // Fetch the webpage directly — no Claude tokens used
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const pageRes = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AutoPositioning/1.0)' }
    });
    clearTimeout(timeout);

    const html = await pageRes.text();

    // Extract readable text from HTML
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    if (!text || text.length < 50) {
      return res.status(200).json({ summary: null });
    }

    // Now use Claude to summarise the extracted text — much fewer tokens
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `From this website text, write 2 sentences summarising how this business positions itself — what they claim, who they target, their main message. Text: ${text.slice(0, 1500)}`
        }]
      })
    });

    if (!response.ok) return res.status(200).json({ summary: null });
    const data = await response.json();
    const summary = data.content.map(b => b.text || '').join('').trim();
    return res.status(200).json({ summary: summary || null });

  } catch {
    return res.status(200).json({ summary: null });
  }
}
