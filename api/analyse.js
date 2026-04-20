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

CRITICAL: For the competitors section, ONLY include the competitors whose URLs were explicitly provided above. Do NOT add, invent, or suggest any additional competitors from your own knowledge — even if you know of other relevant brands in this category. If a website summary is provided for a URL, use that content. If no summary is available, use your knowledge of that specific URL/brand only. The number of competitors in your response must exactly match the number of URLs provided.

CRITICAL WRITING PRINCIPLE: Every section must be written from the AUDIENCE's perspective — focused on what they experience, feel, need and gain. Never describe what the business does for itself. Always frame output around the customer's world.

Return ONLY valid JSON, no markdown fences:
{
  "currentPositioning": "2-3 sentences on how ${bizName} currently comes across to its audience based on their website — what promise it makes to customers, what problem it signals it solves for them. Written from the customer's point of view, not the business's.",
  "personas": [
    {
      "name": "Realistic first name",
      "role": "Specific job title",
      "companySize": "e.g. 22-person professional services firm",
      "age": "e.g. 46",
      "frustrations": ["A specific frustration this person feels — written as they would think it, not as a business observation", "Specific frustration 2", "Specific frustration 3"],
      "whatTheyWant": "The outcome this person is actually seeking — written as the benefit they want to feel or achieve, not what a business provides",
      "buyingTrigger": "The specific moment or event in their life that makes them start looking for a solution",
      "whatWouldWinThem": "What this person needs to believe or experience to choose — written as their internal decision criteria, not as a sales pitch"
    },
    {
      "name": "Different realistic first name",
      "role": "Different job title",
      "companySize": "e.g. 8-person trade business",
      "age": "e.g. 38",
      "frustrations": ["Specific frustration 1", "Specific frustration 2", "Specific frustration 3"],
      "whatTheyWant": "The outcome this person is actually seeking",
      "buyingTrigger": "The specific moment or event that makes them start looking",
      "whatWouldWinThem": "What this person needs to believe or experience to choose"
    }
  ],
  "competitors": [
    {"name": "Actual business name from URL", "positioning": "1-2 sentences on what promise this competitor makes to customers and what position they occupy in the customer's mind — not a description of what they do internally"}
  ],
  "whiteSpace": [
    {"opportunity": "A specific customer need or desire that no competitor is currently addressing well — written as the gap from the customer's perspective", "whyItMatters": "1 sentence on why customers are underserved here", "personaFit": "Which persona feels this gap most acutely and why it matters to them specifically"}
  ],
  "positioningStatement": "For [specific audience description], [bizName] is the [category] that [customer benefit or transformation] — unlike [competitors] who [contrast from customer perspective].",
  "valueProposition": "2-3 sentences written entirely from the customer's point of view. What does the customer get, feel, or achieve? Start with the customer's situation or frustration, not with what the business offers.",
  "copyExamples": {
    "websiteIntro": "2-3 sentence website hero section intro written directly to the target audience. Lead with their situation or frustration, not with what the business does. Tone: warm and direct but professional. No slang, no exclamation marks, no emojis. Only reference products or services that ${bizName} actually offers.",
    "socialChannelIntro": "2-3 sentences for a social media channel bio. Written in third person but focused on what customers get — not what the business does. Confident and clear. Plain English only. No emojis, no hashtags, no special characters, no curly quotes."
  }
}

Generate exactly 2 personas and exactly 3 white space opportunities. Make personas feel like real specific people. Every word of every section must be written with the audience in mind — their feelings, their words, their world.`;
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
