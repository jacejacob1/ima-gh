import { requireAuth } from '../../_lib/auth.js';
import { query } from '../../_lib/db.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

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
    meals: row.meals_json,
    cabService: row.cab_service,
    paymentMethod: row.payment_method,
    paymentDetails: row.payment_details_json,
    feedback: row.feedback_text,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const user = requireAuth(req, res, ['admin', 'manager']);
  if (!user) return;

  const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
  return json(res, 200, { bookings: result.rows.map(serializeBooking) });
}
