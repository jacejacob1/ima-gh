import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required for API functions.');
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
});

let initialized = false;
let initPromise;

async function seedUser(username, password, role) {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `,
    [username, hash, role]
  );
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL DEFAULT '',
      guest_phone TEXT NOT NULL DEFAULT '',
      branch TEXT NOT NULL,
      id_proof_type TEXT NOT NULL,
      id_proof_number TEXT NOT NULL,
      hall_or_room TEXT NOT NULL,
      selected_space_id TEXT NOT NULL,
      selected_space_label TEXT NOT NULL,
      checkin_datetime TIMESTAMPTZ NOT NULL,
      checkout_datetime TIMESTAMPTZ NOT NULL,
      total_amount INTEGER NOT NULL DEFAULT 0,
      food_preference TEXT NOT NULL,
      meals_json JSONB NOT NULL,
      cab_service TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_provider TEXT NOT NULL DEFAULT '',
      payment_reference TEXT NOT NULL DEFAULT '',
      payment_details_json JSONB NOT NULL,
      invoice_number TEXT NOT NULL DEFAULT '',
      feedback_text TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      space_id TEXT NOT NULL,
      space_label TEXT NOT NULL,
      start_datetime TIMESTAMPTZ NOT NULL,
      end_datetime TIMESTAMPTZ NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS guest_users (
      id BIGSERIAL PRIMARY KEY,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS guest_otps (
      id BIGSERIAL PRIMARY KEY,
      guest_phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      consumed_at TIMESTAMPTZ NULL
    );
  `);

  await pool.query(`
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email TEXT NOT NULL DEFAULT '';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_phone TEXT NOT NULL DEFAULT '';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_amount INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT '';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT NOT NULL DEFAULT '';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invoice_number TEXT NOT NULL DEFAULT '';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referral_doctor TEXT NOT NULL DEFAULT '';
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone ON bookings (guest_phone);
    CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_guest_otps_phone_created ON guest_otps (guest_phone, created_at DESC);
  `);

  // Legacy/default accounts (kept for backward compatibility).
  await seedUser('admin', 'Admin@123', 'admin');
  await seedUser('manager', 'Manager@123', 'manager');

  // Six guesthouse admins. Each can log in to view bookings, the calendar and
  // room availability. Default password can be overridden with ADMIN_DEFAULT_PASSWORD.
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';
  for (let i = 1; i <= 6; i += 1) {
    await seedUser(`admin${i}`, adminPassword, 'admin');
  }
}

export async function ensureDb() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = initDb().then(() => {
      initialized = true;
    });
  }
  await initPromise;
}

export async function query(text, params = []) {
  await ensureDb();
  return pool.query(text, params);
}
