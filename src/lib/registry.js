/**
 * Module registry.
 *
 * Every folder in src/modules/<name>/ exposes an index.js whose default export is:
 *   { id, path, label, description, icon, order, Page }
 * App.jsx discovers them with import.meta.glob, so adding a module never
 * requires editing a shared file (no merge conflicts between module branches).
 */
export function loadModules(globResult) {
  return Object.values(globResult)
    .map((m) => m.default)
    .filter((m) => m && m.id && m.path && m.Page)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.label.localeCompare(b.label));
}
