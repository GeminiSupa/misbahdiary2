# Stripe Subscription Setup Guide

## Required Stripe Credentials

You need the following from your Stripe Dashboard (https://dashboard.stripe.com):

### 1. API Keys
- **STRIPE_SECRET_KEY**: Your Stripe secret key (starts with `sk_test_` for test mode or `sk_live_` for production)
- **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: Your Stripe publishable key (starts with `pk_test_` for test mode or `pk_live_` for production)

### 2. Webhook Secret
- **STRIPE_WEBHOOK_SECRET**: Webhook signing secret (starts with `whsec_`)

### 3. Application URL
- **NEXT_PUBLIC_APP_URL**: Your application URL (e.g., `http://localhost:3000` for development or `https://yourdomain.com` for production)

## Setup Steps

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** and **Publishable key**
3. Add them to your `.env.local` file:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Step 2: Create a Product and Price in Stripe

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Fill in:
   - **Name**: Professional Plan
   - **Description**: Monthly subscription for Lawyer Diary
   - **Pricing**: 
     - Model: Recurring
     - Price: $2.00 USD (or equivalent in your currency)
     - Billing period: Monthly
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_...`)

### Step 3: Update Database with Price ID

Run this SQL in your Supabase SQL Editor:

```sql
UPDATE subscription_plans 
SET price_id_stripe = 'price_...' -- Replace with your actual Price ID
WHERE name = 'Professional Plan';
```

### Step 4: Set Up Webhook Endpoint

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL:
   - Development: `http://localhost:3000/api/webhooks/stripe` (use Stripe CLI for local testing)
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 5: Test the Integration

1. Start your development server
2. Go to the subscription page
3. Click "Subscribe Now"
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete the checkout
6. Verify the subscription is activated

## Testing Webhooks Locally

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret starting with `whsec_` that you can use for local testing.

## Environment Variables Summary

Add these to your `.env.local` and production environment:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000 # or your production URL
```

## Contact Information

- **Email**: info@ux4u.online
- **WhatsApp**: +92 325 511 6929
