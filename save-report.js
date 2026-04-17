import Stripe from 'stripe';
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).json({ error: 'Webhook error: ' + err.message }); }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.metadata?.sessionId;
    if (sessionId) {
      try {
        const existing = (await kv.get(sessionId)) || {};
        await kv.set(sessionId, { ...existing, hasPaid: true, paidAt: new Date().toISOString(), stripeSessionId: session.id, amountPaid: session.amount_total });
        const index = (await kv.get('lead_index')) || [];
        const idx = index.findIndex(l => l.id === sessionId);
        if (idx > -1) { index[idx].hasPaid = true; index[idx].paidAt = new Date().toISOString(); await kv.set('lead_index', index); }
      } catch (err) { console.error('KV error:', err); }
    }
  }
  return res.status(200).json({ received: true });
}
