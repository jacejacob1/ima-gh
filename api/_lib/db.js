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
      branch TEXT NOT NULL,
      id_proof_type TEXT NOT NULL,
      id_proof_number TEXT NOT NULL,
      hall_or_room TEXT NOT NULL,
      selected_space_id TEXT NOT NULL,
      selected_space_label TEXT NOT NULL,
      checkin_datetime TIMESTAMPTZ NOT NULL,
      checkout_datetime TIMESTAMPTZ NOT NULL,
      food_preference TEXT NOT NULL,
      meals_json JSONB NOT NULL,
      cab_service TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_details_json JSONB NOT NULL,
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
  `);

  await seedUser('admin', 'Admin@123', 'admin');
  await seedUser('manager', 'Manager@123', 'manager');
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
