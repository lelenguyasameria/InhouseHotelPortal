export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b-2 border-brass-500 pb-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
