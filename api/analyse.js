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
- No emojis, no hashtags, no exclamation marks, no curly quotes
- No abstract nouns: do not use clarity, confidence, growth, journey, holistic, seamless, passionate, dedicated, innovative, or solutions
- No generic consulting language: do not use thought leadership, best practice, value-add, synergy, or strategic partner

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
    "socialChannelIntro": "updated social post based on adjusted positioning"
  }
}`;
  } else {
    prompt = `You are a senior brand strategist with 20 years of experience positioning Australian SMEs. You are writing a positioning report for a paying client. Every word must earn its place.

GLOBAL RULES — apply to every single field in the JSON response without exception:
- No emojis. Not one.
- No hashtags.
- No exclamation marks.
- No curly quotes or special characters — straight apostrophes only.
- No abstract nouns: do not use clarity, confidence, growth, journey, holistic, seamless, passionate, dedicated, innovative, or solutions.
- No generic consulting language: do not use 'thought leadership', 'best practice', 'value-add', 'synergy', or 'strategic partner'.
- Only reference specific products or services that ${bizName} actually offers based on information provided in this prompt. Do not invent product names or service descriptions.
- Every section must be written from the audience's perspective — what they experience, feel, need, and gain. Never describe what the business does for itself.

Business: ${bizName}
Industry: ${industry}
What they do: ${whatYouDo.slice(0, 200)}
Target audience: ${audience}${audienceCtx ? '\n' + audienceCtx : ''}
What makes them different: ${differentiation || 'Not specified'}
${websiteCtx}

COMPETITOR DATA (based on their actual websites):
${competitorCtx}

CRITICAL COMPETITOR RULE: Only include competitors whose URLs were explicitly provided above. Do not add, invent, or suggest additional competitors from your own knowledge. The number of competitors in your response must exactly match the number of URLs provided.

Return ONLY valid JSON, no markdown fences:
{
  "currentPositioning": "2-3 sentences describing how ${bizName} currently positions itself — what specific promise it makes, who it appears to be for, and what problem it signals it solves. Be concrete and specific to this business. Do not use generic marketing language. Write as a strategist observing the brand, not as a narrator summarising a promise.",

  "personas": [
    {
      "name": "Realistic Australian first name",
      "role": "Specific job title — not a generic label",
      "companySize": "Specific description e.g. 22-person professional services firm",
      "age": "Specific age e.g. 46",
      "frustrations": [
        "A frustration written exactly as this person would think it — in their own words, not as a business observation",
        "A second specific frustration in their voice",
        "A third specific frustration in their voice"
      ],
      "whatTheyWant": "The outcome this person actually wants to feel or achieve — not what a business provides, but what the customer walks away with",
      "buyingTrigger": "The specific moment, event, or breaking point that makes them start looking for a solution right now",
      "whatWouldWinThem": "What this person needs to believe or see to choose — written as their internal decision criteria, not as a sales pitch"
    },
    {
      "name": "Different realistic Australian first name",
      "role": "Different specific job title",
      "companySize": "Different company size and type",
      "age": "Different specific age",
      "frustrations": [
        "Frustration in their voice",
        "Frustration in their voice",
        "Frustration in their voice"
      ],
      "whatTheyWant": "The outcome they actually want",
      "buyingTrigger": "Their specific trigger moment",
      "whatWouldWinThem": "Their internal decision criteria"
    }
  ],

  "competitors": [
    {
      "name": "Actual business name from the URL provided",
      "positioning": "1-2 sentences on what promise this competitor makes to customers and what position they occupy in the customer's mind. Specific to this brand. Not a description of what they do internally."
    }
  ],

  "whiteSpace": [
    {
      "opportunity": "A specific unmet customer need that no competitor is currently addressing. Written as a customer would describe the gap if asked — not as a strategic concept. Avoid abstract phrases like thought leadership or holistic approach.",
      "whyItMatters": "One sentence on why customers are underserved here — grounded in a real frustration or unmet expectation",
      "personaFit": "Which persona feels this gap most acutely and why it matters specifically to them"
    },
    {
      "opportunity": "Second specific unmet customer need",
      "whyItMatters": "Why customers are underserved here",
      "personaFit": "Which persona and why"
    },
    {
      "opportunity": "Third specific unmet customer need",
      "whyItMatters": "Why customers are underserved here",
      "personaFit": "Which persona and why"
    }
  ],

  "positioningStatement": "A single sharp statement capturing what ${bizName} uniquely offers and who it is for. Do not use the For/is the/that/unlike formula. Write it as a strategist would say it in a client presentation — direct, specific, and memorable. No jargon. No abstract nouns.",

  "valueProposition": "2-3 sentences written entirely from the customer's point of view. Start with the customer's situation or frustration, not with what the business offers. Do not start with the business name. Do not use the word get. Be specific to this industry and this audience.",

  "copyExamples": {
    "websiteIntro": "2-3 sentences for a website hero section written directly to the target audience. Lead with their situation or frustration. Tone: direct, warm, and professional. No slang, no exclamation marks, no emojis. Only reference products or services ${bizName} actually offers.",
    "socialChannelIntro": "2-3 sentences for a social media channel bio. Third person. Focused on what customers get, not what the business does. Plain English. No emojis, no hashtags, no special characters."
  }
}

Generate exactly 2 personas and exactly 3 white space opportunities. Make personas feel like specific real people with names, ages, and frustrations you could recognise. Every word of every section must be written with the audience in mind.`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err?.error?.message || 'API error' });
    }
    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
