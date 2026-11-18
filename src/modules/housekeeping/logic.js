export const STATUSES = ['dirty', 'cleaning', 'clean', 'inspected', 'out_of_order'];

export const STATUS_LABELS = {
  dirty: 'Dirty',
  cleaning: 'Cleaning',
  clean: 'Clean',
  inspected: 'Inspected',
  out_of_order: 'Out of order',
};

/** Which statuses a room may move to from each status. */
export const TRANSITIONS = {
  dirty: ['cleaning', 'out_of_order'],
  cleaning: ['clean', 'dirty', 'out_of_order'],
  clean: ['inspected', 'dirty', 'out_of_order'],
  inspected: ['dirty', 'out_of_order'],
  out_of_order: ['dirty'],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

function findRoom(rooms, number) {
  const room = rooms.find((r) => r.number === number);
  if (!room) throw new Error(`Room ${number} not found`);
  return room;
}

/**
 * Move a room to a new status. Returns a new array; never mutates.
 * Rules: the move must be allowed, and a room cannot start cleaning
 * until an attendant is assigned.
 */
export function changeStatus(rooms, number, to, now = new Date().toISOString()) {
  const room = findRoom(rooms, number);
  if (!canTransition(room.status, to)) {
    throw new Error(
      `Room ${number} cannot go from ${STATUS_LABELS[room.status]} to ${STATUS_LABELS[to] ?? to}`
    );
  }
  if (to === 'cleaning' && !room.attendant) {
    throw new Error('Assign an attendant before starting to clean');
  }
  return rooms.map((r) => (r.number === number ? { ...r, status: to, updatedAt: now } : r));
}

/** Assign (or clear, with null/'') the attendant for a room. Out-of-order rooms cannot be assigned. */
export function assignAttendant(rooms, number, attendant, now = new Date().toISOString()) {
  const room = findRoom(rooms, number);
  if (attendant && room.status === 'out_of_order') {
    throw new Error(`Room ${number} is out of order and cannot be assigned`);
  }
  return rooms.map((r) =>
    r.number === number ? { ...r, attendant: attendant || null, updatedAt: now } : r
  );
}

/** Counts per status, plus how many dirty rooms still have nobody assigned. */
export function summarize(rooms) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of rooms) counts[r.status] += 1;
  return {
    ...counts,
    total: rooms.length,
    unassignedDirty: rooms.filter((r) => r.status === 'dirty' && !r.attendant).length,
  };
}

/** Rooms each attendant still has to turn around (dirty or cleaning). */
export function workloadByAttendant(rooms) {
  const load = {};
  for (const r of rooms) {
    if (r.attendant && (r.status === 'dirty' || r.status === 'cleaning')) {
      load[r.attendant] = (load[r.attendant] ?? 0) + 1;
    }
  }
  return load;
}

/** Filter by status, floor, attendant ('unassigned' allowed) and a room-number search. */
export function filterRooms(rooms, { status = '', floor = '', attendant = '', query = '' } = {}) {
  const q = query.trim();
  return rooms.filter((r) => {
    if (status && r.status !== status) return false;
    if (floor !== '' && String(r.floor) !== String(floor)) return false;
    if (attendant === 'unassigned' && r.attendant) return false;
    if (attendant && attendant !== 'unassigned' && r.attendant !== attendant) return false;
    if (q && !r.number.includes(q)) return false;
    return true;
  });
}
