import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { inventory, selectedSpaceLabel } from './inventory.js';

const PORT = Number(process.env.PORT || 8787);
const JWT_SECRET = process.env.JWT_SECRET || 'replace-this-in-production';
const DB_PATH = process.env.DB_PATH || './data/ima.db';

const app = express();
const db = new Database(DB_PATH);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
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
      checkin_datetime TEXT NOT NULL,
      checkout_datetime TEXT NOT NULL,
      food_preference TEXT NOT NULL,
      meals_json TEXT NOT NULL,
      cab_service TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_details_json TEXT NOT NULL,
      feedback_text TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      space_id TEXT NOT NULL,
      space_label TEXT NOT NULL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('admin', passwordHash, 'admin', now);
  }

  const existingManager = db.prepare('SELECT id FROM users WHERE username = ?').get('manager');
  if (!existingManager) {
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync('Manager@123', 10);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run('manager', passwordHash, 'manager', now);
  }
}

function toIso(input) {
  return new Date(input).toISOString();
}

function isValidDateRange(startInput, endInput) {
  const start = new Date(startInput).getTime();
  const end = new Date(endInput).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid token.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Token expired or invalid.' });
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    return next();
  };
}

function hasBookingConflict(spaceId, checkinIso, checkoutIso) {
  const row = db
    .prepare(
      `
        SELECT id
        FROM bookings
        WHERE selected_space_id = ?
          AND checkin_datetime < ?
          AND ? < checkout_datetime
        LIMIT 1
      `
    )
    .get(spaceId, checkoutIso, checkinIso);

  return Boolean(row);
}

function hasBlockConflict(spaceId, checkinIso, checkoutIso) {
  const row = db
    .prepare(
      `
        SELECT id, event_name
        FROM blocked_slots
        WHERE space_id = ?
          AND start_datetime < ?
          AND ? < end_datetime
        LIMIT 1
      `
    )
    .get(spaceId, checkoutIso, checkinIso);

  return row || null;
}

function serializeBooking(row) {
  return {
    id: row.id,
    guestName: row.guest_name,
    branch: row.branch,
    idProofType: row.id_proof_type,
    idProofNumber: row.id_proof_number,
    hallOrRoom: row.hall_or_room,
    selectedSpaceId: row.selected_space_id,
    selectedSpaceLabel: row.selected_space_label,
    checkinDateTime: row.checkin_datetime,
    checkoutDateTime: row.checkout_datetime,
    foodPreference: row.food_preference,
    meals: JSON.parse(row.meals_json),
    cabService: row.cab_service,
    paymentMethod: row.payment_method,
    paymentDetails: JSON.parse(row.payment_details_json),
    feedback: row.feedback_text,
    createdAt: row.created_at,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/inventory', (_req, res) => {
  res.json({ inventory });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const user = db
    .prepare('SELECT id, username, password_hash, role FROM users WHERE username = ?')
    .get(String(username).trim());

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
});

app.get('/api/bookings/active', (_req, res) => {
  const now = new Date().toISOString();
  const rows = db
    .prepare(
      `
      SELECT id, guest_name, selected_space_label, checkout_datetime
      FROM bookings
      WHERE checkout_datetime > ?
      ORDER BY checkout_datetime ASC
    `
    )
    .all(now);

  return res.json({
    bookings: rows.map((row) => ({
      id: row.id,
      guestName: row.guest_name,
      selectedSpaceLabel: row.selected_space_label,
      checkoutDateTime: row.checkout_datetime,
    })),
  });
});

