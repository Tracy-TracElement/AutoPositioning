import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Name required' });
  try {
    const id = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const entry = { id, name: name.trim(), email: email.trim().toLowerCase(), capturedAt: new Date().toISOString(), hasPaid: false };
    await kv.set(id, entry);
    const index = (await kv.get('lead_index')) || [];
    index.unshift({ id, name: entry.name, email: entry.email, capturedAt: entry.capturedAt, hasPaid: false });
    if (index.length > 500) index.splice(500);
    await kv.set('lead_index', index);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://' + req.headers.host;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'aud', product_data: { name: 'AutoPositioning Report', description: 'Competitive white space analysis — positioning statement and value proposition included' }, unit_amount: parseInt(process.env.REPORT_PRICE_CENTS || '4700') }, quantity: 1 }],
      mode: 'payment', customer_email: entry.email,
      success_url: baseUrl + '/?session=' + id + '&payment=success',
      cancel_url: baseUrl + '/?payment=cancelled',
      metadata: { sessionId: id },
    });
    return res.status(200).json({ checkoutUrl: session.url });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
