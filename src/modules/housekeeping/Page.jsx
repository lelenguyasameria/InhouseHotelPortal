import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { useStoredState } from '../../lib/useStoredState.js';
import { ATTENDANTS, createSeedRooms } from './data.js';
import {
  STATUSES,
  STATUS_LABELS,
  TRANSITIONS,
  assignAttendant,
  changeStatus,
  filterRooms,
  summarize,
  workloadByAttendant,
} from './logic.js';

const ACTION_LABELS = {
  cleaning: 'Start cleaning',
  clean: 'Mark clean',
  inspected: 'Inspect OK',
  dirty: 'Mark dirty',
  out_of_order: 'Out of order',
};

const BADGE = {
  dirty: 'bg-red-100 text-red-800',
  cleaning: 'bg-amber-100 text-amber-800',
  clean: 'bg-sky-100 text-sky-800',
  inspected: 'bg-emerald-100 text-emerald-800',
  out_of_order: 'bg-gray-200 text-gray-700',
};

export default function HousekeepingPage() {
  // TODO: load from GET /api/housekeeping/rooms instead of localStorage
  const [rooms, setRooms] = useStoredState('portal.housekeeping.rooms', createSeedRooms);
  const [filters, setFilters] = useState({ status: '', floor: '', attendant: '', query: '' });
  const [error, setError] = useState('');

  const summary = useMemo(() => summarize(rooms), [rooms]);
  const workload = useMemo(() => workloadByAttendant(rooms), [rooms]);
  const visible = useMemo(() => filterRooms(rooms, filters), [rooms, filters]);
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  const apply = (fn) => {
    try {
      // compute outside the state updater so rule violations reach the catch below
      setRooms(fn(rooms));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  // TODO: POST /api/housekeeping/rooms/:number/status
  const onStatus = (number, to) => apply((c) => changeStatus(c, number, to));
  // TODO: POST /api/housekeeping/rooms/:number/assignment
  const onAssign = (number, who) => apply((c) => assignAttendant(c, number, who));

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader title="Housekeeping" subtitle="Room status board and assignments for today." />

      <section aria-label="Summary" className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border border-navy-100 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-navy-500">{STATUS_LABELS[s]}</div>
            <div className="text-2xl font-semibold" data-testid={`count-${s}`}>
              {summary[s]}
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-brass-500 bg-brass-100 p-3">
          <div className="text-xs uppercase tracking-wide text-navy-700">Dirty, unassigned</div>
          <div className="text-2xl font-semibold" data-testid="count-unassigned">
            {summary.unassignedDirty}
          </div>
        </div>
      </section>

      {Object.keys(workload).length > 0 && (
        <p className="mb-4 text-sm text-navy-500" data-testid="workload">
          Workload:{' '}
          {Object.entries(workload)
            .map(([name, n]) => `${name} ${n}`)
            .join(' · ')}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3" role="search">
        <label className="text-sm">
          <span className="mr-2">Status</span>
          <select value={filters.status} onChange={setFilter('status')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2">Floor</span>
          <select value={filters.floor} onChange={setFilter('floor')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            {floors.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2">Attendant</span>
          <select value={filters.attendant} onChange={setFilter('attendant')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            <option value="unassigned">Unassigned</option>
            {ATTENDANTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2">Room</span>
          <input
            value={filters.query}
            onChange={setFilter('query')}
            placeholder="e.g. 204"
            className="w-24 rounded border border-navy-200 bg-white p-1"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-navy-500">No rooms match these filters.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((room) => (
            <li
              key={room.number}
              aria-label={`Room ${room.number}`}
              className="rounded-lg border border-navy-100 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">Room {room.number}</span>
                <span
                  data-testid={`status-${room.number}`}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${BADGE[room.status]}`}
                >
                  {STATUS_LABELS[room.status]}
                </span>
              </div>
              <label className="mb-2 block text-sm">
                <span className="mr-2 text-navy-500">Attendant</span>
                <select
                  aria-label={`Attendant for room ${room.number}`}
                  value={room.attendant ?? ''}
                  onChange={(e) => onAssign(room.number, e.target.value)}
                  className="rounded border border-navy-200 bg-white p-1"
                >
                  <option value="">Unassigned</option>
                  {ATTENDANTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                {TRANSITIONS[room.status].map((to) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => onStatus(room.number, to)}
                    className="rounded border border-navy-200 px-2 py-1 text-xs hover:bg-brass-100"
                  >
                    {ACTION_LABELS[to]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
