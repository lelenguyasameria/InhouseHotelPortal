export const TECHNICIANS = ['Joseph', 'Kamau', 'Lucy'];

/**
 * REST endpoints this module expects once a backend exists.
 * TODO: replace the localStorage store in Page.jsx with these calls.
 */
export const ENDPOINTS = {
  list: 'GET /api/maintenance/orders',
  create: 'POST /api/maintenance/orders   { location, description, priority, reportedBy }',
  setStatus: 'POST /api/maintenance/orders/:id/status   { status }',
  assign: 'POST /api/maintenance/orders/:id/assignment   { assignee }',
};

const hoursAgo = (h) => new Date(Date.now() - h * 36e5).toISOString();

export function createSeedOrders() {
  return [
    {
      id: 1,
      location: 'Room 204',
      description: 'Air conditioning not cooling',
      priority: 'high',
      status: 'open',
      assignee: null,
      reportedBy: 'Front desk',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
      resolvedAt: null,
    },
    {
      id: 2,
      location: 'Lobby',
      description: 'Revolving door making noise',
      priority: 'normal',
      status: 'in_progress',
      assignee: 'Kamau',
      reportedBy: 'Security',
      createdAt: hoursAgo(20),
      updatedAt: hoursAgo(2),
      resolvedAt: null,
    },
  ];
}
