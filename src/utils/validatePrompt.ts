export const MAX_PROMPT_LENGTH = 500;

export interface PromptValidation {
  valid: boolean;
  length: number;
  error?: string;
}

// 길이는 사용자가 보는 글자 수 기준이다. [...text]는 이모지 같은 서로게이트 쌍을 한 글자로 센다.
export function validatePromptLength(prompt: string): PromptValidation {
  const length = [...prompt].length;

  if (length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      length,
      error: `프롬프트는 ${MAX_PROMPT_LENGTH}자 이하로 입력해주세요.`,
    };
  }

  return { valid: true, length };
}
