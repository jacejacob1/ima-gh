import { requireAuth } from '../../lib/auth.js';
import { serializeBooking } from '../../lib/bookings.js';
import { query } from '../../lib/db.js';
import { badRequest, json, methodNotAllowed } from '../../lib/http.js';

export default async function handler(req, res) {
  const user = requireAuth(req, res, ['admin', 'manager']);
  if (!user) return;

  if (req.method === 'GET') {
    const result = await query('SELECT * FROM bookings ORDER BY created_at DESC');
    return json(res, 200, { bookings: result.rows.map(serializeBooking) });
  }

  if (req.method === 'DELETE') {
    if (user.role !== 'admin') {
      return json(res, 403, { message: 'Insufficient permissions.' });
    }

    const bookingId = String(req.query.id || '').trim();
    if (!bookingId) {
      return badRequest(res, 'id query parameter is required.');
    }

    const result = await query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    if (!result.rowCount) {
      return json(res, 404, { message: 'Booking not found.' });
    }

    return json(res, 200, { message: 'Booking removed.' });
  }

  return methodNotAllowed(res, ['GET', 'DELETE']);
}
