export const PRIORITIES = ['urgent', 'high', 'normal', 'low'];
export const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

export const PRIORITY_LABELS = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };
export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

/** Hours within which each priority should be resolved. */
export const SLA_HOURS = { urgent: 4, high: 24, normal: 72, low: 168 };

export const TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'in_progress'],
  closed: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/** Build a new work order, validating the required fields. */
export function createOrder(orders, input, now = new Date().toISOString()) {
  const location = (input.location ?? '').trim();
  const description = (input.description ?? '').trim();
  const priority = input.priority ?? 'normal';
  if (!location) throw new Error('Location is required');
  if (!description) throw new Error('Description is required');
  if (!PRIORITIES.includes(priority)) throw new Error(`Unknown priority: ${priority}`);

  const nextId = orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
  const order = {
    id: nextId,
    location,
    description,
    priority,
    status: 'open',
    assignee: null,
    reportedBy: (input.reportedBy ?? '').trim() || null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  };
  return [...orders, order];
}

export function updateOrder(orders, id, to, now = new Date().toISOString()) {
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error(`Work order #${id} not found`);
  if (!canTransition(order.status, to)) {
    throw new Error(
      `Work order #${id} cannot go from ${STATUS_LABELS[order.status]} to ${STATUS_LABELS[to] ?? to}`
    );
  }
  if (to === 'in_progress' && !order.assignee) {
    throw new Error('Assign someone before starting work');
  }
  return orders.map((o) =>
    o.id === id
      ? { ...o, status: to, updatedAt: now, resolvedAt: to === 'resolved' ? now : to === 'closed' ? o.resolvedAt : null }
      : o
  );
}

export function assignOrder(orders, id, assignee, now = new Date().toISOString()) {
  if (!orders.some((o) => o.id === id)) throw new Error(`Work order #${id} not found`);
  return orders.map((o) => (o.id === id ? { ...o, assignee: assignee || null, updatedAt: now } : o));
}

/** True when an order that is not yet resolved has outlived its priority's SLA. */
export function isOverdue(order, now = new Date().toISOString()) {
  if (order.status === 'resolved' || order.status === 'closed') return false;
  const ageHours = (new Date(now) - new Date(order.createdAt)) / 36e5;
  return ageHours > SLA_HOURS[order.priority];
}

/** Active orders first, most urgent first, oldest first within a priority; finished ones last. */
export function sortOrders(orders) {
  const finished = (o) => (o.status === 'resolved' || o.status === 'closed' ? 1 : 0);
  return [...orders].sort(
    (a, b) =>
      finished(a) - finished(b) ||
      PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
      new Date(a.createdAt) - new Date(b.createdAt)
  );
}

export function filterOrders(orders, { status = '', priority = '', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  return orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (priority && o.priority !== priority) return false;
    if (q && !`${o.location} ${o.description}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function summarize(orders, now = new Date().toISOString()) {
  const active = orders.filter((o) => o.status === 'open' || o.status === 'in_progress');
  return {
    open: orders.filter((o) => o.status === 'open').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    urgentActive: active.filter((o) => o.priority === 'urgent').length,
    overdue: orders.filter((o) => isOverdue(o, now)).length,
  };
}
