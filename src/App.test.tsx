import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { STORAGE_KEYS } from './utils/storageKeys';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ envKeys: { anthropic: false, google: false } }))),
  );
});

describe('App 설정 영속성', () => {
  it('저장된 Provider와 API 키로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('anthropic'));
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('sk-test'));

    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-test');
  });

  it('저장된 값이 잘못되면 기본값(google, 빈 키)으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEYS.provider, JSON.stringify('unknown'));
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify(123));

    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('google');
    expect(screen.getByLabelText('API Key')).toHaveValue('');
  });

  it('API 키를 입력하면 저장한다', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('API Key'), { target: { value: 'AIza-test' } });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKey)!)).toBe('AIza-test');
  });

  it('Provider를 바꾸면 Provider를 저장하고 저장된 API 키는 비운다', () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('AIza-test'));
    render(<App />);

    fireEvent.change(screen.getByLabelText('Provider'), { target: { value: 'anthropic' } });

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.provider)!)).toBe('anthropic');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKey)!)).toBe('');
  });

  it('프롬프트를 생성하면 히스토리에 저장한다', async () => {
    localStorage.setItem(STORAGE_KEYS.apiKey, JSON.stringify('key'));
    render(<App />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '요금제 카드' },
    });
    fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.promptHistory)!)).toEqual(['요금제 카드']);
  });
});
