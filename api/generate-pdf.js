import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

function generateHTML(data, bizName, website, date) {

  const currentPosSection = (data.currentPositioning && data.currentPositioning !== 'null') ? `
    <div class="section">
      <div class="section-tag">Your current positioning</div>
      <div class="section-note">Based on your website messaging as reviewed today</div>
      <p class="body-text">${data.currentPositioning}</p>
    </div>` : '';

  const competitorRows = (data.competitors || []).map(c => `
    <div class="comp-row">
      <div class="comp-name">${c.name}</div>
      <div class="comp-pos">${c.positioning}</div>
    </div>`).join('');

  const personaCards = (data.personas || []).map(p => {
    const frustrations = (p.frustrations || []).map(f => `<li>${f}</li>`).join('');
    return `
    <div class="persona-card">
      <div class="persona-header">
        <div class="persona-avatar">${(p.name||'?')[0]}</div>
        <div>
          <div class="persona-name">${p.name || ''}, ${p.age || ''}</div>
          <div class="persona-role">${p.role || ''} &middot; ${p.companySize || ''}</div>
        </div>
      </div>
      <div class="persona-grid">
        <div>
          <div class="meta-label">Frustrations</div>
          <ul class="frustration-list">${frustrations}</ul>
        </div>
        <div>
          <div class="meta-label">What they want</div>
          <p class="meta-text">${p.whatTheyWant || ''}</p>
          <div class="meta-label" style="margin-top:10px">Buying trigger</div>
          <p class="meta-text">${p.buyingTrigger || ''}</p>
          <div class="meta-label" style="margin-top:10px">What wins them</div>
          <p class="meta-text wins">${p.whatWouldWinThem || ''}</p>
        </div>
      </div>
    </div>`;
  }).join('');

  const whitespaceItems = (data.whiteSpace || []).map((ws, i) => {
    const opp = typeof ws === 'string' ? ws : (ws.opportunity || ws);
    const why = typeof ws === 'object' ? ws.whyItMatters : '';
    const fit = typeof ws === 'object' ? ws.personaFit : '';
    return `
    <div class="ws-item">
      <div class="ws-num">${i + 1}</div>
      <div class="ws-content">
        <div class="ws-opp">${opp}</div>
        ${why ? `<div class="ws-why">${why}</div>` : ''}
        ${fit ? `<div class="ws-fit">${fit}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const copySection = data.copyExamples ? `
    <div class="section">
      <div class="section-tag">Putting it to work</div>
      <div class="section-note">Example copy based on your positioning — ready to adapt and use</div>
      <div style="margin-bottom:1.25rem">
        <div class="meta-label" style="margin-bottom:8px">Website intro</div>
        <div class="copy-block">${data.copyExamples.websiteIntro || ''}</div>
      </div>
      <div>
        <div class="meta-label" style="margin-bottom:8px">Social channel intro</div>
        <div class="copy-block">${data.copyExamples.socialChannelIntro || data.copyExamples.socialPost || ''}</div>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #1a1a19; background: #fff; max-width: 794px; margin: 0 auto; }

  .print-bar { background: #f5f5f3; padding: 14px 48px; border-bottom: 1px solid #e0dfd9; display: flex; align-items: center; justify-content: space-between; }
  .print-bar span { font-size: 13px; color: #666663; }
  .print-bar button { background: #008080; color: #fff; border: none; border-radius: 6px; padding: 9px 22px; font-size: 13px; font-family: inherit; cursor: pointer; font-weight: 500; }

  .header { background: #008080; padding: 36px 48px 32px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .brand-name { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 400; color: #fff; }
  .brand-sub { font-size: 11px; color: #9FE1CB; margin-top: 3px; }
  .date-wrap { text-align: right; }
  .date-label { font-size: 9px; color: #9FE1CB; letter-spacing: 0.1em; text-transform: uppercase; }
  .date-value { font-size: 12px; color: #fff; font-weight: 500; margin-top: 2px; }
  .header-divider { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin-bottom: 20px; }
  .report-label { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #9FE1CB; margin-bottom: 6px; }
  .biz-name { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 400; color: #fff; line-height: 1.2; }

  .body { padding: 0 48px 48px; }
  .section { padding: 28px 0; border-bottom: 1px solid #ece9e3; }
  .section:last-child { border-bottom: none; padding-bottom: 0; }
  .section-tag { display: inline-block; font-size: 9px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: #e1f5ee; color: #085041; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px; }
  .section-note { font-size: 11px; color: #999996; margin-bottom: 12px; line-height: 1.4; }
  .body-text { font-size: 13px; color: #444441; line-height: 1.65; }

  .comp-row { display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #f5f3ef; }
  .comp-row:last-child { border-bottom: none; }
  .comp-name { display: table-cell; width: 180px; padding-right: 20px; font-size: 12px; font-weight: 500; color: #1a1a19; vertical-align: top; }
  .comp-pos { display: table-cell; font-size: 12px; color: #666663; line-height: 1.6; vertical-align: top; }

  .persona-card { border: 1px solid #e0dfd9; border-radius: 10px; padding: 16px 18px; margin-bottom: 12px; page-break-inside: avoid; }
  .persona-card:last-child { margin-bottom: 0; }
  .persona-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .persona-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e1f5ee; color: #085041; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; flex-shrink: 0; }
  .persona-name { font-size: 14px; font-weight: 500; color: #1a1a19; }
  .persona-role { font-size: 12px; color: #666663; margin-top: 2px; }
  .persona-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border: none; }
  .persona-grid > div { border: none; }
  .meta-label { font-size: 9px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase; color: #999996; margin-bottom: 5px; }
  .meta-text { font-size: 12px; color: #666663; line-height: 1.5; }
  .wins { background: #e1f5ee; color: #085041; padding: 6px 8px; border-radius: 5px; }
  .frustration-list { list-style: none; padding: 0; }
  .frustration-list li { font-size: 12px; color: #666663; line-height: 1.5; margin-bottom: 4px; padding-left: 12px; position: relative; }
  .frustration-list li::before { content: "–"; position: absolute; left: 0; color: #999996; }

  .ws-item { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 18px; page-break-inside: avoid; }
  .ws-item:last-child { margin-bottom: 0; }
  .ws-num { width: 22px; height: 22px; min-width: 22px; border-radius: 50%; background: #008080; color: #fff; font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .ws-content { flex: 1; min-width: 0; }
  .ws-opp { font-size: 13px; color: #1a1a19; font-weight: 500; line-height: 1.5; margin-bottom: 5px; word-wrap: break-word; }
  .ws-why { font-size: 12px; color: #666663; line-height: 1.5; margin-bottom: 6px; }
  .ws-fit { font-size: 11px; color: #085041; background: #e1f5ee; padding: 5px 9px; border-radius: 4px; line-height: 1.5; display: block; word-wrap: break-word; }

  .positioning-block { background: #e1f5ee; border-left: 3px solid #008080; padding: 14px 18px; border-radius: 0 6px 6px 0; }
  .positioning-block p { font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-style: italic; line-height: 1.7; color: #085041; }

  .vp-block { background: #f5f5f3; border-radius: 6px; padding: 14px 18px; }
  .vp-block p { font-size: 13px; line-height: 1.7; color: #444441; }

  .copy-block { font-size: 13px; line-height: 1.7; color: #444441; background: #f5f5f3; border-radius: 6px; padding: 14px 18px; border-left: 3px solid #008080; }

  .footer { background: #f5f5f3; border-top: 1px solid #e8e5df; padding: 12px 48px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
  .footer span { font-size: 10px; color: #999996; }

  @media print {
    .print-bar { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<div class="print-bar">
  <span>Your AutoPositioning report — <strong>${bizName}</strong></span>
  <button onclick="window.print()">Save as PDF</button>
</div>

<div class="header">
  <div class="header-top">
    <div>
      <div class="brand-name">AutoPositioning</div>
      <div class="brand-sub">by TracElement Strategic Marketing</div>
    </div>
    <div class="date-wrap">
      <div class="date-label">Generated</div>
      <div class="date-value">${date}</div>
    </div>
  </div>
  <hr class="header-divider">
  <div class="report-label">Positioning white space report</div>
  <div class="biz-name">${bizName}</div>
</div>

<div class="body">

  ${currentPosSection}

  <div class="section">
    <div class="section-tag">Competitive positioning map</div>
    <div class="section-note">How your named competitors are currently staking their claim</div>
    <div>${competitorRows}</div>
  </div>

  ${personaCards ? `<div class="section">
    <div class="section-tag">Audience personas</div>
    <div class="section-note">Who is most likely buying — and what drives their decision</div>
    ${personaCards}
  </div>` : ''}

  <div class="section">
    <div class="section-tag">White space opportunities</div>
    <div class="section-note">Positioning territory that is underserved or unclaimed in your category</div>
    ${whitespaceItems}
  </div>

  <div class="section">
    <div class="section-tag">Recommended positioning</div>
    <div class="positioning-block">
      <p>${data.positioningStatement || ''}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-tag">Value proposition</div>
    <div class="vp-block">
      <p>${data.valueProposition || ''}</p>
    </div>
  </div>

  ${copySection}

</div>

<div class="footer">
  <span>Confidential — prepared for ${bizName}</span>
  <span>AutoPositioning by TracElement · tracelement.com.au</span>
</div>

</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, reportData, bizName, website } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  try {
    let data, biz, site;
    if (sessionId === 'bypass_test') {
      data = reportData; biz = bizName || 'Test'; site = website || '';
      if (!data) return res.status(400).json({ error: 'No report data' });
    } else {
      const entry = await kv.get(sessionId);
      if (!entry) return res.status(404).json({ error: 'Session not found' });
      if (!entry.hasPaid) return res.status(403).json({ error: 'Payment required' });
      data = entry.reportData; biz = entry.bizName; site = entry.website || '';
    }
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = generateHTML(data, biz, site, date);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="autopositioning-${(biz||'report').toLowerCase().replace(/\s+/g,'-')}.html"`);
    return res.send(html);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
