import { describe, it, expect } from 'vitest';
import {
  routeDepartment,
  createRequest,
  updateStatus,
  reroute,
  waitingMinutes,
  isStale,
  sortRequests,
  filterRequests,
  summarize,
} from './logic.js';

const T0 = '2026-11-18T09:00:00.000Z';
const minutesLater = (m) => new Date(new Date(T0).getTime() + m * 60000).toISOString();

describe('routeDepartment', () => {
  it('routes known types and rejects unknown ones', () => {
    expect(routeDepartment('towels')).toBe('housekeeping');
    expect(routeDepartment('repair')).toBe('engineering');
    expect(routeDepartment('room_service')).toBe('food_beverage');
    expect(() => routeDepartment('teleport')).toThrow(/unknown request type/i);
  });
});

describe('createRequest', () => {
  it('creates a pending request routed to the right department', () => {
    const list = createRequest([], { room: ' 204 ', type: 'towels', notes: ' 2 please ' }, T0);
    expect(list[0]).toMatchObject({
      id: 1,
      room: '204',
      notes: '2 please',
      department: 'housekeeping',
      status: 'pending',
    });
  });
  it('increments ids', () => {
    const one = createRequest([], { room: '1', type: 'towels' }, T0);
    expect(createRequest(one, { room: '2', type: 'towels' }, T0)[1].id).toBe(2);
  });
  it('validates room, type and notes for "other"', () => {
    expect(() => createRequest([], { room: '', type: 'towels' })).toThrow(/room number is required/i);
    expect(() => createRequest([], { room: 'a b', type: 'towels' })).toThrow(/letters, digits/i);
    expect(() => createRequest([], { room: '1', type: 'nope' })).toThrow(/unknown request type/i);
    expect(() => createRequest([], { room: '1', type: 'other', notes: ' ' })).toThrow(/describe/i);
  });
});

describe('updateStatus and reroute', () => {
  const list = createRequest([], { room: '204', type: 'towels' }, T0);
  it('moves through pending, in progress, done', () => {
    const a = updateStatus(list, 1, 'in_progress', T0);
    const b = updateStatus(a, 1, 'done', minutesLater(10));
    expect(b[0]).toMatchObject({ status: 'done', updatedAt: minutesLater(10) });
  });
  it('blocks skipping and reopening', () => {
    expect(() => updateStatus(list, 1, 'done', T0)).toThrow(/cannot go from Pending to Done/);
    const done = updateStatus(updateStatus(list, 1, 'in_progress', T0), 1, 'done', T0);
    expect(() => updateStatus(done, 1, 'pending', T0)).toThrow();
    expect(() => updateStatus(list, 7, 'done', T0)).toThrow(/not found/);
  });
  it('reroutes an open request but not a finished one', () => {
    expect(reroute(list, 1, 'front_desk', T0)[0].department).toBe('front_desk');
    expect(() => reroute(list, 1, 'kitchen', T0)).toThrow(/unknown department/i);
    const cancelled = updateStatus(list, 1, 'cancelled', T0);
    expect(() => reroute(cancelled, 1, 'front_desk', T0)).toThrow(/already cancelled/);
  });
});

describe('waiting and staleness', () => {
  const req = { status: 'pending', createdAt: T0 };
  it('computes whole minutes waited', () => {
    expect(waitingMinutes(req, minutesLater(12.9))).toBe(12);
    expect(waitingMinutes(req, minutesLater(-5))).toBe(0);
  });
  it('flags only pending requests older than 30 minutes', () => {
    expect(isStale(req, minutesLater(30))).toBe(false);
    expect(isStale(req, minutesLater(31))).toBe(true);
    expect(isStale({ ...req, status: 'in_progress' }, minutesLater(90))).toBe(false);
  });
});

describe('sort, filter, summarize', () => {
  const reqs = [
    { id: 1, department: 'housekeeping', status: 'done', createdAt: T0 },
    { id: 2, department: 'housekeeping', status: 'pending', createdAt: minutesLater(10) },
    { id: 3, department: 'engineering', status: 'pending', createdAt: T0 },
    { id: 4, department: 'front_desk', status: 'in_progress', createdAt: T0 },
  ];
  it('sorts pending first, oldest first, finished last', () => {
    expect(sortRequests(reqs).map((r) => r.id)).toEqual([3, 2, 4, 1]);
  });
  it('filters by department and status', () => {
    expect(filterRequests(reqs, { department: 'housekeeping' })).toHaveLength(2);
    expect(filterRequests(reqs, { department: 'housekeeping', status: 'pending' })).toHaveLength(1);
  });
  it('summarises counts per department for open requests only', () => {
    const s = summarize(reqs, minutesLater(45));
    expect(s).toMatchObject({ pending: 2, in_progress: 1, stale: 2 });
    expect(s.byDepartment).toEqual({
      housekeeping: 1,
      front_desk: 1,
      food_beverage: 0,
      engineering: 1,
      concierge: 0,
    });
  });
});