app.post('/api/bookings', (req, res) => {
  const payload = req.body || {};
  const requiredFields = [
    'guestName',
    'branch',
    'idProofType',
    'idProofNumber',
    'hallOrRoom',
    'selectedSpaceId',
    'checkinDateTime',
    'checkoutDateTime',
    'foodPreference',
    'cabService',
    'paymentMethod',
  ];

  const missing = requiredFields.find((field) => !payload[field]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required.` });
  }

  if (!Array.isArray(payload.meals) || payload.meals.length === 0) {
    return res.status(400).json({ message: 'At least one meal must be selected.' });
  }

  if (!isValidDateRange(payload.checkinDateTime, payload.checkoutDateTime)) {
    return res.status(400).json({ message: 'Invalid checkin/checkout date range.' });
  }

  const checkinIso = toIso(payload.checkinDateTime);
  const checkoutIso = toIso(payload.checkoutDateTime);

  const blocked = hasBlockConflict(payload.selectedSpaceId, checkinIso, checkoutIso);
  if (blocked) {
    return res.status(409).json({ message: `Selected slot is blocked for ${blocked.event_name}.` });
  }

  if (hasBookingConflict(payload.selectedSpaceId, checkinIso, checkoutIso)) {
    return res.status(409).json({ message: 'Selected slot already has a booking.' });
  }

  const id = `BK-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const booking = {
    id,
    guestName: String(payload.guestName).trim(),
    branch: String(payload.branch).trim(),
    idProofType: String(payload.idProofType),
    idProofNumber: String(payload.idProofNumber).trim(),
    hallOrRoom: String(payload.hallOrRoom),
    selectedSpaceId: String(payload.selectedSpaceId),
    selectedSpaceLabel: selectedSpaceLabel(String(payload.selectedSpaceId)),
    checkinDateTime: checkinIso,
    checkoutDateTime: checkoutIso,
    foodPreference: String(payload.foodPreference),
    meals: payload.meals,
    cabService: String(payload.cabService),
    paymentMethod: String(payload.paymentMethod),
    paymentDetails: payload.paymentDetails || {},
    feedback: '',
    createdAt,
  };

  db.prepare(
    `
      INSERT INTO bookings (
        id,
        guest_name,
        branch,
        id_proof_type,
        id_proof_number,
        hall_or_room,
        selected_space_id,
        selected_space_label,
        checkin_datetime,
        checkout_datetime,
        food_preference,
        meals_json,
        cab_service,
        payment_method,
        payment_details_json,
        feedback_text,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    booking.id,
    booking.guestName,
    booking.branch,
    booking.idProofType,
    booking.idProofNumber,
    booking.hallOrRoom,
    booking.selectedSpaceId,
    booking.selectedSpaceLabel,
    booking.checkinDateTime,
    booking.checkoutDateTime,
    booking.foodPreference,
    JSON.stringify(booking.meals),
    booking.cabService,
    booking.paymentMethod,
    JSON.stringify(booking.paymentDetails),
    booking.feedback,
    booking.createdAt
  );

  return res.status(201).json({ booking });
});

app.post('/api/feedback', (req, res) => {
  const { bookingId, note } = req.body || {};
  if (!bookingId || !note) {
    return res.status(400).json({ message: 'bookingId and note are required.' });
  }

  const booking = db
    .prepare('SELECT id, checkout_datetime FROM bookings WHERE id = ?')
    .get(String(bookingId));

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found.' });
  }

  if (new Date(booking.checkout_datetime).getTime() <= Date.now()) {
    return res.status(400).json({ message: 'Feedback allowed only before checkout.' });
  }

  db.prepare('UPDATE bookings SET feedback_text = ? WHERE id = ?').run(String(note).trim(), booking.id);
  return res.json({ message: 'Feedback saved.' });
});

app.get('/api/admin/bookings', authRequired, requireRoles('admin', 'manager'), (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM bookings ORDER BY created_at DESC')
    .all()
    .map(serializeBooking);

  return res.json({ bookings: rows });
});

app.delete('/api/admin/bookings/:id', authRequired, requireRoles('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Booking not found.' });
  }
  return res.json({ message: 'Booking removed.' });
});

app.get('/api/blocks', (_req, res) => {
  const rows = db
    .prepare('SELECT id, event_name, space_id, space_label, start_datetime, end_datetime, reason FROM blocked_slots ORDER BY created_at DESC')
    .all();

  return res.json({
    blockedSlots: rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      spaceId: row.space_id,
      spaceLabel: row.space_label,
      startDateTime: row.start_datetime,
      endDateTime: row.end_datetime,
      reason: row.reason,
    })),
  });
});

app.post('/api/admin/blocks', authRequired, requireRoles('admin'), (req, res) => {
  const payload = req.body || {};
  const required = ['eventName', 'spaceId', 'startDateTime', 'endDateTime', 'reason'];
  const missing = required.find((field) => !payload[field]);
  if (missing) {
    return res.status(400).json({ message: `${missing} is required.` });
  }

  if (!isValidDateRange(payload.startDateTime, payload.endDateTime)) {
    return res.status(400).json({ message: 'Invalid block time range.' });
  }

  const startIso = toIso(payload.startDateTime);
  const endIso = toIso(payload.endDateTime);

  if (hasBookingConflict(payload.spaceId, startIso, endIso)) {
    return res.status(409).json({ message: 'Cannot block: existing booking overlaps this range.' });
  }

  const id = `BLK-${Date.now()}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO blocked_slots (
        id,
        event_name,
        space_id,
        space_label,
        start_datetime,
        end_datetime,
        reason,
        created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    id,
    String(payload.eventName).trim(),
    String(payload.spaceId),
    selectedSpaceLabel(String(payload.spaceId)),
    startIso,
    endIso,
    String(payload.reason).trim(),
    req.user.username,
    createdAt
  );

  return res.status(201).json({ message: 'Slot blocked.' });
});

app.delete('/api/admin/blocks/:id', authRequired, requireRoles('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM blocked_slots WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ message: 'Blocked slot not found.' });
  }
  return res.json({ message: 'Blocked slot removed.' });
});

initDb();

app.listen(PORT, () => {
  console.log(`IMA API running on http://127.0.0.1:${PORT}`);
});
