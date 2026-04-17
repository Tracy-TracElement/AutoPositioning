export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url, bizName } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 500, tools: [{ type: 'web_search_20250305', name: 'web_search' }], messages: [{ role: 'user', content: 'Search for the website ' + url + ' for the business called "' + bizName + '" and summarise only their homepage headline, tagline, value claims, and who they are for in 3-4 sentences. Return only the summary.' }] })
    });
    if (!response.ok) return res.status(200).json({ summary: null });
    const data = await response.json();
    const summary = data.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    return res.status(200).json({ summary: summary || null });
  } catch { return res.status(200).json({ summary: null }); }
}
