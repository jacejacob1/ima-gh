export const inventory = [
  {
    id: 'R101',
    type: 'Room',
    name: 'Deluxe Garden Suite',
    image: '/images/r101-1.jpg',
    gallery: ['/images/r101-1.jpg', '/images/r101-2.jpg', '/images/r101-3.jpg'],
    capacity: '2 guests',
    rate: 'INR 2,000 / day',
    features: ['King bed', 'High-speed Wi-Fi', 'Doctor on-call support'],
  },
  {
    id: 'R202',
    type: 'Room',
    name: 'Executive Twin',
    image: '/images/r202-1.jpg',
    gallery: ['/images/r202-1.jpg', '/images/r202-2.jpg', '/images/r202-3.jpg'],
    capacity: '2 guests',
    rate: 'INR 2,000 / day',
    features: ['Twin beds', 'Work station', 'Complimentary breakfast'],
  },
  {
    id: 'H01',
    type: 'Conference Hall',
    name: 'IMA Conference Hall',
    image: '/images/h01-1.jpg',
    gallery: ['/images/h01-1.jpg', '/images/h01-2.jpg', '/images/h01-3.jpg'],
    capacity: '180 seats',
    rate: 'INR 40,000 / half day · INR 80,000 / full day',
    features: ['Projector + AV', 'Podium and mics', 'Tea and snack station'],
  },
];

export function selectedSpaceLabel(spaceId) {
  const found = inventory.find((item) => item.id === spaceId);
  return found ? found.name : spaceId;
}
