import { query } from '../lib/db.js';
import { json, methodNotAllowed } from '../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const result = await query(
    `
      SELECT id, event_name, space_id, space_label, start_datetime, end_datetime, reason
      FROM blocked_slots
      ORDER BY created_at DESC
    `
  );

  return json(res, 200, {
    blockedSlots: result.rows.map((row) => ({
      id: row.id,
      eventName: row.event_name,
      spaceId: row.space_id,
      spaceLabel: row.space_label,
      startDateTime: row.start_datetime,
      endDateTime: row.end_datetime,
      reason: row.reason,
    })),
  });
}
