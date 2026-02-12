# IMA Guesthouse Booking (Vue + Vite + Node API)

## Features

- Public room/hall listing and booking details page
- Bookings and guest details saved in SQLite database
- Pre-checkout feedback saved against bookings
- Role-based backend auth (`admin`, `manager`)
- Admin dashboard for room/hall event blocking and booking management

## Default users

- admin / Admin@123
- manager / Manager@123

## Setup

```bash
cp .env.example .env
npm install
npm run dev:full
```

## Scripts

- `npm run server` start backend API
- `npm run dev` start frontend dev server
- `npm run dev:full` run backend + frontend together
- `npm run build` create frontend production build
- `npm run lint` run ESLint
