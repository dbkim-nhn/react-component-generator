import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/storageKeys';

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('useComponentGenerator 영속성', () => {
  it('저장된 컴포넌트 목록을 복원하고 createdAt을 Date로 되돌린다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: '1', prompt: '카드', code: 'render(<div/>)', createdAt: '2026-01-02T03:04:05.000Z' },
      ]),
    );

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].prompt).toBe('카드');
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('형식이 잘못된 항목은 버리고 올바른 항목만 복원한다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([
        { id: '1', prompt: '카드', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' },
        { id: 2, prompt: null },
        'garbage',
      ]),
    );

    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components.map((c) => c.id)).toEqual(['1']);
  });

  it('생성에 성공하면 목록을 localStorage에 저장한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ code: 'render(<div/>)' }), { status: 200 })),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', 'key', 'google');
    });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!);
      expect(saved).toHaveLength(1);
      expect(saved[0].prompt).toBe('버튼');
    });
  });

  it('전체 삭제하면 저장된 목록도 비운다', () => {
    localStorage.setItem(
      STORAGE_KEYS.components,
      JSON.stringify([{ id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' }]),
    );
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.components)!)).toEqual([]);
  });
});
