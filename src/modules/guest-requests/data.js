/**
 * REST endpoints this module expects once a backend exists.
 * TODO: replace the localStorage store in Page.jsx with these calls.
 */
export const ENDPOINTS = {
  list: 'GET /api/guest-requests',
  create: 'POST /api/guest-requests   { room, type, notes }',
  setStatus: 'POST /api/guest-requests/:id/status   { status }',
  reroute: 'POST /api/guest-requests/:id/department   { department }',
};

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

export function createSeedRequests() {
  return [
    {
      id: 1,
      room: '204',
      type: 'towels',
      department: 'housekeeping',
      notes: 'Two bath towels',
      status: 'pending',
      createdAt: minutesAgo(8),
      updatedAt: minutesAgo(8),
    },
    {
      id: 2,
      room: '311',
      type: 'late_checkout',
      department: 'front_desk',
      notes: 'Wants 2pm checkout',
      status: 'in_progress',
      createdAt: minutesAgo(25),
      updatedAt: minutesAgo(10),
    },
  ];
}
