# IMA Guesthouse Booking (Vue + Vite + Vercel API + Postgres)

## Features

- Public room/hall listing and booking details page
- Booking + guest details persisted to managed Postgres (Neon/Supabase)
- Pre-checkout feedback saved against bookings
- Role-based backend auth (`admin`, `manager`)
- Admin dashboard for room/hall blocking and booking management
- Vercel-ready full stack deployment (frontend + API functions)

## Default users

- `admin / Admin@123`
- `manager / Manager@123`

Users are auto-seeded in the database the first time an API route is called.

## Environment variables

Copy `.env.example` to `.env` (for local `vercel dev`) and set:

- `DATABASE_URL`: Postgres connection string (Neon or Supabase)
- `JWT_SECRET`: JWT signing secret
- `VITE_API_BASE_URL`: leave empty for same-origin in production

## Local development

```bash
npm install
npx vercel dev
```

This runs both frontend and API routes together locally.

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
   - `VITE_API_BASE_URL` (empty)
3. Redeploy.

The frontend and backend API will run in one Vercel project.
