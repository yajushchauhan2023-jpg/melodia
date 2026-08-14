# Melodia Stripe Billing

This workspace now includes a deploy-ready Next.js billing implementation for Melodia.

## What It Implements

- 30-day free trial with card collected upfront through Stripe Checkout
- Monthly Pro and Elite subscriptions
- Stripe Billing Portal for payment method, invoices, and cancellation management
- Cancel anytime with `cancel_at_period_end`
- Pro to Elite upgrade with immediate proration
- Elite to Pro downgrade scheduled without instant proration
- Dashboard billing UI with current plan, status, trial countdown, next billing date, cancel, upgrade, and portal buttons
- Failed-payment page with friendly recovery copy
- Stripe webhooks for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`
  - `customer.subscription.trial_will_end`
- Resend lifecycle email templates
- Cron endpoints for day 25/day 29 reminders and 7-day past-due expiration
- PostgreSQL Prisma schema for users and email logs

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill Clerk, Stripe, Resend, PostgreSQL, and price ID values.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Run migrations with `npm run prisma:migrate`.
6. Start the app with `npm run dev`.

## Local Stripe Webhooks

Use the Stripe CLI:

```bash
npm run stripe:listen
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Cron Jobs

Call these daily from your hosting provider:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/cron/trial-reminders" \
  -H "Authorization: Bearer $CRON_SECRET"

curl -X POST "$NEXT_PUBLIC_APP_URL/api/cron/expire-past-due" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Important Production Notes

- Premium access is granted only for `trialing` or `active` users.
- `past_due` users receive a warning email and are marked `expired` after 7 days by cron.
- Route-level premium protection should call `requirePremiumAccess()` in server layouts/pages for premium product areas.
- Checkout requires a signed-in Clerk user. Clerk account creation happens through Clerk; Stripe customer and subscription creation happen when the authenticated user starts Checkout.
