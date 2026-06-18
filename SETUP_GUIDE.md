# IMA Guesthouse — Full Setup & Go-Live Guide

This walks you from a fresh clone to a working, deployed site at **zero cost**, with all the new
features running: 7-room inventory, ₹1,500 deluxe pricing, 6 admin logins, the booking calendar,
the Referral Doctor field, the no-refund notice, and WhatsApp alerts to all 6 admins.

Work through the parts in order. Each part ends with a quick check so you know it worked before
moving on.

---

## What you'll set up

| Piece | Service | Cost | Required? |
|------|---------|------|-----------|
| Database | Supabase (Postgres) | Free | **Yes** |
| Hosting + API | Vercel | Free | **Yes** |
| Email (OTP + confirmations) | Gmail SMTP (or Brevo) | Free | Recommended |
| WhatsApp alerts to admins | Meta WhatsApp Cloud API | Free tier | Optional but asked for |
| UPI payment QR | Your UPI ID | Free | Yes (already wired) |

---

## Prerequisites

1. **Node.js 18+** installed (`node -v`).
2. A **GitHub** account (to connect to Vercel).
3. A **Vercel** account (sign in with GitHub).
4. A **Supabase** account.
5. (Email) A Gmail account, or any SMTP provider.
6. (WhatsApp) A **Meta/Facebook** account and a phone number for the business sender.

---

## Part 1 — Database (Supabase, free)

The app uses plain Postgres, so Supabase's free tier works with no code changes. Tables, indexes
and the seed users (admin1–admin6) are created automatically the first time an API route runs.

1. Go to **https://supabase.com → New project**.
2. Pick an organisation, name the project (e.g. `ima-guesthouse`), set a strong **database
   password** (save it), choose a region close to your users (e.g. *Mumbai / ap-south-1*).
3. Wait ~2 minutes for it to provision.
4. Open **Project Settings → Database → Connection string**.
5. Choose the **"Connection pooling"** tab (Transaction mode, port **6543**) — this is the right
   one for serverless functions on Vercel. Copy the **URI**.
   - It looks like:
     `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
6. Replace `[YOUR-PASSWORD]` with the database password from step 2. **This full string is your
   `DATABASE_URL`.**

> Low traffic? The direct connection (port 5432) also works and is simpler, but the pooler is
> safer under Vercel's serverless model. Either is fine for a guesthouse.

**Check:** keep this `DATABASE_URL` handy — you'll paste it in Part 2 and Part 6.

---

## Part 2 — Local environment file (.env)

1. In the project root, copy the template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values. Minimum to run:
   ```env
   DATABASE_URL=postgresql://postgres.xxxx:YOURPASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   JWT_SECRET=<paste a long random string>
   ADMIN_DEFAULT_PASSWORD=ChooseAStrongPassword123

   VITE_API_BASE_URL=
   VITE_IMA_UPI_ID=secretary@imatnsb-hqgh.com
   VITE_IMA_UPI_NAME=IMA Guesthouse
   ```
3. Generate a strong `JWT_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
4. Set `VITE_IMA_UPI_ID` to the **real UPI ID** that should receive payments, and
   `VITE_IMA_UPI_NAME` to the payee name shown on the QR.

> `ADMIN_DEFAULT_PASSWORD` is the password seeded for **admin1…admin6**. Set it **before** the
> first run — it's only applied when the accounts are first created (see Part 8 to change later).

**Check:** `.env` exists and has at least `DATABASE_URL`, `JWT_SECRET`, and the UPI values.

---

## Part 3 — Email (SMTP) for OTP + confirmations

