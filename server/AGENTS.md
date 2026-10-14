# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI API 프록시. 프론트(Vite)는 `/api`를 이 서버(포트 3002)로 proxy한다. 루트 규칙은 `../AGENTS.md`를 따른다.

## Tech Stack and Constraints

- 런타임은 Bun이다. `Bun.serve`, `process.env`로 `.env`를 읽는다. Node 전용 서버 프레임워크(express 등)를 추가하지 않는다. (`index.ts:138`)
- 외부 API 호출은 전역 `fetch`를 직접 쓴다. SDK를 쓰지 않는다. (`index.ts:69,101`)
- 응답은 `Response.json(..., { headers: CORS_HEADERS })` 형태로 통일되어 있다. 새 라우트/에러 응답에도 `CORS_HEADERS`를 붙인다. 빠지면 브라우저에서 해당 응답만 CORS 오류가 난다. (`index.ts:51,155,172,190`)

## Implementation Patterns

- 새 공급자 추가: `Provider` 타입(`index.ts:57`), `ENV_KEYS`(`:59`), 호출 함수(`call*`), `/api/generate` 분기(`:183`)를 함께 수정하고, 클라이언트 `src/types/index.ts`의 `Provider`도 맞춘다.
- 후처리/정규화처럼 순수 함수는 `generator.ts`에, 재시도/폴백 같은 제어 흐름은 `fallback.ts`에 둔다. `index.ts`에는 부수효과와 라우팅만 둔다.
- 모델 이름 목록은 상단 상수로 관리한다. 우선순위 순서가 폴백 순서다. (`index.ts:5`)

## Testing Strategy

- 위치: `server/**/*.test.ts` (`../vite.config.ts`의 `include`). 실행: `bun run test server/`
- 테스트는 `vitest`의 `vi.fn`으로 의존 함수를 주입하는 방식이다. (`fallback.test.ts`) `index.ts`는 import하지 않는다.

## Local Golden Rules

- Do: Google API 키는 URL 쿼리(`?key=`)로 전달된다. (`index.ts:99`) 이 URL을 로그에 찍거나 `Error` 메시지에 포함하지 않는다. 현재 에러는 상태 코드만 담는다. (`:112`)
- Do: 사용자 입력 키(`apiKey`)가 서버 `.env` 키보다 우선한다. (`index.ts:65`) 이 우선순위를 뒤집지 않는다.
- Don't: `SYSTEM_PROMPT`(`index.ts:7-49`)를 수정할 때 "import 금지", "TypeScript 문법 금지", "render() 호출", "코드펜스 금지" 규칙을 지우지 않는다. react-live가 이를 실행하지 못한다. `generator.ts`의 후처리는 보조 장치다.
- Don't: Gemini `maxOutputTokens`(`index.ts:107`)나 Anthropic `max_tokens`(`:78`)를 값만 보고 통일하지 않는다. 공급자별 한도 정책이 다르고 잘림 처리도 비대칭이다.
