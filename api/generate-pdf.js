import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

function generateHTML(data, bizName, website, date) {
  const personas = (data.personas || []).map(p => {
    const frusts = (p.frustrations || []).map(f => `<li style="font-size:11px;color:#666663;margin-bottom:3px">${f}</li>`).join('');
    return `<div style="border:1px solid #e0dfd9;border-radius:8px;padding:14px;margin-bottom:10px">
      <div style="font-size:13px;font-weight:bold;color:#1a1a19;margin-bottom:2px">${p.name||''}, ${p.age||''} — ${p.role||''}</div>
      <div style="font-size:11px;color:#999996;margin-bottom:10px">${p.companySize||''}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:9px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:#999996;margin-bottom:4px">Frustrations</div>
          <ul style="list-style:none;padding:0;margin:0">${frusts}</ul>
        </div>
        <div>
          <div style="font-size:9px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:#999996;margin-bottom:4px">What wins them over</div>
          <p style="font-size:11px;color:#085041;background:#e1f5ee;padding:6px 8px;border-radius:4px;line-height:1.4;margin:0">${p.whatWouldWinThem||''}</p>
        </div>
      </div>
    </div>`;
  }).join('');

  const competitors = (data.competitors || []).map(c =>
    `<tr><td style="font-size:12px;font-weight:bold;color:#1a1a19;width:140px;padding:9px 12px 9px 0;vertical-align:top;border-bottom:1px solid #f5f3ef">${c.name}</td><td style="font-size:12px;color:#666663;line-height:1.55;padding:9px 0;vertical-align:top;border-bottom:1px solid #f5f3ef">${c.positioning}</td></tr>`
  ).join('');

  const whitespace = (data.whiteSpace || []).map((ws, i) => {
    const opp = typeof ws === 'string' ? ws : (ws.opportunity || '');
    const why = typeof ws === 'object' ? ws.whyItMatters : '';
    const fit = typeof ws === 'object' ? ws.personaFit : '';
    return `<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0ede8"><div style="display:flex;gap:12px;align-items:flex-start"><div style="width:22px;height:22px;border-radius:50%;background:#008080;color:#fff;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;min-width:22px">${i+1}</div><div><div style="font-size:13px;color:#1a1a19;font-weight:bold;line-height:1.5;margin-bottom:4px">${opp}</div>${why ? `<div style="font-size:11px;color:#666663;line-height:1.5;margin-bottom:5px">${why}</div>` : ''}${fit ? `<div style="font-size:10px;color:#085041;background:#e1f5ee;padding:4px 8px;border-radius:4px;line-height:1.4">${fit}</div>` : ''}</div></div></div>`;
  }).join('');

  const currentPos = (data.currentPositioning && data.currentPositioning !== 'null') ? `
    <div style="padding:24px 0;border-bottom:1px solid #f0ede8">
      <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:10px">Your current positioning</div>
      <div style="font-size:11px;color:#999996;margin-bottom:12px">Based on your website messaging as reviewed today</div>
      <p style="font-size:13px;color:#444441;line-height:1.65">${data.currentPositioning}</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', Arial, sans-serif; color: #1a1a19; background: #fff; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style>
</head>
<body style="max-width:794px;margin:0 auto">

<div class="no-print" style="background:#f5f5f3;padding:16px 48px;border-bottom:1px solid #e0dfd9;display:flex;align-items:center;justify-content:space-between">
  <span style="font-size:13px;color:#666663">Your AutoPositioning report is ready</span>
  <button onclick="window.print()" style="background:#008080;color:#fff;border:none;border-radius:6px;padding:8px 20px;font-size:13px;cursor:pointer;font-family:inherit">Save as PDF</button>
</div>

<div style="background:#008080;padding:36px 48px 32px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
    <div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:400;color:#fff">AutoPositioning</div>
      <div style="font-size:11px;color:#9FE1CB;margin-top:3px">by TracElement Strategic Marketing</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#9FE1CB;letter-spacing:0.08em;text-transform:uppercase">Generated</div>
      <div style="font-size:12px;color:#fff;font-weight:500;margin-top:2px">${date}</div>
    </div>
  </div>
  <div style="border-top:1px solid rgba(255,255,255,0.2);margin-bottom:20px"></div>
  <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#9FE1CB;margin-bottom:6px">Positioning white space report</div>
  <div style="font-family:'Playfair Display',Georgia,serif;font-size:30px;font-weight:400;color:#fff;line-height:1.2">${bizName}</div>
  ${website ? `<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:6px">${website}</div>` : ''}
</div>

<div style="padding:0 48px 48px">
  ${currentPos}
  <div style="padding:24px 0;border-bottom:1px solid #f0ede8">
    <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:10px">Audience personas</div>
    <div style="font-size:11px;color:#999996;margin-bottom:12px">Who you are really talking to — frustrations, triggers, and what wins them over</div>
    ${personas}
  </div>
  <div style="padding:24px 0;border-bottom:1px solid #f0ede8">
    <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:10px">Competitive positioning map</div>
    <div style="font-size:11px;color:#999996;margin-bottom:12px">How your named competitors are currently staking their claim</div>
    <table style="width:100%;border-collapse:collapse">${competitors}</table>
  </div>
  <div style="padding:24px 0;border-bottom:1px solid #f0ede8">
    <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:10px">White space opportunities</div>
    <div style="font-size:11px;color:#999996;margin-bottom:12px">Positioning territory that is underserved or unclaimed in your category</div>
    ${whitespace}
  </div>
  <div style="padding:24px 0;border-bottom:1px solid #f0ede8">
    <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:12px">Recommended positioning</div>
    <div style="background:#e1f5ee;border-left:3px solid #008080;padding:14px 18px;border-radius:0 6px 6px 0">
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:14px;font-style:italic;line-height:1.7;color:#085041">${data.positioningStatement}</p>
    </div>
  </div>
  <div style="padding:24px 0">
    <div style="display:inline-block;font-size:9px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;background:#e1f5ee;color:#085041;padding:3px 10px;border-radius:20px;margin-bottom:12px">Value proposition</div>
    <div style="background:#f5f5f3;border-radius:6px;padding:14px 18px">
      <p style="font-size:13px;line-height:1.7;color:#444441">${data.valueProposition}</p>
    </div>
  </div>
</div>

<div style="background:#f5f5f3;border-top:1px solid #e8e5df;padding:12px 48px;display:flex;justify-content:space-between;align-items:center">
  <span style="font-size:10px;color:#999996">Prepared for ${bizName}</span>
  <span style="font-size:10px;color:#999996">AutoPositioning by TracElement · tracelement.com.au</span>
</div>

</body></html>`;
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
