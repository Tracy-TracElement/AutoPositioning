export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bizName, industry, website, whatYouDo, audience, audienceDetail, competitors, differentiation, websiteSummary, adjustmentInstruction, previousResult } = req.body;
  if (!bizName || !industry || !whatYouDo || !audience || !competitors) return res.status(400).json({ error: 'Missing required fields' });

  const audienceCtx = audienceDetail ? `Audience insight: ${audienceDetail.slice(0, 200)}` : '';
  const websiteCtx = websiteSummary ? `Own website messaging: ${websiteSummary.slice(0, 300)}` : website ? `Own website: ${website}` : '';
  const competitorCtx = competitors.slice(0, 800);

  let prompt;

  if (adjustmentInstruction && previousResult) {
    prompt = `Brand strategy expert. A positioning analysis was run for "${bizName}" and the user wants one adjustment.

Previous result: ${previousResult.slice(0, 1200)}

Adjustment: "${adjustmentInstruction}"

Apply the adjustment. Keep what was good. Return ONLY valid JSON, no markdown:
{"currentPositioning":null,"personas":[{"name":"","role":"","companySize":"","age":"","frustrations":[],"whatTheyWant":"","buyingTrigger":"","whatWouldWinThem":""}],"competitors":[{"name":"","positioning":""}],"whiteSpace":[{"opportunity":"","whyItMatters":"","personaFit":""}],"positioningStatement":"","valueProposition":""}`;
  } else {
    prompt = `Brand strategy expert. Australian SME competitive positioning.

Business: ${bizName} | Industry: ${industry}
Does: ${whatYouDo.slice(0, 150)}
Audience: ${audience}${audienceCtx ? ' | ' + audienceCtx : ''}
Different: ${differentiation || 'Not specified'}
${websiteCtx}

Competitor websites and their messaging:
${competitorCtx}

Return ONLY valid JSON, no markdown fences:
{"currentPositioning":"2-3 sentences on ${bizName} current positioning, or null","personas":[{"name":"First name","role":"Job title","companySize":"e.g. 12-person firm","age":"e.g. 44","frustrations":["frustration 1","frustration 2"],"whatTheyWant":"1 sentence","buyingTrigger":"specific moment","whatWouldWinThem":"specific answer"}],"competitors":[{"name":"domain name","positioning":"1-2 sentences"}],"whiteSpace":[{"opportunity":"specific unclaimed territory","whyItMatters":"1 sentence","personaFit":"which persona and why"}],"positioningStatement":"For [audience], [bizName] is the [category] that [claim] — unlike [competitors] who [contrast].","valueProposition":"2-3 sentences from customer POV."}

2 personas. 3 white space items. Be specific and grounded.`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 1800, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err?.error?.message || 'API error' }); }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) { return res.status(500).json({ error: err.message || 'Server error' }); }
}
