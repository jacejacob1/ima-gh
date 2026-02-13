import { requireAuth } from '../../_lib/auth.js';
import { query } from '../../_lib/db.js';
import { selectedSpaceLabel } from '../../_lib/inventory.js';
import { badRequest, isValidDateRange, json, methodNotAllowed, toIso } from '../../_lib/http.js';

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
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const user = requireAuth(req, res, ['admin']);
  if (!user) return;

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
        id,
        event_name,
        space_id,
        space_label,
        start_datetime,
        end_datetime,
        reason,
        created_by,
        created_at
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
