# noorat

noorat is a Next.js 16 fashion rental marketplace with:

- customer browsing, wishlist, cart, checkout, and order history
- provider onboarding (6 steps), inventory, profile, and dashboard flows
- OTP-based auth and provider mobile verification
- Razorpay payment initiation and verification APIs

## Tech Stack

- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling/UI: Tailwind CSS v4, Radix UI, custom components
- Auth: better-auth (+ Google social sign-in)
- Database: PostgreSQL + Prisma ORM (Prisma 7)
- Payments: Razorpay (online) + COD
- SMS/OTP: Twilio

## Key App Areas

- Public pages: `/`, `/rentals`, `/designer-studios`, `/custom-requests`, `/faq`
- Auth: `/auth`
- Customer dashboard: `/account`, `/profile`, `/wishlist`, `/cart`, `/orders`, `/settings`
- Provider onboarding: `/become-a-provider/onboarding/*`
- Provider panel: `/provider/dashboard`, `/provider/inventory`, `/provider/orders`, `/provider/profile`
- APIs: `src/app/api/**`

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Configure env variables (see table below).

4. Generate Prisma client and run migrations:

```bash
pnpm prisma generate
pnpm prisma migrate dev
```

5. Start development server:

```bash
pnpm dev
```

6. Open http://localhost:3000

## Environment Variables

Copy from `.env.example` and set values as needed.

### Core

- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)
- `BETTER_AUTH_URL` (same as app URL in local)
- `DATABASE_URL`

### Auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`

### Provider Mobile OTP (Twilio)

- `MOBILE_OTP_SECRET`
- `MOBILE_OTP_DEBUG`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- sender config (at least one required):
	- `TWILIO_PHONE_NUMBER`, or
	- `TWILIO_MESSAGING_SERVICE_SID`, or
	- `TWILIO_VERIFY_SERVICE_SID`

### Razorpay

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm prisma generate
pnpm prisma migrate dev
```

## Provider OTP Health Check (Dev)

- Endpoint: `/api/provider/otp-health`
- Method: `GET`
- Requires logged-in session
- Disabled in production

This endpoint validates Twilio credentials and sender configuration so onboarding OTP issues are easier to debug locally.

## Payment Notes

- COD and online (Razorpay) flows are supported.
- `/api/payments/checkout/initiate` creates Razorpay order for online mode.
- `/api/payments/checkout/verify` verifies signature and amount before order creation.

## Deployment (Vercel)

### Option A: Vercel Dashboard

1. Import the GitHub repo into Vercel.
2. Framework preset: Next.js.
3. Add all required environment variables from the list above.
4. Deploy.

### Option B: CLI

```bash
npx vercel
npx vercel --prod
```

Recommended before deploy:

```bash
pnpm build
```

## Important Production Notes

- `uploads/` is local filesystem based. On Vercel, server filesystem is ephemeral.
- For production-grade file persistence, move uploads to object storage (for example S3, Cloudinary, or Vercel Blob).

## Troubleshooting

- OTP not arriving:
	- verify Twilio SID/token
	- ensure one sender is configured
	- verify destination number if account is trial
- Prisma issues:
	- run `pnpm prisma generate`
	- check `DATABASE_URL`
- Payment issues:
	- confirm Razorpay keys
	- ensure `NEXT_PUBLIC_RAZORPAY_KEY_ID` matches backend key pair

