import crypto from 'node:crypto';
import { query } from '../lib/db.js';
import { selectedSpaceLabel } from '../lib/inventory.js';
import { computeBookingAmount } from '../lib/pricing.js';
import { sendBookingConfirmation } from '../lib/email.js';
import { badRequest, isValidDateRange, json, methodNotAllowed, toIso } from '../lib/http.js';

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

async function getActive(req, res) {
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

async function createBooking(req, res) {
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
    // Booking should still succeed if email fails.
  }

  return json(res, 201, {
    booking,
    amountSummary: amount.summary,
    message: 'Booking confirmed. Confirmation email sent to secretary@imatnsb-hqgh.com.',
  });
}

export default async function handler(req, res) {
  if (req.method === 'GET') return getActive(req, res);
  if (req.method === 'POST') return createBooking(req, res);
  return methodNotAllowed(res, ['GET', 'POST']);
}