Used for guest-portal OTP login and booking confirmation emails. If you skip this, bookings still
work, but no emails are sent (and OTP login won't deliver a code unless you use `OTP_DEBUG`).

### Option A — Gmail (quickest)

1. Turn on **2-Step Verification** on the Google account.
2. Go to **Google Account → Security → App passwords**, create one for "Mail". You get a
   16-character password.
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=the16charAppPassword
   MAIL_FROM=IMA Guesthouse <youraddress@gmail.com>
   BOOKING_ALERT_TO=secretary@imatnsb-hqgh.com
   ```

### Option B — Brevo / SendGrid (better deliverability)

Create a free account, get SMTP credentials, and fill the same `SMTP_*` fields with the values
they give you.

**Check:** after the app is running (Part 5), request an OTP from the Guest Portal and confirm the
email arrives. For testing without email, set `OTP_DEBUG=true` and the OTP is returned in the API
response.

---

## Part 4 — WhatsApp Cloud API (alerts to all 6 admins)

On every new booking, the backend sends a WhatsApp alert to each number in
`WHATSAPP_ADMIN_NUMBERS`. Here's how to enable it properly.

### 4.1 Create the app and sender

1. Go to **https://developers.facebook.com → My Apps → Create App → "Business"**.
2. Add the **WhatsApp** product.
3. In **WhatsApp → API Setup** you'll see a test sender number, a **Phone number ID**, and a
   temporary access token. For production, add your **own business phone number** and verify it.
4. Copy:
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Access token** → `WHATSAPP_ACCESS_TOKEN`

> The token shown in API Setup is **temporary (24h)**. For a permanent token, create a **System
> User** in Meta Business Settings, assign the app, and generate a non-expiring token. Use that.

5. Add the six admin numbers (international format, digits only, no `+`):
   ```env
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   WHATSAPP_ACCESS_TOKEN=EAAG...long-token...
   WHATSAPP_ADMIN_NUMBERS=9198xxxxxxxx,9199xxxxxxxx,9197xxxxxxxx,9196xxxxxxxx,9195xxxxxxxx,9194xxxxxxxx
   ```

### 4.2 Important: the "24-hour window" rule (read this)

Meta only lets a business send **free-form text** to someone who has messaged the business number
in the **last 24 hours**. Outside that window, business-initiated messages **must use an approved
template**.

What this means for you:

- **Admin alerts** in the current code are free-form text. They will deliver reliably **only if**
  each admin has messaged the business number within 24h. For testing, have each of the 6 admins
  send any message (e.g. "hi") to the business number first — alerts will then arrive.
- **For always-on admin alerts in production**, the correct approach is an **approved admin
  template**. Create one (see 4.3) and tell me — I'll switch the admin function to send that
  template so it works 24/7 regardless of the window.

### 4.3 Guest confirmation template (and optional admin template)

The guest confirmation already uses a **template**. You must create and get it approved:

1. Go to **WhatsApp Manager → Message templates → Create template**.
2. Category: **Utility**. Name: `booking_confirmation` (must match
   `WHATSAPP_GUEST_TEMPLATE_NAME`). Language: **English** (`en`).
3. Body with five variables, e.g.:
   > Hello {{1}}, your booking for {{2}} is confirmed. Check-in {{3}}, check-out {{4}}. Booking ID:
   > {{5}}. — IMA Guesthouse
4. Submit; approval usually takes minutes to a few hours.

> **Language code must match.** The code sends language `en`. If you create the template as
> `en_US`, edit `lib/whatsapp.js` (the `language: { code: 'en' }` line) to `en_US`.

For a production admin template, create a second template (e.g. `admin_booking_alert`) with the
fields you want, get it approved, and ask me to wire it in.

**Check:** WhatsApp is optional to launch. If `WHATSAPP_*` vars are empty, bookings still succeed —
the alert just no-ops.

---

## Part 5 — Run locally and test

The frontend and the API run together with Vercel's dev server.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Install the Vercel CLI and link the project (one time):
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```
3. Start everything:
   ```bash
   npx vercel dev
   ```
   Open the URL it prints (usually `http://localhost:3000`).

> `npm run dev` runs the **frontend only** (no API). Use `vercel dev` so bookings, login, OTP, etc.
> actually work.

**Local test pass:**
- Home page shows **7 rooms** (5 Deluxe at ₹1,500/day, 2 Executive at ₹2,000/day) + the hall.
- Make a booking end-to-end; the wizard includes the **Referral Doctor** field and the
  **no-refund note** on the payment step.
- Log in to **Admin** as `admin1` / your `ADMIN_DEFAULT_PASSWORD`. Open the **Booking Calendar**,
  click the booking's date, and confirm the booking shows and room availability updates.
- (If SMTP set) confirmation email arrives. (If WhatsApp set + 24h window/template) alerts arrive.

---

## Part 6 — Deploy to Vercel (production)

1. Push the project to a **GitHub** repo:
   ```bash
   git init && git add -A && git commit -m "IMA guesthouse updates"
   git branch -M main
   git remote add origin https://github.com/<you>/ima-guesthouse.git
   git push -u origin main
   ```
2. In **Vercel → Add New → Project**, import that repo. The framework is auto-detected as **Vite**
   (already configured in `vercel.json`).
3. Before deploying, open **Settings → Environment Variables** and add **every** variable from your
   `.env`, for the **Production** (and Preview) environments:
   - `DATABASE_URL`, `JWT_SECRET`, `ADMIN_DEFAULT_PASSWORD`
   - `VITE_API_BASE_URL` (leave empty), `VITE_IMA_UPI_ID`, `VITE_IMA_UPI_NAME`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `BOOKING_ALERT_TO`
   - `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_ADMIN_NUMBERS`,
     `WHATSAPP_GUEST_TEMPLATE_NAME`
4. Click **Deploy**.

> **Important about `VITE_` variables:** they are baked in at **build time**. If you change a
> `VITE_*` value later, you must **redeploy** for it to take effect. The non-`VITE_` ones
> (database, SMTP, WhatsApp) are read at runtime by the API.

5. On the first booking or page load, the API auto-creates all tables and seeds the admins.

**Check:** visit your `*.vercel.app` URL and repeat the local test pass.

---

## Part 7 — Go-live checklist

- [ ] Home shows 7 rooms with correct prices (Deluxe ₹1,500, Executive ₹2,000).
- [ ] A test booking saves and appears in **Admin → Manage Bookings** and on the **Calendar**.
- [ ] Calendar date click shows bookings + free/booked status for all 7 rooms.
- [ ] Referral Doctor appears on the review screen, admin card, and invoice PDF.
- [ ] No-refund note shows on the payment step and review.
- [ ] All 6 admins (`admin1`–`admin6`) can log in.
- [ ] Confirmation email received (if SMTP configured).
- [ ] WhatsApp alert received by admins (if WhatsApp configured + template/window satisfied).
- [ ] Guest Portal: OTP login works and invoice PDF downloads.

---

## Part 8 — Admin accounts & day-to-day use

- **Logins:** `admin1` … `admin6` (role *admin*), plus legacy `admin` and `manager`.
- **Password:** whatever you set in `ADMIN_DEFAULT_PASSWORD` (default `Admin@123`).
- **Admins can:** view all bookings, the calendar, room availability, analytics; block rooms/halls
  for events; cancel bookings. Managers can view but not block/cancel.

**Changing an admin password after first deploy:** `ADMIN_DEFAULT_PASSWORD` only applies when the
account is first created. To change it later, run this in Supabase **SQL Editor** (it stores a
bcrypt hash, so generate one and paste it):

```sql
-- Example: set a new hash for admin1
UPDATE users SET password_hash = '<bcrypt-hash>' WHERE username = 'admin1';
```
Generate a hash locally:
```bash
node -e "import('bcryptjs').then(b=>console.log(b.default.hashSync('NewPassword123',10)))"
```

---

## Troubleshooting

| Symptom | Cause / Fix |
|--------|-------------|
| API error `DATABASE_URL is required` | Env var missing in `.env` (local) or Vercel settings. Add it and redeploy. |
| Bookings save but no email | SMTP not set, wrong Gmail **App Password**, or check the **spam** folder. |
| OTP email never arrives | Same as above. For testing, set `OTP_DEBUG=true` to return the OTP in the API response. |
| WhatsApp alert not delivered | Token expired (use a permanent System-User token); number not in `country+number` digits; admin hasn't messaged the business in 24h **and** no template; template not approved or wrong language code. |
| Guest template fails | Template name ≠ `WHATSAPP_GUEST_TEMPLATE_NAME`, not approved, or language mismatch (`en` vs `en_US`). |
| Changed a `VITE_` value but site unchanged | `VITE_*` are build-time — **redeploy**. |
| Prices wrong | Rates live in `lib/inventory.js` (`ratePerDayInr` per room, `halfDayInr`/`fullDayInr` for the hall). |

---

## Where things live (for future edits)

- **Rooms / prices:** `lib/inventory.js`
- **Pricing math:** `lib/pricing.js`
- **API routes + booking insert:** `api/[...route].js`
- **DB schema, indexes, admin seeding:** `lib/db.js`
- **WhatsApp (guest template + 6-admin alerts):** `lib/whatsapp.js`
- **Emails:** `lib/email.js`
- **Invoice PDF:** `lib/invoice.js`
- **All UI (booking wizard, admin calendar, etc.):** `src/App.vue` + `src/style.css`
