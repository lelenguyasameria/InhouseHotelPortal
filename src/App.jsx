import { NavLink, Route, Routes } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { loadModules } from './lib/registry.js';
import Home from './pages/Home.jsx';

const modules = loadModules(import.meta.glob('./modules/*/index.js', { eager: true }));

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded px-3 py-2 text-sm transition ${
    isActive ? 'bg-brass-500 text-navy-900 font-semibold' : 'text-navy-100 hover:bg-navy-700'
  }`;

export default function App({ modules: injected }) {
  const mods = injected ?? modules;
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-navy-800 p-4 md:w-60 md:shrink-0">
        <div className="mb-6 font-display text-lg font-semibold text-brass-300">
          In-House Portal
        </div>
        <nav aria-label="Main" className="flex flex-row flex-wrap gap-1 md:flex-col">
          <NavLink to="/" end className={linkClass}>
            <HomeIcon size={16} aria-hidden="true" /> Home
          </NavLink>
          {mods.map(({ id, path, label, icon: Icon }) => (
            <NavLink key={id} to={path} className={linkClass}>
              {Icon && <Icon size={16} aria-hidden="true" />} {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Home modules={mods} />} />
          {mods.map(({ id, path, Page }) => (
            <Route key={id} path={path} element={<Page />} />
          ))}
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
