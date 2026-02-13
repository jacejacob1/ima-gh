import { requireAuth } from '../../_lib/auth.js';
import { query } from '../../_lib/db.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return methodNotAllowed(res, ['DELETE']);
  }

  const user = requireAuth(req, res, ['admin']);
  if (!user) return;

  const bookingId = req.query.id;
  const result = await query('DELETE FROM bookings WHERE id = $1', [bookingId]);

  if (!result.rowCount) {
    return json(res, 404, { message: 'Booking not found.' });
  }

  return json(res, 200, { message: 'Booking removed.' });
}
