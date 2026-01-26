# Stripe Environment Variables Setup

## ⚠️ Security Note
**NEVER commit your Stripe keys to git!** The `.env.local` file is already in `.gitignore`.

## 📝 Add to `.env.local` File

Create or update `.env.local` in your project root:

```bash
# Stripe Live API Keys (you have these)
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Stw2b24eTlheQnEkK69f0hjjiMwsaMYjQmoQTnB7YV4KSbReys6GVTKlNVl7MC9Mz0xGNXpHGXOeHybp4bblEHz00ZCaPZXV1

# Stripe Webhook Secret (get from Stripe Dashboard > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## 🚀 Add to Production (Vercel)

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Add these variables (for Production, Preview, and Development):
   - `STRIPE_SECRET_KEY` = `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`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_51Stw2b24eTlheQnEkK69f0hjjiMwsaMYjQmoQTnB7YV4KSbReys6GVTKlNVl7MC9Mz0xGNXpHGXOeHybp4bblEHz00ZCaPZXV1`
   - `STRIPE_WEBHOOK_SECRET` = (get from Stripe Dashboard)
   - `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`

## ⚠️ Required Next Steps

### 1. Create Product in Stripe
1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name: **Professional Plan**
4. Pricing: **$2.00 USD** (or equivalent), **Recurring monthly**
5. Click "Save product"
6. **Copy the Price ID** (starts with `price_...`)

### 2. Update Database with Price ID
Run this SQL in Supabase SQL Editor:

```sql
UPDATE subscription_plans 
SET price_id_stripe = 'price_...' -- Replace with your actual Price ID from Stripe
WHERE name = 'Professional Plan';
```

### 3. Set Up Webhook Endpoint
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. **Copy the Signing secret** (starts with `whsec_...`)
7. Add it to `STRIPE_WEBHOOK_SECRET` in your environment variables

## ✅ After Setup

1. Restart your development server
2. Test subscription checkout
3. Verify webhook events are being received

## 📞 Contact Support

- **Email**: info@ux4u.online
- **WhatsApp**: +92 325 511 6929
