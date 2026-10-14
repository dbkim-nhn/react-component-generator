import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_HISTORY, addPromptToHistory } from './promptHistory';

describe('addPromptToHistory', () => {
  it('최대 10개까지 보관한다', () => {
    expect(MAX_PROMPT_HISTORY).toBe(10);
  });

  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addPromptToHistory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('최대 개수를 넘으면 가장 오래된 항목을 버린다', () => {
    const history = Array.from({ length: 10 }, (_, i) => `p${i}`);
    const result = addPromptToHistory(history, 'new');
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('new');
    expect(result).not.toContain('p9');
  });

  it('앞뒤 공백을 제거하고, 빈 문자열은 추가하지 않는다', () => {
    expect(addPromptToHistory(['a'], '  b  ')).toEqual(['b', 'a']);
    expect(addPromptToHistory(['a'], '   ')).toEqual(['a']);
  });
});
