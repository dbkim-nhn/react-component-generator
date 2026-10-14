import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useLocalStorage', () => {
  it('저장된 값이 없으면 초기값을 쓴다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 그 값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
    expect(localStorage.getItem('k')).toBe(JSON.stringify('next'));
  });

  it('업데이트 함수 형태로도 값을 바꿀 수 있다', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('k', [1]));
    act(() => result.current[1]((prev) => [...prev, 2]));
    expect(result.current[0]).toEqual([1, 2]);
    expect(JSON.parse(localStorage.getItem('k')!)).toEqual([1, 2]);
  });

  it('저장된 JSON이 깨져 있으면 초기값으로 되돌린다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('revive 함수가 에러를 던지면 초기값으로 되돌린다', () => {
    localStorage.setItem('k', JSON.stringify(123));
    const revive = (parsed: unknown) => {
      if (typeof parsed !== 'string') throw new Error('invalid');
      return parsed;
    };
    const { result } = renderHook(() => useLocalStorage('k', 'init', revive));
    expect(result.current[0]).toBe('init');
  });

  it('revive 함수로 저장된 값을 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('2026-01-02T03:04:05.000Z'));
    const { result } = renderHook(() =>
      useLocalStorage<Date>('k', new Date(0), (parsed) => new Date(parsed as string)),
    );
    expect(result.current[0]).toBeInstanceOf(Date);
    expect(result.current[0].toISOString()).toBe('2026-01-02T03:04:05.000Z');
  });

  it('localStorage 접근이 실패해도 상태는 정상 동작한다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => useLocalStorage('k', 'init'));
    expect(result.current[0]).toBe('init');
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
  });
});
