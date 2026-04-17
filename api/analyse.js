export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { bizName, industry, website, whatYouDo, audience, audienceDetail, competitors, differentiation, websiteSummary } = req.body;
  if (!bizName || !industry || !whatYouDo || !audience || !competitors) return res.status(400).json({ error: 'Missing required fields' });

  const websiteContext = websiteSummary
    ? 'Current website messaging (from ' + website + '):\n' + websiteSummary
    : website ? 'Website provided: ' + website + ' (could not be read)' : 'No website provided.';

  const audienceContext = audienceDetail
    ? 'More about the target audience: ' + audienceDetail
    : '';

  const prompt = `You are a brand strategy expert specialising in competitive positioning for Australian SMEs.

Business name: ${bizName}
Industry / category: ${industry}
What they do: ${whatYouDo}
Target audience: ${audience}
${audienceContext}
Named competitors: ${competitors}
What they believe makes them different: ${differentiation || 'Not specified'}
${websiteContext}

Return ONLY a JSON object — no preamble, no markdown fences, no extra text:

{
  "currentPositioning": "2-3 sentence summary of how ${bizName} currently positions itself based on their website. Use null if no website info available.",
  "personas": [
    {
      "name": "A realistic first name",
      "role": "Job title or role",
      "companySize": "e.g. 12-person services firm",
      "age": "e.g. 47",
      "frustrations": ["Key frustration 1", "Key frustration 2", "Key frustration 3"],
      "whatTheyWant": "1-2 sentences on what outcome they are actually seeking",
      "buyingTrigger": "What specific moment or event makes them start looking for a solution like this",
      "whatWouldWinThem": "What would make them choose one provider over another — be specific"
    }
  ],
  "competitors": [
    { "name": "Competitor name", "positioning": "1-2 sentence summary of how this competitor positions itself" }
  ],
  "whiteSpace": [
    {
      "opportunity": "Specific white space opportunity — a positioning territory none of the named competitors own",
      "whyItMatters": "1 sentence on why this gap exists in the market",
      "personaFit": "Which persona this resonates with most and why — be specific about the connection"
    }
  ],
  "positioningStatement": "Single positioning statement: For [audience], [business name] is the [category] that [differentiating claim] — unlike [competitors] who [contrast]. Plain English, max 2 sentences.",
  "valueProposition": "2-3 sentence value proposition written in plain English from the customer point of view. Should speak directly to the personas identified."
}

Generate exactly 2 personas and exactly 3 white space opportunities. Make personas feel like real people — specific, grounded, not generic archetypes.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5-20250929', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) { const err = await response.json(); return res.status(response.status).json({ error: err?.error?.message || 'API error' }); }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) { return res.status(500).json({ error: err.message || 'Server error' }); }
}
