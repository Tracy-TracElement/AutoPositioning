# AutoPositioning v4 — Setup Guide
## Pay first, then access the tool

## How the flow works

1. User lands — sees what they get and the price
2. Enters first name, last name, email → clicks "Continue to payment"
3. Stripe Checkout opens → they pay
4. Redirected back → tool unlocks instantly
5. They fill in business details and run the analysis
6. Results on screen → download branded PDF

Session is saved in the browser. If they return later, the tool remembers.

---

## Setup steps

### 1. Create Stripe account
Go to stripe.com → sign up → Developers → API Keys → copy Secret key (sk_live_...)
Use sk_test_... while testing.

### 2. Deploy to Vercel
Push folder to a private GitHub repo → vercel.com → New Project → Import → Deploy.

### 3. Environment variables
In Vercel → Settings → Environment Variables:

ANTHROPIC_API_KEY     your key from console.anthropic.com
STRIPE_SECRET_KEY     sk_live_... from Stripe
STRIPE_WEBHOOK_SECRET whsec_... from Step 4
REPORT_PRICE_CENTS    4700 (= $47 AUD — change any time)
NEXT_PUBLIC_BASE_URL  https://yourdomain.com
ADMIN_KEY             any strong password (for /admin access)

### 4. Stripe webhook
Stripe Dashboard → Developers → Webhooks → Add endpoint
URL: https://yourdomain.vercel.app/api/stripe-webhook
Event: checkout.session.completed
Copy the Signing Secret → add as STRIPE_WEBHOOK_SECRET in Vercel

### 5. Vercel KV
Vercel project → Storage → Create Database → KV → Connect to Project → Redeploy

### 6. Test
Use test key sk_test_... and card 4242 4242 4242 4242 (any future date, any CVC)
Run full flow → confirm lead + payment appear at /admin
Swap to live key when ready

---

## Changing the price
Update REPORT_PRICE_CENTS in Vercel env vars and redeploy.
$27 = 2700 | $47 = 4700 | $97 = 9700

## Your admin dashboard
Go to: https://yourdomain.com/admin
Enter your ADMIN_KEY to see all leads, payments, and conversion rate.

## Cost per $47 report
Stripe: ~$1.10 | Anthropic API: ~$0.10 | Vercel: free | You keep: ~$45.80

---
Built by TracElement Strategic Marketing · tracelement.com.au
