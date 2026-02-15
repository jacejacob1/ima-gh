import { signGuestToken } from '../_lib/auth.js';
import { query } from '../_lib/db.js';
import { badRequest, json, methodNotAllowed } from '../_lib/http.js';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { guestName, guestEmail, guestPhone, otpCode } = req.body || {};
  if (!guestName || !guestEmail || !guestPhone || !otpCode) {
    return badRequest(res, 'guestName, guestEmail, guestPhone and otpCode are required.');
  }

  const normalizedPhone = normalizePhone(guestPhone);

  const otpResult = await query(
    `
      SELECT id, otp_code, expires_at
      FROM guest_otps
      WHERE guest_phone = $1 AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [normalizedPhone]
  );

  const otpRow = otpResult.rows[0];
  if (!otpRow) {
    return badRequest(res, 'OTP not found. Request a new code.');
  }

  if (new Date(otpRow.expires_at).getTime() <= Date.now()) {
    return badRequest(res, 'OTP expired. Request a new code.');
  }

  if (String(otpCode).trim() !== otpRow.otp_code) {
    return badRequest(res, 'Invalid OTP code.');
  }

  await query('UPDATE guest_otps SET consumed_at = NOW() WHERE id = $1', [otpRow.id]);

  const upsertResult = await query(
    `
      INSERT INTO guest_users (guest_name, guest_email, guest_phone, last_login_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (guest_phone)
      DO UPDATE SET guest_name = EXCLUDED.guest_name, guest_email = EXCLUDED.guest_email, last_login_at = NOW()
      RETURNING id, guest_name, guest_email, guest_phone
    `,
    [String(guestName).trim(), String(guestEmail).trim(), normalizedPhone]
  );

  const guest = upsertResult.rows[0];
  const token = signGuestToken({
    id: guest.id,
    guestName: guest.guest_name,
    guestEmail: guest.guest_email,
    guestPhone: guest.guest_phone,
  });

  return json(res, 200, {
    token,
    guest: {
      guestName: guest.guest_name,
      guestEmail: guest.guest_email,
      guestPhone: guest.guest_phone,
    },
  });
}
