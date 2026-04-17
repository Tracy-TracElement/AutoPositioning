import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  try {
    const entry = await kv.get(sessionId);
    if (!entry) return res.status(404).json({ error: 'Session not found' });
    return res.status(200).json({
      hasPaid: entry.hasPaid || false, name: entry.name || null, email: entry.email || null,
      hasReport: !!entry.reportData, reportData: entry.reportData || null,
      bizName: entry.bizName || null, website: entry.website || null,
    });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
