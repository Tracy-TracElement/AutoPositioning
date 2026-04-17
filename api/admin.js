import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const adminKey = req.headers['x-admin-key'] || req.query.key;
  if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const { id } = req.query;
    if (id) {
      const entry = await kv.get(id);
      if (!entry) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(entry);
    }
    const index = (await kv.get('lead_index')) || [];
    return res.status(200).json(index);
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
