import { describe, it, expect } from 'vitest';
import {
  createOrder,
  updateOrder,
  assignOrder,
  isOverdue,
  sortOrders,
  filterOrders,
  summarize,
  canTransition,
} from './logic.js';

const T0 = '2026-11-18T08:00:00.000Z';
const hoursLater = (h) => new Date(new Date(T0).getTime() + h * 36e5).toISOString();

const base = () =>
  createOrder([], { location: 'Room 204', description: 'AC not cooling', priority: 'high' }, T0);

describe('createOrder', () => {
  it('creates an open, unassigned order with the next id', () => {
    const orders = createOrder(base(), { location: 'Lobby', description: 'Flickering light' }, T0);
    expect(orders).toHaveLength(2);
    expect(orders[1]).toMatchObject({ id: 2, status: 'open', priority: 'normal', assignee: null });
  });
  it('trims input and validates required fields', () => {
    expect(() => createOrder([], { location: '  ', description: 'x' })).toThrow(/location/i);
    expect(() => createOrder([], { location: 'x', description: '' })).toThrow(/description/i);
    expect(() => createOrder([], { location: 'x', description: 'y', priority: 'asap' })).toThrow(/priority/i);
    expect(createOrder([], { location: ' Gym ', description: ' Treadmill ' }, T0)[0]).toMatchObject({
      location: 'Gym',
      description: 'Treadmill',
    });
  });
});

describe('updateOrder', () => {
  it('requires an assignee before work starts', () => {
    expect(() => updateOrder(base(), 1, 'in_progress', T0)).toThrow(/assign someone/i);
  });
  it('walks through the lifecycle and stamps resolvedAt', () => {
    let orders = assignOrder(base(), 1, 'Joseph', T0);
    orders = updateOrder(orders, 1, 'in_progress', hoursLater(1));
    orders = updateOrder(orders, 1, 'resolved', hoursLater(2));
    expect(orders[0]).toMatchObject({ status: 'resolved', resolvedAt: hoursLater(2) });
    orders = updateOrder(orders, 1, 'closed', hoursLater(3));
    expect(orders[0]).toMatchObject({ status: 'closed', resolvedAt: hoursLater(2) });
  });
  it('clears resolvedAt when a resolved order is reopened', () => {
    let orders = assignOrder(base(), 1, 'Joseph', T0);
    orders = updateOrder(updateOrder(orders, 1, 'in_progress', T0), 1, 'resolved', T0);
    orders = updateOrder(orders, 1, 'in_progress', hoursLater(1));
    expect(orders[0].resolvedAt).toBeNull();
  });
  it('rejects invalid moves and unknown ids', () => {
    expect(() => updateOrder(base(), 1, 'closed', T0)).toThrow(/cannot go from Open to Closed/);
    expect(() => updateOrder(base(), 9, 'open', T0)).toThrow(/not found/);
    expect(canTransition('closed', 'open')).toBe(false);
  });
});

describe('isOverdue', () => {
  it('uses the SLA of the order priority', () => {
    const order = base()[0]; // high = 24h
    expect(isOverdue(order, hoursLater(23))).toBe(false);
    expect(isOverdue(order, hoursLater(25))).toBe(true);
  });
  it('never flags finished orders', () => {
    expect(isOverdue({ ...base()[0], status: 'resolved' }, hoursLater(500))).toBe(false);
  });
});

describe('sortOrders', () => {
  it('puts urgent first, oldest first within a priority, finished last', () => {
    const orders = [
      { id: 1, priority: 'low', status: 'open', createdAt: T0 },
      { id: 2, priority: 'urgent', status: 'closed', createdAt: T0 },
      { id: 3, priority: 'high', status: 'open', createdAt: hoursLater(2) },
      { id: 4, priority: 'high', status: 'in_progress', createdAt: T0 },
    ];
    expect(sortOrders(orders).map((o) => o.id)).toEqual([4, 3, 1, 2]);
  });
  it('does not mutate its input', () => {
    const orders = [
      { id: 1, priority: 'low', status: 'open', createdAt: T0 },
      { id: 2, priority: 'urgent', status: 'open', createdAt: T0 },
    ];
    sortOrders(orders);
    expect(orders[0].id).toBe(1);
  });
});

describe('filterOrders and summarize', () => {
  const orders = [
    { id: 1, location: 'Room 204', description: 'AC broken', priority: 'urgent', status: 'open', createdAt: T0 },
    { id: 2, location: 'Lobby', description: 'Door closer', priority: 'low', status: 'in_progress', createdAt: T0 },
    { id: 3, location: 'Gym', description: 'Treadmill', priority: 'normal', status: 'resolved', createdAt: T0 },
  ];
  it('filters by status, priority and free text', () => {
    expect(filterOrders(orders, { status: 'open' })).toHaveLength(1);
    expect(filterOrders(orders, { priority: 'low' })).toHaveLength(1);
    expect(filterOrders(orders, { query: 'ROOM' })).toHaveLength(1);
    expect(filterOrders(orders, { query: 'door' })[0].id).toBe(2);
  });
  it('summarises open, in-progress, urgent and overdue counts', () => {
    expect(summarize(orders, hoursLater(5))).toEqual({
      open: 1,
      in_progress: 1,
      urgentActive: 1,
      overdue: 1, // urgent order is past its 4h SLA; low is not
    });
  });
});
