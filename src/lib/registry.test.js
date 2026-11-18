import { describe, it, expect } from 'vitest';
import { loadModules } from './registry.js';

const Page = () => null;

describe('loadModules', () => {
  it('sorts by order, then label', () => {
    const mods = loadModules({
      a: { default: { id: 'b', path: '/b', label: 'Beta', order: 2, Page } },
      b: { default: { id: 'a', path: '/a', label: 'Alpha', order: 2, Page } },
      c: { default: { id: 'c', path: '/c', label: 'Zed', order: 1, Page } },
    });
    expect(mods.map((m) => m.id)).toEqual(['c', 'a', 'b']);
  });

  it('ignores malformed modules', () => {
    const mods = loadModules({
      ok: { default: { id: 'ok', path: '/ok', label: 'Ok', Page } },
      noPage: { default: { id: 'x', path: '/x', label: 'X' } },
      empty: {},
    });
    expect(mods).toHaveLength(1);
  });

  it('returns an empty list when there are no modules', () => {
    expect(loadModules({})).toEqual([]);
  });
});
