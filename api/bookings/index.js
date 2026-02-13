import { query } from '../_lib/db.js';
import { selectedSpaceLabel } from '../_lib/inventory.js';
import { badRequest, isValidDateRange, json, methodNotAllowed, toIso } from '../_lib/http.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

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
    return badRequest(res, `${missing} is required.`);
  }

  if (!Array.isArray(payload.meals) || payload.meals.length === 0) {
    return badRequest(res, 'At least one meal must be selected.');
  }

  if (!isValidDateRange(payload.checkinDateTime, payload.checkoutDateTime)) {
    return badRequest(res, 'Invalid checkin/checkout date range.');
  }

  const checkinIso = toIso(payload.checkinDateTime);
  const checkoutIso = toIso(payload.checkoutDateTime);

  const blocked = await blockConflict(payload.selectedSpaceId, checkinIso, checkoutIso);
  if (blocked) {
    return json(res, 409, { message: `Selected slot is blocked for ${blocked.event_name}.` });
  }

  if (await hasBookingConflict(payload.selectedSpaceId, checkinIso, checkoutIso)) {
    return json(res, 409, { message: 'Selected slot already has a booking.' });
  }

  const booking = {
    id: `BK-${Date.now()}`,
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
    createdAt: new Date().toISOString(),
  };

  await query(
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
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9::timestamptz, $10::timestamptz, $11, $12::jsonb, $13, $14, $15::jsonb, $16, $17::timestamptz
      )
    `,
    [
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
      booking.createdAt,
    ]
  );

  return json(res, 201, { booking });
}
