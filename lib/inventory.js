// Two layers:
//  - `inventory`     : the 7 physical rooms (D101-D105 Deluxe, E201-E202 Executive) + hall.
//                      Admins allot these specific rooms; availability is tracked per room.
//  - `bookingTypes`  : what a guest actually books on the public site — a room *type*
//                      (Deluxe / Executive) or the hall. The admin later assigns a physical room.

const DELUXE_RATE = 1500;
const EXECUTIVE_RATE = 2000;
const HALL_HALF_DAY = 40000;
const HALL_FULL_DAY = 80000;

const deluxeGallery = ['/images/r101-1.jpg', '/images/r101-2.jpg', '/images/r101-3.jpg'];
const executiveGallery = ['/images/r202-1.jpg', '/images/r202-2.jpg', '/images/r202-3.jpg'];

function physicalRoom(id, name, category, ratePerDayInr, gallery) {
  return {
    id,
    type: 'Room',
    category,
    name,
    image: gallery[0],
    gallery,
    capacity: '2 guests',
    ratePerDayInr,
    rate: `INR ${ratePerDayInr.toLocaleString('en-IN')} / day`,
    features:
      category === 'Executive'
        ? ['Twin beds', 'Work station', 'Complimentary breakfast']
        : ['Queen bed', 'High-speed Wi-Fi', 'Doctor on-call support'],
  };
}

const hall = {
  id: 'H01',
  type: 'Conference Hall',
  category: 'Hall',
  name: 'IMA Conference Hall',
  image: '/images/h01-4.jpg',
  gallery: [
    '/images/h01-4.jpg', '/images/h01-5.jpg', '/images/h01-1.jpg',
    '/images/h01-2.jpg', '/images/h01-3.jpg',
  ],
  capacity: '180 seats',
  halfDayInr: HALL_HALF_DAY,
  fullDayInr: HALL_FULL_DAY,
  rate: `INR ${HALL_HALF_DAY.toLocaleString('en-IN')} / half day · INR ${HALL_FULL_DAY.toLocaleString('en-IN')} / full day`,
  features: ['Projector + AV', 'Podium and mics', 'Tea and snack station'],
};

// Physical rooms the admin can allot (5 deluxe + 2 executive) + the single hall.
export const inventory = [
  physicalRoom('D101', 'Deluxe Room 101', 'Deluxe', DELUXE_RATE, deluxeGallery),
  physicalRoom('D102', 'Deluxe Room 102', 'Deluxe', DELUXE_RATE, deluxeGallery),
  physicalRoom('D103', 'Deluxe Room 103', 'Deluxe', DELUXE_RATE, deluxeGallery),
  physicalRoom('D104', 'Deluxe Room 104', 'Deluxe', DELUXE_RATE, deluxeGallery),
  physicalRoom('D105', 'Deluxe Room 105', 'Deluxe', DELUXE_RATE, deluxeGallery),
  physicalRoom('E201', 'Executive Room 201', 'Executive', EXECUTIVE_RATE, executiveGallery),
  physicalRoom('E202', 'Executive Room 202', 'Executive', EXECUTIVE_RATE, executiveGallery),
  hall,
];

// What guests pick on the public site. Capacity = how many physical rooms of that type exist.
export const bookingTypes = [
  {
    id: 'DELUXE', type: 'Room', category: 'Deluxe', name: 'Deluxe Room',
    ratePerDayInr: DELUXE_RATE, rate: `INR ${DELUXE_RATE.toLocaleString('en-IN')} / day`,
    capacity: 5, image: deluxeGallery[0], gallery: deluxeGallery,
  },
  {
    id: 'EXECUTIVE', type: 'Room', category: 'Executive', name: 'Executive Room',
    ratePerDayInr: EXECUTIVE_RATE, rate: `INR ${EXECUTIVE_RATE.toLocaleString('en-IN')} / day`,
    capacity: 2, image: executiveGallery[0], gallery: executiveGallery,
  },
  { ...hall, capacity: 1 },
];

// Resolve any id (a booking type like DELUXE, a physical room like D103, or H01).
export function resolveSpace(id) {
  return bookingTypes.find((t) => t.id === id) || inventory.find((i) => i.id === id) || null;
}

export function selectedSpaceLabel(id) {
  const found = resolveSpace(id);
  return found ? found.name : id;
}

// Physical rooms (admin allotment / availability).
export function physicalRooms() {
  return inventory.filter((i) => i.type === 'Room');
}

// Physical rooms belonging to a category (Deluxe / Executive).
export function roomsForCategory(category) {
  return inventory.filter((i) => i.type === 'Room' && i.category === category);
}
