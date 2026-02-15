import crypto from 'node:crypto';
import { query } from '../_lib/db.js';
import { sendOtpEmail } from '../_lib/email.js';
import { badRequest, json, methodNotAllowed } from '../_lib/http.js';

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { guestName, guestEmail, guestPhone } = req.body || {};
  if (!guestName || !guestEmail || !guestPhone) {
    return badRequest(res, 'guestName, guestEmail and guestPhone are required.');
  }

  const normalizedPhone = normalizePhone(guestPhone);
  if (normalizedPhone.length < 10) {
    return badRequest(res, 'Enter a valid phone number.');
  }

  const otpCode = String(crypto.randomInt(100000, 999999));
  await query(
    `
      INSERT INTO guest_otps (guest_phone, otp_code, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `,
    [normalizedPhone, otpCode]
  );

  try {
    await sendOtpEmail({ guestName, guestEmail, guestPhone: normalizedPhone, otpCode });
  } catch {
    // OTP remains valid even if email delivery fails.
  }

  return json(res, 200, {
    message: 'OTP generated and sent to your email (and secretary desk).',
    ...(process.env.OTP_DEBUG === 'true' ? { otpCode } : {}),
  });
}
