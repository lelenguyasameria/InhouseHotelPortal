import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { useStoredState } from '../../lib/useStoredState.js';
import { createSeedRequests } from './data.js';
import {
  DEPARTMENTS,
  REQUEST_TYPES,
  STATUS_LABELS,
  TRANSITIONS,
  createRequest,
  filterRequests,
  isStale,
  reroute,
  sortRequests,
  summarize,
  updateStatus,
  waitingMinutes,
} from './logic.js';

const ACTION_LABELS = { in_progress: 'Start', done: 'Mark done', cancelled: 'Cancel' };
const EMPTY_FORM = { room: '', type: 'towels', notes: '' };

export default function GuestRequestsPage() {
  // TODO: load from GET /api/guest-requests instead of localStorage
  const [requests, setRequests] = useStoredState('portal.guestRequests', createSeedRequests);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState({ department: '', status: '' });
  const [error, setError] = useState('');

  const now = new Date().toISOString();
  const summary = useMemo(() => summarize(requests, now), [requests, now]);
  const visible = useMemo(() => sortRequests(filterRequests(requests, filters)), [requests, filters]);

  const apply = (fn) => {
    try {
      setRequests(fn(requests));
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  // TODO: POST /api/guest-requests
  const onCreate = (e) => {
    e.preventDefault();
    if (apply((c) => createRequest(c, form))) setForm(EMPTY_FORM);
  };
  // TODO: POST /api/guest-requests/:id/status
  const onStatus = (id, to) => apply((c) => updateStatus(c, id, to));
  // TODO: POST /api/guest-requests/:id/department
  const onReroute = (id, dept) => apply((c) => reroute(c, id, dept));

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader title="Guest requests" subtitle="Log what guests ask for and route it to the right team." />

      <section aria-label="Summary" className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Pending', summary.pending, 'pending'],
          ['In progress', summary.in_progress, 'in-progress'],
          ['Waiting over 30 min', summary.stale, 'stale'],
        ].map(([label, value, key]) => (
          <div key={key} className="rounded-lg border border-navy-100 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-navy-500">{label}</div>
            <div className="text-2xl font-semibold" data-testid={`count-${key}`}>
              {value}
            </div>
          </div>
        ))}
      </section>

      <form onSubmit={onCreate} aria-label="New guest request" className="mb-6 rounded-lg border border-navy-100 bg-white p-4">
        <h2 className="mb-3 font-semibold text-navy-800">Log a request</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="block text-navy-500">Room</span>
            <input value={form.room} onChange={setField('room')} className="w-full rounded border border-navy-200 p-1" />
          </label>
          <label className="text-sm">
            <span className="block text-navy-500">Request type</span>
            <select value={form.type} onChange={setField('type')} className="w-full rounded border border-navy-200 bg-white p-1">
              {Object.entries(REQUEST_TYPES).map(([key, t]) => (
                <option key={key} value={key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-navy-500">Notes</span>
            <input value={form.notes} onChange={setField('notes')} className="w-full rounded border border-navy-200 p-1" />
          </label>
        </div>
        <p className="mt-2 text-xs text-navy-500" data-testid="routing-hint">
          Goes to: {DEPARTMENTS[REQUEST_TYPES[form.type].department]}
        </p>
        <button type="submit" className="mt-3 rounded bg-navy-800 px-4 py-2 text-sm font-medium text-brass-300 hover:bg-navy-700">
          Log request
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3" role="search">
        <label className="text-sm">
          <span className="mr-2">Filter department</span>
          <select value={filters.department} onChange={setFilter('department')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            {Object.entries(DEPARTMENTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({summary.byDepartment[key]})
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2">Filter status</span>
          <select value={filters.status} onChange={setFilter('status')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-navy-500">No requests match.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id} aria-label={`Request ${r.id}`} className="rounded-lg border border-navy-100 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">
                  Room {r.room} · {REQUEST_TYPES[r.type]?.label ?? r.type}
                </div>
                <div className="flex gap-2 text-xs">
                  <span data-testid={`status-${r.id}`} className="rounded bg-navy-100 px-2 py-0.5 font-medium text-navy-700">
                    {STATUS_LABELS[r.status]}
                  </span>
                  {isStale(r, now) && <span className="rounded bg-red-600 px-2 py-0.5 font-medium text-white">Waiting {waitingMinutes(r, now)} min</span>}
                </div>
              </div>
              {r.notes && <p className="my-2 text-sm">{r.notes}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm">
                  <span className="mr-2 text-navy-500">Department</span>
                  <select
                    aria-label={`Department for request ${r.id}`}
                    value={r.department}
                    onChange={(e) => onReroute(r.id, e.target.value)}
                    className="rounded border border-navy-200 bg-white p-1"
                  >
                    {Object.entries(DEPARTMENTS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {TRANSITIONS[r.status].map((to) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => onStatus(r.id, to)}
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
