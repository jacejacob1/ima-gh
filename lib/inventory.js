// Real IMA Guesthouse inventory:
//   5 Deluxe rooms  @ INR 1,500 / day
//   2 Executive rooms @ INR 2,000 / day
//   1 Conference hall  @ INR 40,000 half day / INR 80,000 full day
//
// `ratePerDayInr` (rooms) and `halfDayInr` / `fullDayInr` (hall) are the single
// source of truth for pricing. The display string `rate` is derived from them.

const DELUXE_RATE = 1500;
const EXECUTIVE_RATE = 2000;
const HALL_HALF_DAY = 40000;
const HALL_FULL_DAY = 80000;

const deluxeGallery = ['/images/r101-1.jpg', '/images/r101-2.jpg', '/images/r101-3.jpg'];
const executiveGallery = ['/images/r202-1.jpg', '/images/r202-2.jpg', '/images/r202-3.jpg'];

function deluxeRoom(id, name) {
  return {
    id,
    type: 'Room',
    category: 'Deluxe',
    name,
    image: deluxeGallery[0],
    gallery: deluxeGallery,
    capacity: '2 guests',
    ratePerDayInr: DELUXE_RATE,
    rate: `INR ${DELUXE_RATE.toLocaleString('en-IN')} / day`,
    features: ['Queen bed', 'High-speed Wi-Fi', 'Doctor on-call support'],
  };
}

function executiveRoom(id, name) {
  return {
    id,
    type: 'Room',
    category: 'Executive',
    name,
    image: executiveGallery[0],
    gallery: executiveGallery,
    capacity: '2 guests',
    ratePerDayInr: EXECUTIVE_RATE,
    rate: `INR ${EXECUTIVE_RATE.toLocaleString('en-IN')} / day`,
    features: ['Twin beds', 'Work station', 'Complimentary breakfast'],
  };
}

export const inventory = [
  deluxeRoom('D101', 'Deluxe Room 101'),
  deluxeRoom('D102', 'Deluxe Room 102'),
  deluxeRoom('D103', 'Deluxe Room 103'),
  deluxeRoom('D104', 'Deluxe Room 104'),
  deluxeRoom('D105', 'Deluxe Room 105'),
  executiveRoom('E201', 'Executive Room 201'),
  executiveRoom('E202', 'Executive Room 202'),
  {
    id: 'H01',
    type: 'Conference Hall',
    category: 'Hall',
    name: 'IMA Conference Hall',
    image: '/images/h01-4.jpg',
    gallery: [
      '/images/h01-4.jpg',
      '/images/h01-5.jpg',
      '/images/h01-6.jpg',
      '/images/h01-7.jpg',
      '/images/h01-8.jpg',
      '/images/h01-1.jpg',
      '/images/h01-2.jpg',
      '/images/h01-3.jpg',
    ],
    capacity: '180 seats',
    halfDayInr: HALL_HALF_DAY,
    fullDayInr: HALL_FULL_DAY,
    rate: `INR ${HALL_HALF_DAY.toLocaleString('en-IN')} / half day · INR ${HALL_FULL_DAY.toLocaleString('en-IN')} / full day`,
    features: ['Projector + AV', 'Podium and mics', 'Tea and snack station'],
  },
];

export function selectedSpaceLabel(spaceId) {
  const found = inventory.find((item) => item.id === spaceId);
  return found ? found.name : spaceId;
}
