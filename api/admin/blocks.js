import { requireAuth } from '../../lib/auth.js';
import { query } from '../../lib/db.js';
import { selectedSpaceLabel } from '../../lib/inventory.js';
import { badRequest, isValidDateRange, json, methodNotAllowed, toIso } from '../../lib/http.js';

async function hasBookingConflict(spaceId, startIso, endIso) {
  const result = await query(
    `
      SELECT id
      FROM bookings
      WHERE selected_space_id = $1
        AND checkin_datetime < $2::timestamptz
        AND $3::timestamptz < checkout_datetime
      LIMIT 1
    `,
    [spaceId, endIso, startIso]
  );

  return Boolean(result.rows[0]);
}

export default async function handler(req, res) {
  const user = requireAuth(req, res, ['admin']);
  if (!user) return;

  if (req.method === 'POST') {
    const payload = req.body || {};
    const required = ['eventName', 'spaceId', 'startDateTime', 'endDateTime', 'reason'];
    const missing = required.find((field) => !payload[field]);
    if (missing) {
      return badRequest(res, `${missing} is required.`);
    }

    if (!isValidDateRange(payload.startDateTime, payload.endDateTime)) {
      return badRequest(res, 'Invalid block time range.');
    }

    const startIso = toIso(payload.startDateTime);
    const endIso = toIso(payload.endDateTime);

    if (await hasBookingConflict(payload.spaceId, startIso, endIso)) {
      return json(res, 409, { message: 'Cannot block: existing booking overlaps this range.' });
    }

    await query(
      `
        INSERT INTO blocked_slots (
          id, event_name, space_id, space_label, start_datetime, end_datetime, reason, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7, $8, $9::timestamptz)
      `,
      [
        `BLK-${Date.now()}`,
        String(payload.eventName).trim(),
        String(payload.spaceId),
        selectedSpaceLabel(String(payload.spaceId)),
        startIso,
        endIso,
        String(payload.reason).trim(),
        user.username,
        new Date().toISOString(),
      ]
    );

    return json(res, 201, { message: 'Slot blocked.' });
  }

  if (req.method === 'DELETE') {
    const blockId = String(req.query.id || '').trim();
    if (!blockId) {
      return badRequest(res, 'id query parameter is required.');
    }

    const result = await query('DELETE FROM blocked_slots WHERE id = $1', [blockId]);
    if (!result.rowCount) {
      return json(res, 404, { message: 'Blocked slot not found.' });
    }

    return json(res, 200, { message: 'Blocked slot removed.' });
  }

  return methodNotAllowed(res, ['POST', 'DELETE']);
}
