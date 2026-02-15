import { requireAuth } from '../../lib/auth.js';
import { serializeBooking } from '../../lib/bookings.js';
import { query } from '../../lib/db.js';
import { buildInvoiceBuffer } from '../../lib/invoice.js';
import { badRequest, json, methodNotAllowed } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const user = requireAuth(req, res, []);
  if (!user) return;

  const bookingId = String(req.query.bookingId || '').trim();
  if (!bookingId) {
    if (user.role !== 'guest') {
      return json(res, 403, { message: 'Guests only.' });
    }

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
  if (mode === 'json') {
    return json(res, 200, { booking });
  }

  const download = String(req.query.download || '').toLowerCase();
  if (download !== 'true') {
    return badRequest(res, 'Set download=true or mode=json for bookingId access.');
  }

  const pdfBuffer = await buildInvoiceBuffer(booking);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${booking.invoiceNumber || booking.id}.pdf"`);
  return res.status(200).send(pdfBuffer);
}
