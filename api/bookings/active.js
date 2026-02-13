import { query } from '../_lib/db.js';
import { json, methodNotAllowed } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

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
