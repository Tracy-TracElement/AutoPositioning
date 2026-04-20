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
  const competitorCtx = competitors.slice(0, 1000);

  let prompt;

  if (adjustmentInstruction && previousResult) {
    prompt = `Brand strategy expert. A positioning analysis was run for "${bizName}" and the user wants one adjustment.

Previous result:
${previousResult.slice(0, 1500)}

Adjustment requested: "${adjustmentInstruction}"

IMPORTANT RULES:
- Keep ALL existing competitors from the previous result — do not remove any
- If the adjustment asks to add a competitor, ADD it to the existing list — do not replace
- If the adjustment asks to change tone, update positioningStatement and valueProposition only
- If the adjustment asks to change personas, update personas only
- Only change what the user has specifically asked for — leave everything else exactly as it was
- Return exactly 2 personas and exactly 3 white space items

Return ONLY valid JSON, no markdown fences:
{
  "currentPositioning": "keep from previous or null",
  "personas": [
    {"name":"","role":"","companySize":"","age":"","frustrations":["","",""],"whatTheyWant":"","buyingTrigger":"","whatWouldWinThem":""},
    {"name":"","role":"","companySize":"","age":"","frustrations":["","",""],"whatTheyWant":"","buyingTrigger":"","whatWouldWinThem":""}
  ],
  "competitors": [{"name":"","positioning":""}],
  "whiteSpace": [{"opportunity":"","whyItMatters":"","personaFit":""},{"opportunity":"","whyItMatters":"","personaFit":""},{"opportunity":"","whyItMatters":"","personaFit":""}],
  "positioningStatement": "",
  "valueProposition": "",
  "copyExamples": {
    "websiteIntro": "updated website intro based on adjusted value proposition",
    "socialPost": "updated social post based on adjusted positioning"
  }
}`;
  } else {
    prompt = `You are a brand strategy expert specialising in competitive positioning for Australian SMEs.

Business: ${bizName}
Industry: ${industry}
What they do: ${whatYouDo.slice(0, 200)}
Target audience: ${audience}${audienceCtx ? '\n' + audienceCtx : ''}
What makes them different: ${differentiation || 'Not specified'}
${websiteCtx}

COMPETITOR DATA (based on their actual websites):
${competitorCtx}

IMPORTANT: For the competitors section, use the actual URLs and website summaries provided above. Name each competitor by their actual business name or domain — do NOT use generic category names like "large agencies" or "freelancers". If a website summary is provided, base the positioning on that real content.

Return ONLY valid JSON, no markdown fences:
{
  "currentPositioning": "2-3 sentences on how ${bizName} currently positions itself based on their website, or null if no website provided",
  "personas": [
    {
      "name": "Realistic first name",
      "role": "Specific job title",
      "companySize": "e.g. 22-person professional services firm",
      "age": "e.g. 46",
      "frustrations": ["Specific frustration 1", "Specific frustration 2", "Specific frustration 3"],
      "whatTheyWant": "The specific outcome they are seeking — 1 sentence",
      "buyingTrigger": "The specific moment or event that makes them start looking",
      "whatWouldWinThem": "What specifically would make them choose one provider over another"
    },
    {
      "name": "Different realistic first name",
      "role": "Different job title",
      "companySize": "e.g. 8-person trade business",
      "age": "e.g. 38",
      "frustrations": ["Specific frustration 1", "Specific frustration 2", "Specific frustration 3"],
      "whatTheyWant": "The specific outcome they are seeking — 1 sentence",
      "buyingTrigger": "The specific moment or event that makes them start looking",
      "whatWouldWinThem": "What specifically would make them choose one provider over another"
    }
  ],
  "competitors": [
    {"name": "Actual business name from URL", "positioning": "1-2 sentences based on their actual website messaging"}
  ],
  "whiteSpace": [
    {"opportunity": "Specific unclaimed positioning territory", "whyItMatters": "1 sentence on why this gap exists", "personaFit": "Which persona this resonates with most and why"}
  ],
  "positioningStatement": "For [audience], [bizName] is the [category] that [differentiating claim] — unlike [competitors] who [contrast].",
  "valueProposition": "2-3 sentences written from the customer point of view in plain English.",
  "copyExamples": {
    "websiteIntro": "2-3 sentence website hero section intro based on the value proposition. Tone: warm and direct, but professional — this will appear on a public-facing website. No slang, no exclamation marks, no emojis. Speak directly to the target audience's real situation. Only reference products or services that ${bizName} actually offers based on the information provided.",
    "socialChannelIntro": "2-3 sentences to use as a social media channel bio or intro — suitable for LinkedIn, Facebook, or Instagram. Tone: confident and clear, written in the third person. Describes what the business does, who it is for, and what makes it different. No emojis. No hashtags. Plain English. Only reference products or services that ${bizName} actually offers based on the information provided."
  }
}

Generate exactly 2 personas and exactly 3 white space opportunities. Make personas feel like real specific people — not generic archetypes.`;
  }

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
