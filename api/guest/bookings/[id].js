import { requireAuth } from '../../_lib/auth.js';
import { serializeBooking } from '../../_lib/bookings.js';
import { query } from '../../_lib/db.js';
import { buildInvoiceBuffer } from '../../_lib/invoice.js';
import { json, methodNotAllowed } from '../../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const user = requireAuth(req, res, []);
  if (!user) return;

  const bookingId = req.query.id;
  const result = await query('SELECT * FROM bookings WHERE id = $1 LIMIT 1', [bookingId]);
  const row = result.rows[0];

  if (!row) {
    return json(res, 404, { message: 'Booking not found.' });
  }

  if (user.role === 'guest' && user.guestPhone !== row.guest_phone) {
    return json(res, 403, { message: 'You cannot access this invoice.' });
  }

  const booking = serializeBooking(row);
  const mode = String(req.query.mode || '').toLowerCase();
  if (mode === 'json') {
    return json(res, 200, { booking });
  }

  const pdfBuffer = await buildInvoiceBuffer(booking);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${booking.invoiceNumber || booking.id}.pdf"`);
  return res.status(200).send(pdfBuffer);
}
