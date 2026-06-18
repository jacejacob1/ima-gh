# IMA Guesthouse Booking (Vue + Vite + Vercel API + Postgres)

## Features

- Real inventory of 7 rooms (5 Deluxe @ ₹1,500/day, 2 Executive @ ₹2,000/day) + conference hall
- Public room/hall listing and booking details page
- Booking + guest details persisted to managed Postgres (free Supabase tier or Neon)
- 7-step booking wizard incl. **Referral Doctor** capture and a non-refundable payment notice
- Google Pay / UPI scanner payment + Pay on Arrival option
- OTP-based guest portal login (email OTP), booking history, invoice PDF download
- Booking confirmation and OTP emails (secretary + guest)
- **WhatsApp booking alerts to all 6 admins** via WhatsApp Cloud API
- Pre-checkout feedback saved against bookings
- Role-based backend auth (`admin`, `manager`, `guest`)
- Admin dashboard: 6 admin logins, booking management, analytics (occupancy, revenue, meals),
  and a **booking calendar** with per-date room availability across the 7 rooms

## Default users

- `admin / Admin@123`, `manager / Manager@123` (legacy)
- Six guesthouse admins: `admin1` … `admin6` (password = `ADMIN_DEFAULT_PASSWORD`, default `Admin@123`)

Users are auto-seeded in the database the first time an API route is called. Change the default
password in production by setting `ADMIN_DEFAULT_PASSWORD` before first run.

## Zero-cost backend (Supabase)

The API uses standard Postgres (`pg`), so a **free Supabase project** works with no code changes:

1. Create a project at supabase.com (free tier).
2. Copy the URI connection string from Project Settings → Database → Connection string.
3. Set it as `DATABASE_URL`. Tables, indexes and seed users are created automatically on first call.

## Environment variables

Copy `.env.example` to `.env` (for local `vercel dev`) and set:

- `DATABASE_URL`: Postgres connection string (free Supabase or Neon)
- `JWT_SECRET`: JWT signing secret
- `ADMIN_DEFAULT_PASSWORD`: password seeded for `admin1`…`admin6` (default `Admin@123`)
- `VITE_API_BASE_URL`: keep empty for same-origin in production
- `VITE_IMA_UPI_ID`: UPI ID shown in booking payment step
- `VITE_IMA_UPI_NAME`: payee name shown in UPI QR flow
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`: SMTP provider config
- `MAIL_FROM`: sender identity
- `BOOKING_ALERT_TO`: booking alert recipient (`secretary@imatnsb-hqgh.com`)
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API credentials
- `WHATSAPP_ADMIN_NUMBERS`: comma-separated E.164 digits for all 6 admins (e.g. `9198...,9199...`)
- `WHATSAPP_ADMIN_NUMBER`: legacy single-admin fallback (used only if the list above is empty)
- `OTP_DEBUG`: set `true` only in test to return OTP in API response

## WhatsApp admin alerts

On every new booking the API sends a text alert to each number in `WHATSAPP_ADMIN_NUMBERS`
through the WhatsApp Cloud API. Sends run in parallel and one failure never blocks the others or
the booking itself. To enable: create a Meta WhatsApp Cloud API app, set `WHATSAPP_PHONE_NUMBER_ID`
and `WHATSAPP_ACCESS_TOKEN`, and list the 6 admin numbers in `WHATSAPP_ADMIN_NUMBERS`.

## Local development

```bash
npm install
npx vercel dev
```

This runs frontend and API routes together locally.

## Scripts

- `npm run dev`: frontend-only Vite dev server
- `npm run dev:vercel`: full-stack local mode via Vercel
- `npm run build`: frontend production build
- `npm run lint`: ESLint
- `npm run format`: Prettier

## Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Project settings -> Environment Variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `VITE_IMA_UPI_ID`
   - `VITE_IMA_UPI_NAME`
   - SMTP variables (`SMTP_*`, `MAIL_FROM`)
   - `BOOKING_ALERT_TO=secretary@imatnsb-hqgh.com`
   - `VITE_API_BASE_URL` (empty)
3. Redeploy.

The frontend and backend API run in one Vercel project.
