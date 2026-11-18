# In-House Hotel Portal

A locally-hosted internal portal for running a hotel day to day.
Stack: Vite + React, Tailwind CSS (navy and brass theme), lucide-react icons, Vitest + Testing Library.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173, also reachable on the hotel LAN
npm test         # run all tests once
npm run build    # production build into dist/
```

## How modules work

Each feature lives in `src/modules/<name>/` and exposes an `index.js` whose default export is:

```js
export default { id, path, label, description, icon, order, Page };
```

`App.jsx` finds every module automatically with `import.meta.glob`, so adding a module never means editing a
shared file. Branches for different modules can be merged in any order without conflicts.

A module folder normally contains:

| File | Purpose |
| --- | --- |
| `logic.js` + `logic.test.js` | Pure functions (status rules, sorting, summaries) with unit tests |
| `Page.jsx` + `Page.test.jsx` | The screen and its interaction tests |
| `data.js` | Seed data and the list of REST endpoints the module expects |
| `index.js` | Registry entry |

## Data and backend

Until the real backend exists, each module stores its data in `localStorage` (`src/lib/useStoredState.js`) and
seeds it from its own `data.js`. Backend touchpoints are marked with `// TODO:` comments, and
`src/lib/api.js` holds the shared request helper.

## Branch layout

- `feat/scaffold`: app shell, module registry, shared helpers (base for everything else)
- `feat/<module>`: one branch per finished, tested module
- `needs-clarification/<module>`: work that is blocked or needs a decision, with a `NOTES.md`
