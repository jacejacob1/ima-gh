import Razorpay from 'razorpay';
import { computeBookingAmount } from '../_lib/pricing.js';
import { badRequest, isValidDateRange, json, methodNotAllowed, toIso } from '../_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  const { selectedSpaceId, checkinDateTime, checkoutDateTime } = req.body || {};
  if (!selectedSpaceId || !checkinDateTime || !checkoutDateTime) {
    return badRequest(res, 'selectedSpaceId, checkinDateTime, checkoutDateTime are required.');
  }

  if (!isValidDateRange(checkinDateTime, checkoutDateTime)) {
    return badRequest(res, 'Invalid checkin/checkout date range.');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return badRequest(res, 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const checkinIso = toIso(checkinDateTime);
  const checkoutIso = toIso(checkoutDateTime);
  const pricing = computeBookingAmount(String(selectedSpaceId), checkinIso, checkoutIso);

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: pricing.amountInr * 100,
    currency: 'INR',
    receipt: `ima_${Date.now()}`,
    notes: {
      selectedSpaceId: String(selectedSpaceId),
    },
  });

  return json(res, 200, {
    orderId: order.id,
    amountInr: pricing.amountInr,
    amountPaise: pricing.amountInr * 100,
    currency: 'INR',
    keyId,
    summary: pricing.summary,
  });
}
