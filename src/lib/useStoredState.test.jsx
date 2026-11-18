import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoredState } from './useStoredState.js';

describe('useStoredState', () => {
  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useStoredState('k1', [1, 2]));
    expect(result.current[0]).toEqual([1, 2]);
  });

  it('persists updates and restores them on remount', () => {
    const first = renderHook(() => useStoredState('k2', 'a'));
    act(() => first.result.current[1]('b'));
    first.unmount();
    const second = renderHook(() => useStoredState('k2', 'a'));
    expect(second.result.current[0]).toBe('b');
  });

  it('falls back to the initial value when stored JSON is corrupt', () => {
    window.localStorage.setItem('k3', '{not json');
    const { result } = renderHook(() => useStoredState('k3', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
