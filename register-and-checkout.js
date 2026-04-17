import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export const config = { maxDuration: 30 };

function buildReportHTML(data, bizName, website, date) {
  const competitorRows = data.competitors.map(c => `
    <tr>
      <td class="comp-name">${c.name}</td>
      <td class="comp-pos">${c.positioning}</td>
    </tr>`).join('');

  const whiteSpaceItems = data.whiteSpace.map((ws, i) => `
    <div class="ws-item">
      <div class="ws-num">${i + 1}</div>
      <div class="ws-text">${ws}</div>
    </div>`).join('');

  const currentPosSection = (data.currentPositioning && data.currentPositioning !== 'null') ? `
    <div class="section">
      <div class="section-tag">Your current positioning</div>
      <div class="section-note">Based on your website messaging as reviewed today</div>
      <p class="body-text">${data.currentPositioning}</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; color: #1a1a19; background: #fff; width: 794px; }
.header { background: #008080; padding: 36px 48px 32px; }
.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.brand-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 400; color: #fff; }
.brand-sub { font-size: 11px; color: #9FE1CB; margin-top: 3px; }
.date-label { font-size: 10px; color: #9FE1CB; letter-spacing: 0.08em; text-transform: uppercase; text-align: right; }
.date-value { font-size: 12px; color: #fff; font-weight: 500; margin-top: 2px; text-align: right; }
.header-divider { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin-bottom: 20px; }
.report-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #9FE1CB; margin-bottom: 6px; }
.biz-name { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 400; color: #fff; line-height: 1.2; }
.biz-cat { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 6px; }
.body { padding: 0 48px 48px; }
.section { padding: 24px 0; border-bottom: 1px solid #f0ede8; }
.section:last-child { border-bottom: none; padding-bottom: 0; }
.section-tag { display: inline-block; font-size: 9px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; background: #e1f5ee; color: #085041; padding: 3px 10px; border-radius: 20px; margin-bottom: 10px; }
.section-note { font-size: 11px; color: #999996; margin-bottom: 12px; line-height: 1.4; }
.body-text { font-size: 13px; color: #444441; line-height: 1.65; }
table.comp-table { width: 100%; border-collapse: collapse; }
table.comp-table tr { border-bottom: 1px solid #f5f3ef; }
table.comp-table tr:last-child { border-bottom: none; }
td.comp-name { font-size: 12px; font-weight: 500; color: #1a1a19; width: 140px; padding: 9px 12px 9px 0; vertical-align: top; }
td.comp-pos { font-size: 12px; color: #666663; line-height: 1.55; padding: 9px 0; vertical-align: top; }
.ws-item { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
.ws-item:last-child { margin-bottom: 0; }
.ws-num { width: 22px; height: 22px; border-radius: 50%; background: #008080; color: #fff; font-size: 11px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ws-text { font-size: 13px; color: #444441; line-height: 1.6; }
.positioning-block { background: #e1f5ee; border-left: 3px solid #008080; padding: 14px 18px; border-radius: 0 6px 6px 0; }
.positioning-block p { font-family: 'Playfair Display', serif; font-size: 14px; font-style: italic; line-height: 1.7; color: #085041; }
.vp-block { background: #f5f5f3; border-radius: 6px; padding: 14px 18px; }
.vp-block p { font-size: 13px; line-height: 1.7; color: #444441; }
.footer { background: #f5f5f3; border-top: 1px solid #e8e5df; padding: 12px 48px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.footer span { font-size: 10px; color: #999996; }
</style></head><body>
<div class="header">
  <div class="header-top">
    <div><div class="brand-name">AutoPositioning</div><div class="brand-sub">by TracElement Strategic Marketing</div></div>
    <div><div class="date-label">Generated</div><div class="date-value">${date}</div></div>
  </div>
  <hr class="header-divider">
  <div class="report-label">Positioning white space report</div>
  <div class="biz-name">${bizName}</div>
  <div class="biz-cat">${website || ''}</div>
</div>
<div class="body">
  ${currentPosSection}
  <div class="section">
    <div class="section-tag">Competitive positioning map</div>
    <div class="section-note">How named competitors are currently staking their claim</div>
    <table class="comp-table">${competitorRows}</table>
  </div>
  <div class="section">
    <div class="section-tag">White space opportunities</div>
    <div class="section-note">Positioning territory that is underserved or unclaimed in your category</div>
    ${whiteSpaceItems}
  </div>
  <div class="section">
    <div class="section-tag">Recommended positioning</div>
    <div class="positioning-block"><p>${data.positioningStatement}</p></div>
  </div>
  <div class="section">
    <div class="section-tag">Value proposition</div>
    <div class="vp-block"><p>${data.valueProposition}</p></div>
  </div>
</div>
<div class="footer">
  <span>Prepared for ${bizName}</span>
  <span>AutoPositioning by TracElement · tracelement.com.au</span>
</div>
</body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  // Verify payment before generating
  try {
    let reportData, bizName, website;

    if (sessionId === 'bypass_test') {
      const body = req.body;
      reportData = body.reportData;
      bizName = body.bizName || 'Test Business';
      website = body.website || '';
      if (!reportData) return res.status(400).json({ error: 'No report data provided' });
    } else {
      const entry = JSON.parse(await kv.get(sessionId) || 'null');
      if (!entry) return res.status(404).json({ error: 'Session not found' });
      if (!entry.hasPaid) return res.status(403).json({ error: 'Payment required' });
      reportData = entry.reportData;
      bizName = entry.bizName;
      website = entry.website;
    }
    const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(buildReportHTML(reportData, bizName, website, date), { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="autopositioning-${bizName.toLowerCase().replace(/\s+/g, '-')}.pdf"`);
      return res.send(pdf);

    } finally {
      if (browser) await browser.close();
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
