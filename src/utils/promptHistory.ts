export const MAX_PROMPT_HISTORY = 10;

export function addPromptToHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;

  return [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, MAX_PROMPT_HISTORY);
}
