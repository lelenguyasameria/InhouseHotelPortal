import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader.jsx';
import { useStoredState } from '../../lib/useStoredState.js';
import { TECHNICIANS, createSeedOrders } from './data.js';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  TRANSITIONS,
  assignOrder,
  createOrder,
  filterOrders,
  isOverdue,
  sortOrders,
  summarize,
  updateOrder,
} from './logic.js';

const ACTION_LABELS = {
  in_progress: 'Start work',
  resolved: 'Mark resolved',
  open: 'Reopen',
  closed: 'Close',
};

const PRIORITY_BADGE = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-sky-100 text-sky-800',
  low: 'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = { location: '', description: '', priority: 'normal', reportedBy: '' };

export default function MaintenancePage() {
  // TODO: load from GET /api/maintenance/orders instead of localStorage
  const [orders, setOrders] = useStoredState('portal.maintenance.orders', createSeedOrders);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState({ status: '', priority: '', query: '' });
  const [error, setError] = useState('');

  const now = new Date().toISOString();
  const summary = useMemo(() => summarize(orders, now), [orders, now]);
  const visible = useMemo(() => sortOrders(filterOrders(orders, filters)), [orders, filters]);

  const apply = (fn) => {
    try {
      setOrders(fn(orders));
      setError('');
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  // TODO: POST /api/maintenance/orders
  const onCreate = (e) => {
    e.preventDefault();
    if (apply((c) => createOrder(c, form))) setForm(EMPTY_FORM);
  };
  // TODO: POST /api/maintenance/orders/:id/status
  const onStatus = (id, to) => apply((c) => updateOrder(c, id, to));
  // TODO: POST /api/maintenance/orders/:id/assignment
  const onAssign = (id, who) => apply((c) => assignOrder(c, id, who));

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Report faults and track work orders to completion." />

      <section aria-label="Summary" className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Open', summary.open, 'open'],
          ['In progress', summary.in_progress, 'in-progress'],
          ['Urgent, active', summary.urgentActive, 'urgent'],
          ['Overdue', summary.overdue, 'overdue'],
        ].map(([label, value, key]) => (
          <div key={key} className="rounded-lg border border-navy-100 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-navy-500">{label}</div>
            <div className="text-2xl font-semibold" data-testid={`count-${key}`}>
              {value}
            </div>
          </div>
        ))}
      </section>

      <form onSubmit={onCreate} aria-label="New work order" className="mb-6 rounded-lg border border-navy-100 bg-white p-4">
        <h2 className="mb-3 font-semibold text-navy-800">Report a fault</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="block text-navy-500">Location</span>
            <input value={form.location} onChange={setField('location')} className="w-full rounded border border-navy-200 p-1" />
          </label>
          <label className="text-sm">
            <span className="block text-navy-500">Priority</span>
            <select value={form.priority} onChange={setField('priority')} className="w-full rounded border border-navy-200 bg-white p-1">
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="block text-navy-500">Description</span>
            <textarea value={form.description} onChange={setField('description')} rows={2} className="w-full rounded border border-navy-200 p-1" />
          </label>
          <label className="text-sm">
            <span className="block text-navy-500">Reported by (optional)</span>
            <input value={form.reportedBy} onChange={setField('reportedBy')} className="w-full rounded border border-navy-200 p-1" />
          </label>
        </div>
        <button type="submit" className="mt-3 rounded bg-navy-800 px-4 py-2 text-sm font-medium text-brass-300 hover:bg-navy-700">
          Create work order
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3" role="search">
        <label className="text-sm">
          <span className="mr-2">Filter status</span>
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
          <span className="mr-2">Filter priority</span>
          <select value={filters.priority} onChange={setFilter('priority')} className="rounded border border-navy-200 bg-white p-1">
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2">Search</span>
          <input value={filters.query} onChange={setFilter('query')} className="rounded border border-navy-200 p-1" />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-navy-500">No work orders match.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => (
            <li key={o.id} aria-label={`Work order ${o.id}`} className="rounded-lg border border-navy-100 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">
                  #{o.id} · {o.location}
                </div>
                <div className="flex gap-2 text-xs">
                  <span className={`rounded px-2 py-0.5 font-medium ${PRIORITY_BADGE[o.priority]}`}>{PRIORITY_LABELS[o.priority]}</span>
                  <span data-testid={`status-${o.id}`} className="rounded bg-navy-100 px-2 py-0.5 font-medium text-navy-700">
                    {STATUS_LABELS[o.status]}
                  </span>
                  {isOverdue(o, now) && <span className="rounded bg-red-600 px-2 py-0.5 font-medium text-white">Overdue</span>}
                </div>
              </div>
              <p className="my-2 text-sm">{o.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm">
                  <span className="mr-2 text-navy-500">Assigned to</span>
                  <select
                    aria-label={`Assignee for work order ${o.id}`}
                    value={o.assignee ?? ''}
                    onChange={(e) => onAssign(o.id, e.target.value)}
                    className="rounded border border-navy-200 bg-white p-1"
                  >
                    <option value="">Unassigned</option>
                    {TECHNICIANS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                {TRANSITIONS[o.status].map((to) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => onStatus(o.id, to)}
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
