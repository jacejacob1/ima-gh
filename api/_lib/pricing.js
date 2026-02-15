import { inventory, selectedSpaceLabel } from './inventory.js';

function ceilDays(milliseconds) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil(milliseconds / dayMs));
}

function hoursBetween(startIso, endIso) {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return diff / (1000 * 60 * 60);
}

export function computeBookingAmount(spaceId, checkinIso, checkoutIso) {
  const space = inventory.find((item) => item.id === spaceId);
  if (!space) {
    return { amountInr: 0, currency: 'INR', summary: 'Unknown space' };
  }

  if (space.type === 'Room') {
    const days = ceilDays(new Date(checkoutIso).getTime() - new Date(checkinIso).getTime());
    const amountInr = days * 2000;
    return {
      amountInr,
      currency: 'INR',
      summary: `${selectedSpaceLabel(spaceId)} · ${days} day(s) × INR 2,000`,
    };
  }

  const durationHours = hoursBetween(checkinIso, checkoutIso);
  const halfDay = durationHours <= 6;
  const amountInr = halfDay ? 40000 : 80000;
  return {
    amountInr,
    currency: 'INR',
    summary: `${selectedSpaceLabel(spaceId)} · ${halfDay ? 'Half Day' : 'Full Day'}`,
  };
}
