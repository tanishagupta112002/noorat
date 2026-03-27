# Tanitwirl Setup

## 1) Environment

1. Copy `.env.example` to `.env.local` (or `.env`).
2. Fill all required values.
3. For mobile OTP, set either:
	 - `TWILIO_PHONE_NUMBER`
	 - or `TWILIO_MESSAGING_SERVICE_SID`

## 2) Install + Database

1. `pnpm install`
2. `pnpm prisma generate`
3. `pnpm prisma migrate dev --name init`

## 3) Run App

1. `pnpm dev`
2. Open `http://localhost:3000`

## 4) Provider Onboarding Step 1 (Mobile Verification)

1. Login and open `/provider/onboarding/1_mobile_verification`
2. Enter number in `+91XXXXXXXXXX` format
3. Click `Send OTP`

### Local fallback behavior

- If Twilio does not deliver in local development, UI shows `Dev OTP` so onboarding is not blocked.
- Production does not use this fallback.

## 5) OTP Health Check (Dev only)

- Endpoint: `/api/provider/otp-health`
- Requires logged-in session.
- Checks:
	- Twilio auth validity
	- sender configuration presence
	- OTP secret presence

## 6) Common Twilio reasons for OTP not arriving

1. Trial account but receiver number not verified
2. Invalid sender (`TWILIO_PHONE_NUMBER`) or missing messaging service
3. Geo/carrier restriction on destination country
4. Wrong SID/token pair

## 7) Razorpay setup (Checkout)

Add the following env vars before testing online payment:

- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- NEXT_PUBLIC_RAZORPAY_KEY_ID

Use Razorpay test keys in local development.

