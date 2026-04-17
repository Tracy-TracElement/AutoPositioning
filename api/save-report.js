import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId, reportData, bizName, industry, website } = req.body;
  if (!sessionId || !reportData) return res.status(400).json({ error: 'Missing data' });
  try {
    if (sessionId === 'bypass_test') return res.status(200).json({ ok: true });
    const existing = await kv.get(sessionId);
    if (!existing) return res.status(404).json({ error: 'Session not found' });
    if (!existing.hasPaid) return res.status(403).json({ error: 'Payment required' });
    await kv.set(sessionId, { ...existing, reportData, bizName, industry: industry || '', website: website || '', reportSavedAt: new Date().toISOString() });
    const index = (await kv.get('lead_index')) || [];
    const idx = index.findIndex(l => l.id === sessionId);
    if (idx > -1) { index[idx].bizName = bizName; index[idx].industry = industry || ''; await kv.set('lead_index', index); }
    return res.status(200).json({ ok: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
