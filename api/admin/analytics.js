import { requireAuth } from '../../lib/auth.js';
import { query } from '../../lib/db.js';
import { json, methodNotAllowed } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const user = requireAuth(req, res, ['admin', 'manager']);
  if (!user) return;

  const [summaryResult, spaceResult, mealResult, trendResult] = await Promise.all([
    query(
      `
        SELECT
          COUNT(*)::int AS total_bookings,
          COUNT(*) FILTER (WHERE checkout_datetime > NOW())::int AS active_bookings,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0)::int AS paid_revenue,
          COUNT(*) FILTER (WHERE payment_status <> 'paid')::int AS pending_payments
        FROM bookings
      `
    ),
    query(
      `
        SELECT selected_space_label, COUNT(*)::int AS count
        FROM bookings
        GROUP BY selected_space_label
        ORDER BY count DESC
      `
    ),
    query(
      `
        SELECT
          COALESCE(SUM((meals_json ? 'Breakfast')::int), 0)::int AS breakfast,
          COALESCE(SUM((meals_json ? 'Lunch')::int), 0)::int AS lunch,
          COALESCE(SUM((meals_json ? 'Dinner')::int), 0)::int AS dinner
        FROM bookings
      `
    ),
    query(
      `
        SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COALESCE(SUM(total_amount), 0)::int AS revenue
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `
    ),
  ]);

  const summary = summaryResult.rows[0] || {
    total_bookings: 0,
    active_bookings: 0,
    paid_revenue: 0,
    pending_payments: 0,
  };

  return json(res, 200, {
    summary: {
      totalBookings: summary.total_bookings,
      activeBookings: summary.active_bookings,
      paidRevenue: summary.paid_revenue,
      pendingPayments: summary.pending_payments,
    },
    bookingsBySpace: spaceResult.rows.map((row) => ({
      label: row.selected_space_label,
      count: row.count,
    })),
    mealDemand: {
      breakfast: mealResult.rows[0]?.breakfast || 0,
      lunch: mealResult.rows[0]?.lunch || 0,
      dinner: mealResult.rows[0]?.dinner || 0,
    },
    monthlyRevenue: trendResult.rows.map((row) => ({ month: row.month, revenue: row.revenue })),
  });
}
