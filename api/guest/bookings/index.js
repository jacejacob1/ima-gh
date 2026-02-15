import { requireAuth } from '../../_lib/auth.js';
import { serializeBooking } from '../../_lib/bookings.js';
import { query } from '../../_lib/db.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const user = requireAuth(req, res, ['guest']);
  if (!user) return;

  const result = await query(
    'SELECT * FROM bookings WHERE guest_phone = $1 ORDER BY checkin_datetime DESC',
    [user.guestPhone]
  );

  return json(res, 200, { bookings: result.rows.map(serializeBooking) });
}
