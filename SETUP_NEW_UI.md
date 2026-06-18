# IMA Guesthouse (new UI) — deploy notes

This repo is now a **full-stack app**:

- **Front-end:** `project/index.html` — a self-contained React page (React + Babel via CDN, no build step). The inlined logo and the whole app live in this one file.
- **Backend:** `api/[...route].js` + `lib/*` — Vercel serverless functions, talking to the same **Supabase** Postgres already set up.
- The booking form now **saves to Supabase** and (when configured) fires **WhatsApp alerts to all 6 admins**.
- **Admin dashboard:** footer → **Staff Login** (or visit and pick Admin). Log in as `admin1`…`admin6` / `Admin@123`. Shows summary cards, a booking calendar with per-date room availability, and the full bookings list.

## What changed vs the old Vue repo

The previous Vercel project was a Vite build (`framework: vite`, output `dist`). This repo is **static front-end + serverless functions, no build**. So after pushing, update the Vercel project settings:

1. **Settings → General → Framework Preset → `Other`**
2. **Build Command:** leave empty / "Override" off
3. **Output Directory:** `project` (already set in `vercel.json`)
4. The `api/` folder is auto-detected as serverless functions.

## Environment variables (Vercel → Settings → Environment Variables)

```
DATABASE_URL = postgresql://postgres.kzfepdiflhqhrkryvnyw:<DB_PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET   = <your-jwt-secret>
ADMIN_DEFAULT_PASSWORD = Admin@123
BOOKING_ALERT_TO = secretary@imatnsb-hqgh.com
```

> The real values are in your local `.env` (gitignored) and in `DEPLOY_GUIDE.md` (also gitignored).
> Never commit the actual `DATABASE_URL` password or `JWT_SECRET`.

Add the `SMTP_*` and `WHATSAPP_*` values later to turn on emails and the 6-admin WhatsApp alerts (see `.env.example`). The site works without them — bookings still save.

> Verify the `DATABASE_URL` host against Supabase → **Connect → Transaction pooler** (it should read `aws-0-ap-south-1.pooler.supabase.com`).

## Room inventory & pricing

- 5 Deluxe rooms (`D101`–`D105`) @ ₹1,500/night
- 2 Executive rooms (`E201`–`E202`) @ ₹2,000/night
- Conference hall (`H01`)

Defined in `lib/inventory.js`; the booking form's room list uses the same IDs.

## Note on `project/components/*.jsx`

Those are the original modular source copies. The **served file is `project/index.html`** — the app source lives in its `text/babel` block, which is where my changes were applied. If you edit the app, edit `index.html` (or regenerate it). The loose `.jsx` files aren't loaded at runtime.

## Local run

```bash
npm install
npx vercel dev
```
