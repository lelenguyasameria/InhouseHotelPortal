export const ATTENDANTS = ['Amina', 'Brian', 'Chebet', 'Daniel'];

/**
 * REST endpoints this module expects once a backend exists.
 * TODO: replace the localStorage store in Page.jsx with these calls.
 */
export const ENDPOINTS = {
  list: 'GET /api/housekeeping/rooms',
  changeStatus: 'POST /api/housekeeping/rooms/:number/status   { status }',
  assign: 'POST /api/housekeeping/rooms/:number/assignment   { attendant }',
};

const CYCLE = ['dirty', 'cleaning', 'clean', 'inspected', 'dirty'];

/** 24 rooms over 3 floors (101-108, 201-208, 301-308). Room 308 starts out of order. */
export function createSeedRooms() {
  const rooms = [];
  let i = 0;
  for (const floor of [1, 2, 3]) {
    for (let n = 1; n <= 8; n += 1) {
      const number = `${floor}0${n}`;
      let status = CYCLE[i % CYCLE.length];
      if (number === '308') status = 'out_of_order';
      rooms.push({
        number,
        floor,
        status,
        // dirty rooms start unassigned so the "unassigned" warning is meaningful
        attendant: status === 'dirty' || status === 'out_of_order' ? null : ATTENDANTS[i % ATTENDANTS.length],
        updatedAt: null,
      });
      i += 1;
    }
  }
  return rooms;
}
