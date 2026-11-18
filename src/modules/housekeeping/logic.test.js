import { describe, it, expect } from 'vitest';
import {
  canTransition,
  changeStatus,
  assignAttendant,
  summarize,
  workloadByAttendant,
  filterRooms,
} from './logic.js';

const NOW = '2026-11-18T10:00:00.000Z';
const make = () => [
  { number: '101', floor: 1, status: 'dirty', attendant: null },
  { number: '102', floor: 1, status: 'dirty', attendant: 'Amina' },
  { number: '201', floor: 2, status: 'cleaning', attendant: 'Amina' },
  { number: '202', floor: 2, status: 'clean', attendant: 'Brian' },
  { number: '203', floor: 2, status: 'out_of_order', attendant: null },
];

describe('canTransition', () => {
  it('allows the normal turnaround flow', () => {
    expect(canTransition('dirty', 'cleaning')).toBe(true);
    expect(canTransition('cleaning', 'clean')).toBe(true);
    expect(canTransition('clean', 'inspected')).toBe(true);
  });
  it('blocks skipping steps and unknown statuses', () => {
    expect(canTransition('dirty', 'inspected')).toBe(false);
    expect(canTransition('out_of_order', 'clean')).toBe(false);
    expect(canTransition('bogus', 'dirty')).toBe(false);
  });
});

describe('changeStatus', () => {
  it('updates status and timestamp without mutating the input', () => {
    const rooms = make();
    const next = changeStatus(rooms, '102', 'cleaning', NOW);
    expect(next.find((r) => r.number === '102')).toMatchObject({ status: 'cleaning', updatedAt: NOW });
    expect(rooms.find((r) => r.number === '102').status).toBe('dirty');
  });
  it('requires an attendant before cleaning starts', () => {
    expect(() => changeStatus(make(), '101', 'cleaning', NOW)).toThrow(/assign an attendant/i);
  });
  it('rejects invalid transitions with a readable message', () => {
    expect(() => changeStatus(make(), '101', 'inspected', NOW)).toThrow(/cannot go from Dirty to Inspected/);
  });
  it('throws for an unknown room', () => {
    expect(() => changeStatus(make(), '999', 'dirty', NOW)).toThrow(/not found/);
  });
});

describe('assignAttendant', () => {
  it('assigns and clears an attendant', () => {
    const assigned = assignAttendant(make(), '101', 'Brian', NOW);
    expect(assigned.find((r) => r.number === '101').attendant).toBe('Brian');
    const cleared = assignAttendant(assigned, '101', '', NOW);
    expect(cleared.find((r) => r.number === '101').attendant).toBeNull();
  });
  it('refuses to assign an out-of-order room', () => {
    expect(() => assignAttendant(make(), '203', 'Amina', NOW)).toThrow(/out of order/);
  });
});

describe('summarize and workload', () => {
  it('counts statuses and unassigned dirty rooms', () => {
    expect(summarize(make())).toEqual({
      dirty: 2,
      cleaning: 1,
      clean: 1,
      inspected: 0,
      out_of_order: 1,
      total: 5,
      unassignedDirty: 1,
    });
  });
  it('counts only dirty and cleaning rooms per attendant', () => {
    expect(workloadByAttendant(make())).toEqual({ Amina: 2 });
  });
});

describe('filterRooms', () => {
  const rooms = make();
  it('returns everything with no filters', () => {
    expect(filterRooms(rooms)).toHaveLength(5);
  });
  it('filters by status, floor and attendant', () => {
    expect(filterRooms(rooms, { status: 'dirty' })).toHaveLength(2);
    expect(filterRooms(rooms, { floor: '2' })).toHaveLength(3);
    expect(filterRooms(rooms, { attendant: 'Amina' })).toHaveLength(2);
    expect(filterRooms(rooms, { attendant: 'unassigned' }).map((r) => r.number)).toEqual(['101', '203']);
  });
  it('searches by room number and combines filters', () => {
    expect(filterRooms(rooms, { query: '20' })).toHaveLength(3);
    expect(filterRooms(rooms, { query: '20', status: 'clean' })).toHaveLength(1);
  });
});
