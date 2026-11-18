import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

export default function Home({ modules }) {
  return (
    <div>
      <PageHeader title="Welcome" subtitle="Day-to-day running of the hotel, in one place." />
      {modules.length === 0 ? (
        <p className="text-navy-500">No modules installed yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map(({ id, path, label, description, icon: Icon }) => (
            <li key={id}>
              <Link
                to={path}
                className="block rounded-lg border border-navy-100 bg-white p-4 shadow-sm transition hover:border-brass-500"
              >
                <div className="flex items-center gap-2 font-semibold text-navy-800">
                  {Icon && <Icon size={18} className="text-brass-600" aria-hidden="true" />}
                  {label}
                </div>
                {description && <p className="mt-1 text-sm text-navy-500">{description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
