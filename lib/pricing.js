import { resolveSpace, selectedSpaceLabel } from './inventory.js';

function ceilDays(milliseconds) {
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil(milliseconds / dayMs));
}

function hoursBetween(startIso, endIso) {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return diff / (1000 * 60 * 60);
}

export function computeBookingAmount(spaceId, checkinIso, checkoutIso) {
  const space = resolveSpace(spaceId);
  if (!space) {
    return { amountInr: 0, currency: 'INR', summary: 'Unknown space' };
  }

  if (space.type === 'Room') {
    const days = ceilDays(new Date(checkoutIso).getTime() - new Date(checkinIso).getTime());
    const perDay = space.ratePerDayInr || 2000;
    const amountInr = days * perDay;
    return {
      amountInr,
      currency: 'INR',
      summary: `${selectedSpaceLabel(spaceId)} · ${days} day(s) × INR ${perDay.toLocaleString('en-IN')}`,
    };
  }

  const durationHours = hoursBetween(checkinIso, checkoutIso);
  const halfDay = durationHours <= 6;
  const amountInr = halfDay ? (space.halfDayInr || 40000) : (space.fullDayInr || 80000);
  return {
    amountInr,
    currency: 'INR',
    summary: `${selectedSpaceLabel(spaceId)} · ${halfDay ? 'Half Day' : 'Full Day'}`,
  };
}
