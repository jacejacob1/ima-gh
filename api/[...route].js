import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { signAuthToken, signGuestToken, requireAuth } from '../lib/auth.js';
import { serializeBooking } from '../lib/bookings.js';
import { query } from '../lib/db.js';
import { sendBookingConfirmation, sendOtpEmail } from '../lib/email.js';
import {
  badRequest,
  baseUrlFromRequest,
  isValidDateRange,
  json,
  methodNotAllowed,
  toIso,
} from '../lib/http.js';
import { inventory, selectedSpaceLabel } from '../lib/inventory.js';
import { buildInvoiceBuffer } from '../lib/invoice.js';
import { computeBookingAmount } from '../lib/pricing.js';

function segmentsFromReq(req) {
  const value = req.query.route;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function hasBookingConflict(spaceId, checkinIso, checkoutIso) {
  const result = await query(
    `
      SELECT id
      FROM bookings
      WHERE selected_space_id = $1
        AND checkin_datetime < $2::timestamptz
        AND $3::timestamptz < checkout_datetime
      LIMIT 1
    `,
    [spaceId, checkoutIso, checkinIso]
  );
  return Boolean(result.rows[0]);
}

async function blockConflict(spaceId, checkinIso, checkoutIso) {
  const result = await query(
    `
      SELECT id, event_name
      FROM blocked_slots
      WHERE space_id = $1
        AND start_datetime < $2::timestamptz
        AND $3::timestamptz < end_datetime
      LIMIT 1
    `,
    [spaceId, checkoutIso, checkinIso]
  );
  return result.rows[0] || null;
}

function verifyRazorpayPayment(paymentDetails) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay secret is not configured on server.');
  }

  const body = `${paymentDetails.orderId}|${paymentDetails.paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === paymentDetails.signature;
}

async function handleHealth(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  return json(res, 200, { ok: true });
}

async function handleInventory(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const baseUrl = baseUrlFromRequest(req);
  const normalized = inventory.map((item) => ({
    ...item,
    image: item.image.startsWith('http') ? item.image : `${baseUrl}${item.image}`,
    gallery: (item.gallery || []).map((photo) => (photo.startsWith('http') ? photo : `${baseUrl}${photo}`)),
  }));
  return json(res, 200, { inventory: normalized });
}

async function handleAuthLogin(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const { username, password } = req.body || {};
  if (!username || !password) return badRequest(res, 'Username and password are required.');

  const result = await query('SELECT id, username, password_hash, role FROM users WHERE username = $1', [
    String(username).trim(),
  ]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return json(res, 401, { message: 'Invalid credentials.' });
  }

  const token = signAuthToken(user);
  return json(res, 200, { token, user: { username: user.username, role: user.role } });
}

async function handleBookings(req, res) {
  if (req.method === 'GET') {
    const result = await query(
      `
      SELECT id, guest_name, selected_space_label, checkout_datetime
      FROM bookings
      WHERE checkout_datetime > NOW()
      ORDER BY checkout_datetime ASC
    `
    );

    return json(res, 200, {
      bookings: result.rows.map((row) => ({
        id: row.id,
        guestName: row.guest_name,
        selectedSpaceLabel: row.selected_space_label,
        checkoutDateTime: row.checkout_datetime,
      })),
    });
  }

  if (req.method !== 'POST') return methodNotAllowed(res, ['GET', 'POST']);

  const payload = req.body || {};
  const requiredFields = [
    'guestName',
    'guestPhone',
    'guestEmail',
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
  if (missing) return badRequest(res, `${missing} is required.`);
  if (!Array.isArray(payload.meals) || payload.meals.length === 0) {
    return badRequest(res, 'At least one meal must be selected.');
  }
  if (!isValidDateRange(payload.checkinDateTime, payload.checkoutDateTime)) {
    return badRequest(res, 'Invalid checkin/checkout date range.');
  }

  const checkinIso = toIso(payload.checkinDateTime);
  const checkoutIso = toIso(payload.checkoutDateTime);
  const blocked = await blockConflict(payload.selectedSpaceId, checkinIso, checkoutIso);
  if (blocked) return json(res, 409, { message: `Selected slot is blocked for ${blocked.event_name}.` });
  if (await hasBookingConflict(payload.selectedSpaceId, checkinIso, checkoutIso)) {
    return json(res, 409, { message: 'Selected slot already has a booking.' });
  }

  const amount = computeBookingAmount(String(payload.selectedSpaceId), checkinIso, checkoutIso);

  let paymentStatus = payload.paymentMethod === 'Pay on Arrival' ? 'pending' : 'paid';
  let paymentProvider = 'manual';
  let paymentReference = '';

  if (payload.paymentMethod === 'Razorpay Gateway') {
    const details = payload.paymentDetails || {};
    if (!details.orderId || !details.paymentId || !details.signature) {
      return badRequest(res, 'Razorpay payment details are required.');
    }
    if (!verifyRazorpayPayment(details)) {
      return badRequest(res, 'Razorpay signature verification failed.');
    }
    paymentStatus = 'paid';
    paymentProvider = 'razorpay';
    paymentReference = details.paymentId;
  } else if (payload.paymentMethod === 'Google Pay / UPI' || payload.paymentMethod === 'Card / Credit') {
    paymentReference = String((payload.paymentDetails || {}).transactionRef || '');
  }

  const booking = {
    id: `BK-${Date.now()}`,
    invoiceNumber: `INV-${Date.now()}`,
    guestName: String(payload.guestName).trim(),
    guestEmail: String(payload.guestEmail).trim(),
    guestPhone: String(payload.guestPhone).trim(),
    branch: String(payload.branch).trim(),
    idProofType: String(payload.idProofType),
    idProofNumber: String(payload.idProofNumber).trim(),
    hallOrRoom: String(payload.hallOrRoom),
    selectedSpaceId: String(payload.selectedSpaceId),
    selectedSpaceLabel: selectedSpaceLabel(String(payload.selectedSpaceId)),
    checkinDateTime: checkinIso,
    checkoutDateTime: checkoutIso,
    totalAmount: amount.amountInr,
    foodPreference: String(payload.foodPreference),
    meals: payload.meals,
    cabService: String(payload.cabService),
    paymentMethod: String(payload.paymentMethod),
    paymentStatus,
    paymentProvider,
    paymentReference,
    paymentDetails: payload.paymentDetails || {},
    feedback: '',
    createdAt: new Date().toISOString(),
  };

  await query(
    `
      INSERT INTO bookings (
        id, guest_name, guest_email, guest_phone, branch, id_proof_type, id_proof_number,
        hall_or_room, selected_space_id, selected_space_label, checkin_datetime, checkout_datetime,
        total_amount, food_preference, meals_json, cab_service, payment_method, payment_status,
        payment_provider, payment_reference, payment_details_json, invoice_number, feedback_text, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11::timestamptz, $12::timestamptz, $13,
        $14, $15::jsonb, $16, $17, $18, $19, $20, $21::jsonb, $22, $23, $24::timestamptz
      )
    `,
    [
      booking.id,
      booking.guestName,
      booking.guestEmail,
      booking.guestPhone,
      booking.branch,
      booking.idProofType,
      booking.idProofNumber,
      booking.hallOrRoom,
      booking.selectedSpaceId,
      booking.selectedSpaceLabel,
      booking.checkinDateTime,
      booking.checkoutDateTime,
      booking.totalAmount,
      booking.foodPreference,
      JSON.stringify(booking.meals),
      booking.cabService,
      booking.paymentMethod,
      booking.paymentStatus,
      booking.paymentProvider,
      booking.paymentReference,
      JSON.stringify(booking.paymentDetails),
      booking.invoiceNumber,
      booking.feedback,
      booking.createdAt,
    ]
  );

  await query(
    `
      INSERT INTO guest_users (guest_name, guest_email, guest_phone, last_login_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (guest_phone)
      DO UPDATE SET guest_name = EXCLUDED.guest_name, guest_email = EXCLUDED.guest_email, last_login_at = NOW()
    `,
    [booking.guestName, booking.guestEmail, booking.guestPhone]
  );

  try {
    await sendBookingConfirmation(booking);
  } catch {
    // Booking succeeds even if email fails.
  }

  return json(res, 201, {
    booking,
    amountSummary: amount.summary,
    message: 'Booking confirmed. Confirmation email sent to secretary@imatnsb-hqgh.com.',
  });
}

async function handleFeedback(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const { bookingId, note } = req.body || {};
  if (!bookingId || !note) return badRequest(res, 'bookingId and note are required.');

  const result = await query('SELECT id, checkout_datetime FROM bookings WHERE id = $1', [String(bookingId)]);
  const booking = result.rows[0];
  if (!booking) return json(res, 404, { message: 'Booking not found.' });
  if (new Date(booking.checkout_datetime).getTime() <= Date.now()) {
    return badRequest(res, 'Feedback allowed only before checkout.');
  }

  await query('UPDATE bookings SET feedback_text = $1 WHERE id = $2', [String(note).trim(), booking.id]);
  return json(res, 200, { message: 'Feedback saved.' });
}

async function handleBlocks(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const result = await query(
    `
      SELECT id, event_name, space_id, space_label, start_datetime, end_datetime, reason
      FROM blocked_slots
      ORDER BY created_at DESC
    `
  );

  return json(res, 200, {
    blockedSlots: result.rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      spaceId: row.space_id,
      spaceLabel: row.space_label,
      startDateTime: row.start_datetime,
      endDateTime: row.end_datetime,
      reason: row.reason,
    })),
  });
}

async function handlePayments(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const { selectedSpaceId, checkinDateTime, checkoutDateTime } = req.body || {};
  if (!selectedSpaceId || !checkinDateTime || !checkoutDateTime) {
    return badRequest(res, 'selectedSpaceId, checkinDateTime, checkoutDateTime are required.');
  }
  if (!isValidDateRange(checkinDateTime, checkoutDateTime)) {
    return badRequest(res, 'Invalid checkin/checkout date range.');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return badRequest(res, 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const pricing = computeBookingAmount(String(selectedSpaceId), toIso(checkinDateTime), toIso(checkoutDateTime));
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const order = await razorpay.orders.create({
    amount: pricing.amountInr * 100,
    currency: 'INR',
    receipt: `ima_${Date.now()}`,
    notes: { selectedSpaceId: String(selectedSpaceId) },
  });

  return json(res, 200, {
    orderId: order.id,
    amountInr: pricing.amountInr,
    amountPaise: pricing.amountInr * 100,
    currency: 'INR',
    keyId,
    summary: pricing.summary,
  });
}

async function handleAdminBookings(req, res) {
  const user = requireAuth(req, res, ['admin', 'manager']);
  if (!user) return;

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
    return json(res, 200, { bookings: result.rows.map(serializeBooking) });
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return json(res, 403, { message: 'Insufficient permissions.' });

    const bookingId = String(req.query.id || '').trim();
    if (!bookingId) return badRequest(res, 'id query parameter is required.');

    const result = await query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    if (!result.rowCount) return json(res, 404, { message: 'Booking not found.' });
    return json(res, 200, { message: 'Booking removed.' });
  }

  return methodNotAllowed(res, ['GET', 'DELETE']);
}

async function handleAdminBlocks(req, res) {
  const user = requireAuth(req, res, ['admin']);
  if (!user) return;

  if (req.method === 'POST') {
    const payload = req.body || {};
    const required = ['eventName', 'spaceId', 'startDateTime', 'endDateTime', 'reason'];
    const missing = required.find((field) => !payload[field]);
    if (missing) return badRequest(res, `${missing} is required.`);
    if (!isValidDateRange(payload.startDateTime, payload.endDateTime)) {
      return badRequest(res, 'Invalid block time range.');
    }

    const startIso = toIso(payload.startDateTime);
    const endIso = toIso(payload.endDateTime);

    if (await hasBookingConflict(payload.spaceId, startIso, endIso)) {
      return json(res, 409, { message: 'Cannot block: existing booking overlaps this range.' });
    }

    await query(
      `
        INSERT INTO blocked_slots (
          id, event_name, space_id, space_label, start_datetime, end_datetime, reason, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9::timestamptz)
      `,
      [
        `BLK-${Date.now()}`,
        String(payload.eventName).trim(),
        String(payload.spaceId),
        selectedSpaceLabel(String(payload.spaceId)),
        startIso,
        endIso,
        String(payload.reason).trim(),
        user.username,
        new Date().toISOString(),
      ]
    );

    return json(res, 201, { message: 'Slot blocked.' });
  }

  if (req.method === 'DELETE') {
    const blockId = String(req.query.id || '').trim();
    if (!blockId) return badRequest(res, 'id query parameter is required.');

    const result = await query('DELETE FROM blocked_slots WHERE id = $1', [blockId]);
    if (!result.rowCount) return json(res, 404, { message: 'Blocked slot not found.' });
    return json(res, 200, { message: 'Blocked slot removed.' });
  }

  return methodNotAllowed(res, ['POST', 'DELETE']);
}

async function handleAdminAnalytics(req, res) {
  const user = requireAuth(req, res, ['admin', 'manager']);
  if (!user) return;
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const [summaryResult, spaceResult, mealResult, trendResult] = await Promise.all([
    query(
      `
        SELECT
          COUNT(*)::int AS total_bookings,
          COUNT(*) FILTER (WHERE checkout_datetime > NOW())::int AS active_bookings,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::int AS paid_revenue,
          COUNT(*) FILTER (WHERE payment_status <> 'paid')::int AS pending_payments
        FROM bookings
      `
    ),
    query(
      `
        SELECT selected_space_label, COUNT(*)::int AS count
        FROM bookings
        GROUP BY selected_space_label
        ORDER BY count DESC
      `
    ),
    query(
      `
        SELECT
          COALESCE(SUM((meals_json ? 'Breakfast')::int), 0)::int AS breakfast,
          COALESCE(SUM((meals_json ? 'Lunch')::int), 0)::int AS lunch,
          COALESCE(SUM((meals_json ? 'Dinner')::int), 0)::int AS dinner
        FROM bookings
      `
    ),
    query(
      `
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COALESCE(SUM(total_amount), 0)::int AS revenue
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `
    ),
  ]);

  const summary = summaryResult.rows[0] || {
    total_bookings: 0,
    active_bookings: 0,
    paid_revenue: 0,
    pending_payments: 0,
  };

  return json(res, 200, {
    summary: {
      totalBookings: summary.total_bookings,
      activeBookings: summary.active_bookings,
      paidRevenue: summary.paid_revenue,
      pendingPayments: summary.pending_payments,
    },
    bookingsBySpace: spaceResult.rows.map((row) => ({ label: row.selected_space_label, count: row.count })),
    mealDemand: {
      breakfast: mealResult.rows[0]?.breakfast || 0,
      lunch: mealResult.rows[0]?.lunch || 0,
      dinner: mealResult.rows[0]?.dinner || 0,
    },
    monthlyRevenue: trendResult.rows.map((row) => ({ month: row.month, revenue: row.revenue })),
  });
}

async function handleGuestAuth(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const action = String(req.query.action || req.body?.action || '').toLowerCase();
  if (action === 'request') {
    const { guestName, guestEmail, guestPhone } = req.body || {};
    if (!guestName || !guestEmail || !guestPhone) {
      return badRequest(res, 'guestName, guestEmail and guestPhone are required.');
    }

    const normalizedPhone = normalizePhone(guestPhone);
    if (normalizedPhone.length < 10) return badRequest(res, 'Enter a valid phone number.');

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

  if (action === 'verify') {
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
    if (!otpRow) return badRequest(res, 'OTP not found. Request a new code.');
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

  return badRequest(res, 'action must be request or verify.');
}

async function handleGuestBookings(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  const user = requireAuth(req, res, []);
  if (!user) return;

  const bookingId = String(req.query.bookingId || '').trim();
  if (!bookingId) {
    if (user.role !== 'guest') return json(res, 403, { message: 'Guests only.' });

    const result = await query(
      'SELECT * FROM bookings WHERE guest_phone = $1 ORDER BY checkin_datetime DESC',
      [user.guestPhone]
    );
    return json(res, 200, { bookings: result.rows.map(serializeBooking) });
  }

  const result = await query('SELECT * FROM bookings WHERE id = $1 LIMIT 1', [bookingId]);
  const row = result.rows[0];
  if (!row) return json(res, 404, { message: 'Booking not found.' });
  if (user.role === 'guest' && user.guestPhone !== row.guest_phone) {
    return json(res, 403, { message: 'You cannot access this invoice.' });
  }

  const booking = serializeBooking(row);
  const mode = String(req.query.mode || '').toLowerCase();
  if (mode === 'json') return json(res, 200, { booking });

  const download = String(req.query.download || '').toLowerCase();
  if (download !== 'true') {
    return badRequest(res, 'Set download=true or mode=json for bookingId access.');
  }

  const pdfBuffer = await buildInvoiceBuffer(booking);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${booking.invoiceNumber || booking.id}.pdf"`);
  return res.status(200).send(pdfBuffer);
}

export default async function handler(req, res) {
  const segments = segmentsFromReq(req);

  if (segments.length === 0) {
    return json(res, 200, { message: 'IMA Guesthouse API' });
  }

  if (segments[0] === 'health') return handleHealth(req, res);
  if (segments[0] === 'inventory') return handleInventory(req, res);
  if (segments[0] === 'bookings') return handleBookings(req, res);
  if (segments[0] === 'feedback') return handleFeedback(req, res);
  if (segments[0] === 'blocks') return handleBlocks(req, res);
  if (segments[0] === 'payments') return handlePayments(req, res);

  if (segments[0] === 'auth' && segments[1] === 'login') return handleAuthLogin(req, res);

  if (segments[0] === 'admin' && segments[1] === 'bookings') return handleAdminBookings(req, res);
  if (segments[0] === 'admin' && segments[1] === 'blocks') return handleAdminBlocks(req, res);
  if (segments[0] === 'admin' && segments[1] === 'analytics') return handleAdminAnalytics(req, res);

  if (segments[0] === 'guest' && segments[1] === 'auth') return handleGuestAuth(req, res);
  if (segments[0] === 'guest' && segments[1] === 'bookings') return handleGuestBookings(req, res);

  return json(res, 404, { message: 'API route not found.' });
}
