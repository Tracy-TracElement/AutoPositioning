export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bizName, industry, website, whatYouDo, audience, audienceDetail, competitors, differentiation, websiteSummary } = req.body;
  if (!bizName || !industry || !whatYouDo || !audience || !competitors) return res.status(400).json({ error: 'Missing required fields' });

  const websiteCtx = websiteSummary ? `Website messaging: ${websiteSummary.slice(0, 300)}` : website ? `Website: ${website}` : '';
  const audienceCtx = audienceDetail ? `Audience detail: ${audienceDetail.slice(0, 200)}` : '';

  const prompt = `Brand strategy expert. Australian SME positioning analysis.

Business: ${bizName} | Industry: ${industry}
Does: ${whatYouDo.slice(0,200)}
Audience: ${audience}${audienceCtx ? '\n' + audienceCtx : ''}
Competitors: ${competitors}
Different: ${differentiation || 'Not specified'}
${websiteCtx}

Return ONLY JSON, no markdown:
{
  "currentPositioning": "2-3 sentences on current positioning from website, or null",
  "personas": [
    {"name":"First name","role":"Job title","companySize":"e.g. 15-person firm","age":"e.g. 45","frustrations":["frustration 1","frustration 2"],"whatTheyWant":"1 sentence","buyingTrigger":"specific trigger moment","whatWouldWinThem":"specific answer"}
  ],
  "competitors": [{"name":"name","positioning":"1-2 sentences"}],
  "whiteSpace": [
    {"opportunity":"specific unclaimed territory","whyItMatters":"1 sentence","personaFit":"which persona and why"}
  ],
  "positioningStatement": "For [audience], [bizName] is the [category] that [claim] — unlike [competitors] who [contrast].",
  "valueProposition": "2-3 sentences from customer POV."
}

2 personas, 3 white space items. Be specific, not generic.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err?.error?.message || 'API error' }); }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) { return res.status(500).json({ error: err.message || 'Server error' }); }
}
