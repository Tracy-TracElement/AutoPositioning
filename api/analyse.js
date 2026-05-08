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
    "socialChannelIntro": "updated so
