# IMA Guesthouse Booking (Vue + Vite + Vercel API + Postgres)

## Features

- Public room/hall listing and booking details page
- Booking + guest details persisted to managed Postgres (Neon/Supabase)
- Google Pay / UPI scanner payment + Pay on Arrival option
- OTP-based guest portal login (email OTP), booking history, invoice PDF download
- Booking confirmation and OTP emails (secretary + guest)
- Pre-checkout feedback saved against bookings
- Role-based backend auth (`admin`, `manager`, `guest`)
- Admin dashboard with booking management + analytics (occupancy, revenue, meals)

## Default users

- `admin / Admin@123`
- `manager / Manager@123`

Users are auto-seeded in the database the first time an API route is called.

## Environment variables

Copy `.env.example` to `.env` (for local `vercel dev`) and set:

- `DATABASE_URL`: Postgres connection string (Neon or Supabase)
- `JWT_SECRET`: JWT signing secret
- `VITE_API_BASE_URL`: keep empty for same-origin in production
- `VITE_IMA_UPI_ID`: UPI ID shown in booking payment step
- `VITE_IMA_UPI_NAME`: payee name shown in UPI QR flow
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`: SMTP provider config
- `MAIL_FROM`: sender identity
- `BOOKING_ALERT_TO`: booking alert recipient (`secretary@imatnsb-hqgh.com`)
- `OTP_DEBUG`: set `true` only in test to return OTP in API response

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
