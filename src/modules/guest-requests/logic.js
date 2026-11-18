export const DEPARTMENTS = {
  housekeeping: 'Housekeeping',
  front_desk: 'Front desk',
  food_beverage: 'Food & beverage',
  engineering: 'Engineering',
  concierge: 'Concierge',
};

/** Request types and the department each is routed to by default. */
export const REQUEST_TYPES = {
  towels: { label: 'Extra towels', department: 'housekeeping' },
  pillows: { label: 'Extra pillows or blankets', department: 'housekeeping' },
  toiletries: { label: 'Toiletries', department: 'housekeeping' },
  late_checkout: { label: 'Late checkout', department: 'front_desk' },
  wake_up: { label: 'Wake-up call', department: 'front_desk' },
  room_service: { label: 'Room service', department: 'food_beverage' },
  repair: { label: 'Something is broken', department: 'engineering' },
  transport: { label: 'Transport or taxi', department: 'concierge' },
  other: { label: 'Other', department: 'front_desk' },
};

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

export const TRANSITIONS = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

/** Minutes a request may wait before it is flagged. */
export const STALE_AFTER_MINUTES = 30;

export function routeDepartment(type) {
  const t = REQUEST_TYPES[type];
  if (!t) throw new Error(`Unknown request type: ${type}`);
  return t.department;
}

export function createRequest(requests, input, now = new Date().toISOString()) {
  const room = (input.room ?? '').trim();
  const notes = (input.notes ?? '').trim();
  if (!room) throw new Error('Room number is required');
  if (!/^[A-Za-z0-9-]+$/.test(room)) throw new Error('Room number can only contain letters, digits and dashes');
  const department = routeDepartment(input.type);
  if (input.type === 'other' && !notes) throw new Error('Please describe the request');

  const id = requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  return [
    ...requests,
    { id, room, type: input.type, department, notes, status: 'pending', createdAt: now, updatedAt: now },
  ];
}

export function updateStatus(requests, id, to, now = new Date().toISOString()) {
  const req = requests.find((r) => r.id === id);
  if (!req) throw new Error(`Request #${id} not found`);
  if (!(TRANSITIONS[req.status] ?? []).includes(to)) {
    throw new Error(
      `Request #${id} cannot go from ${STATUS_LABELS[req.status]} to ${STATUS_LABELS[to] ?? to}`
    );
  }
  return requests.map((r) => (r.id === id ? { ...r, status: to, updatedAt: now } : r));
}

/** Move a request to another department (e.g. front desk sent it to the wrong team). */
export function reroute(requests, id, department, now = new Date().toISOString()) {
  if (!DEPARTMENTS[department]) throw new Error(`Unknown department: ${department}`);
  const req = requests.find((r) => r.id === id);
  if (!req) throw new Error(`Request #${id} not found`);
  if (req.status === 'done' || req.status === 'cancelled') {
    throw new Error(`Request #${id} is already ${STATUS_LABELS[req.status].toLowerCase()}`);
  }
  return requests.map((r) => (r.id === id ? { ...r, department, updatedAt: now } : r));
}

export function waitingMinutes(request, now = new Date().toISOString()) {
  return Math.max(0, Math.floor((new Date(now) - new Date(request.createdAt)) / 60000));
}

export function isStale(request, now = new Date().toISOString()) {
  return request.status === 'pending' && waitingMinutes(request, now) > STALE_AFTER_MINUTES;
}

/** Pending first, then in progress, then finished; longest-waiting first within each. */
export function sortRequests(requests) {
  const rank = { pending: 0, in_progress: 1, done: 2, cancelled: 2 };
  return [...requests].sort(
    (a, b) => rank[a.status] - rank[b.status] || new Date(a.createdAt) - new Date(b.createdAt)
  );
}

export function filterRequests(requests, { department = '', status = '' } = {}) {
  return requests.filter(
    (r) => (!department || r.department === department) && (!status || r.status === status)
  );
}

export function summarize(requests, now = new Date().toISOString()) {
  const open = requests.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const byDepartment = Object.fromEntries(Object.keys(DEPARTMENTS).map((d) => [d, 0]));
  for (const r of open) byDepartment[r.department] += 1;
  return {
    pending: requests.filter((r) => r.status === 'pending').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    stale: requests.filter((r) => isStale(r, now)).length,
    byDepartment,
  };
}
