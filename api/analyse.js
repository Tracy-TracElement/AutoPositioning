export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { bizName, industry, website, whatYouDo, audience, competitors, differentiation, websiteSummary } = req.body;
  if (!bizName || !industry || !whatYouDo || !audience || !competitors) return res.status(400).json({ error: 'Missing required fields' });
  const websiteContext = websiteSummary ? 'Current website messaging (from ' + website + '):\n' + websiteSummary : website ? 'Website provided: ' + website + ' (could not be read)' : 'No website provided.';
  const prompt = `You are a brand strategy expert specialising in competitive positioning for Australian SMEs.\n\nBusiness name: ${bizName}\nIndustry / category: ${industry}\nWhat they do: ${whatYouDo}\nTarget audience: ${audience}\nNamed competitors: ${competitors}\nWhat they believe makes them different: ${differentiation || 'Not specified'}\n${websiteContext}\n\nReturn ONLY a JSON object — no preamble, no markdown fences:\n\n{\n  "currentPositioning": "2-3 sentence summary of current positioning from website. Use null if unavailable.",\n  "competitors": [{ "name": "name", "positioning": "1-2 sentence summary" }],\n  "whiteSpace": ["Specific white space opportunity #1", "Opportunity #2", "Opportunity #3"],\n  "positioningStatement": "For [audience], [business] is the [category] that [claim] — unlike [competitors] who [contrast].",\n  "valueProposition": "2-3 sentence value proposition in plain English from customer point of view."\n}`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err?.error?.message || 'API error' }); }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) { return res.status(500).json({ error: err.message || 'Server error' }); }
}
