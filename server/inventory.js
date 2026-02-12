export const inventory = [
  {
    id: 'R101',
    type: 'Room',
    name: 'Deluxe Garden Suite',
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1578898887932-dce23a595ad4?auto=format&fit=crop&w=1400&q=80',
    ],
    capacity: '2 guests',
    rate: 'INR 2,000 / day',
    features: ['King bed', 'High-speed Wi-Fi', 'Doctor on-call support'],
  },
  {
    id: 'R202',
    type: 'Room',
    name: 'Executive Twin',
    image:
      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1560067174-8947a8239a1b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
    ],
    capacity: '2 guests',
    rate: 'INR 2,000 / day',
    features: ['Twin beds', 'Work station', 'Complimentary breakfast'],
  },
  {
    id: 'H01',
    type: 'Conference Hall',
    name: 'IMA Conference Hall',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&w=1400&q=80',
    ],
    capacity: '180 seats',
    rate: 'INR 40,000 / half day · INR 80,000 / full day',
    features: ['Projector + AV', 'Podium and mics', 'Tea and snack station'],
  },
];

export function selectedSpaceLabel(spaceId) {
  const found = inventory.find((item) => item.id === spaceId);
  return found ? found.name : spaceId;
}
