import { query } from '../lib/db.js';
import { badRequest, json, methodNotAllowed } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { bookingId, note } = req.body || {};
  if (!bookingId || !note) {
    return badRequest(res, 'bookingId and note are required.');
  }

  const result = await query('SELECT id, checkout_datetime FROM bookings WHERE id = $1', [
    String(bookingId),
  ]);

  const booking = result.rows[0];
  if (!booking) {
    return json(res, 404, { message: 'Booking not found.' });
  }

  if (new Date(booking.checkout_datetime).getTime() <= Date.now()) {
    return badRequest(res, 'Feedback allowed only before checkout.');
  }

  await query('UPDATE bookings SET feedback_text = $1 WHERE id = $2', [String(note).trim(), booking.id]);
  return json(res, 200, { message: 'Feedback saved.' });
}
