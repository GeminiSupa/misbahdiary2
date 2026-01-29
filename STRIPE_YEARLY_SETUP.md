# Stripe Yearly Subscription Setup Guide

## Overview

This guide explains how to set up the yearly subscription option (4999 PKR/year) in Stripe and connect it to your application.

## Prerequisites

- Stripe account with API keys configured
- Existing monthly subscription price already set up
- Database migration `add_yearly_subscription.sql` has been run

## Step 1: Create Yearly Price in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Navigate to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
   - Find your "Professional Plan" product (the one with the monthly price)

2. **Add Yearly Price**
   - Click on the "Professional Plan" product
   - Click "Add another price" button
   - Fill in the details:
     - **Price**: `4999.00`
     - **Currency**: PKR (or your local currency)
     - **Billing period**: Yearly
     - **Recurring**: Yes (check this box)
   - Click "Save price"

3. **Copy the Price ID**
   - After saving, you'll see a new price with ID starting with `price_...`
   - Copy this Price ID (you'll need it in the next step)

## Step 2: Update Database with Yearly Price ID

1. **Go to Supabase Dashboard**
   - Navigate to SQL Editor
   - Create a new query

2. **Run this SQL** (replace `price_YOUR_YEARLY_PRICE_ID` with the actual Price ID from Step 1):

```sql
UPDATE public.subscription_plans
SET price_id_stripe_yearly = 'price_YOUR_YEARLY_PRICE_ID'
WHERE name = 'Professional Plan';
```

3. **Verify the update**:

```sql
SELECT id, name, price_monthly, price_yearly, price_id_stripe, price_id_stripe_yearly
FROM public.subscription_plans
WHERE name = 'Professional Plan';
```

You should see:
- `price_monthly`: 500.00
- `price_yearly`: 4999.00
- `price_id_stripe`: Your monthly Stripe Price ID
- `price_id_stripe_yearly`: Your yearly Stripe Price ID

## Step 3: Verify Environment Variables

No new environment variables are needed. The existing Stripe keys work for both monthly and yearly subscriptions:

- `STRIPE_SECRET_KEY` ✅ (already set)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ✅ (already set)
- `STRIPE_WEBHOOK_SECRET` ✅ (already set)

## Step 4: Test the Implementation

1. **Deploy the code changes** to your Vercel deployment
2. **Test Monthly Subscription**:
   - Go to `/subscription` page
   - Select "Monthly" toggle
   - Click "Subscribe Now"
   - Verify it redirects to Stripe with monthly price

3. **Test Yearly Subscription**:
   - Go to `/subscription` page
   - Select "Yearly" toggle
   - Verify discount percentage is shown (should be ~17%)
   - Click "Subscribe Now"
   - Verify it redirects to Stripe with yearly price

## Expected Discount Calculation

- Monthly: 500 PKR/month × 12 = 6000 PKR/year
- Yearly: 4999 PKR/year
- Discount: (6000 - 4999) / 6000 = 16.68% ≈ 17%

The UI will automatically calculate and display: "Save 17% with yearly"

## Troubleshooting

### Issue: Yearly toggle not showing
- **Solution**: Make sure the database migration has been run and `price_yearly` column exists

### Issue: "Subscription plan is not configured with Stripe Yearly Price ID"
- **Solution**: Verify that `price_id_stripe_yearly` is set in the database (Step 2)

### Issue: Wrong price showing in Stripe checkout
- **Solution**: Double-check that the Price ID in the database matches the Price ID in Stripe Dashboard

### Issue: Discount not calculating correctly
- **Solution**: Verify `price_yearly` is set to 4999.00 in the database

## Notes

- Both monthly and yearly subscriptions use the same Stripe Product
- The webhook handler automatically handles both billing intervals
- Team members don't need to pay - subscription is per firm, not per user
- Works for both admin-created and email-created accounts
