# AGENTS.md

## Operational Commands

- 패키지 매니저는 `bun`. `npm`/`yarn`/`pnpm`으로 설치하지 않는다. (README 실행 방법이 `bun install` 기준)
- 개발 서버(API + Vite 동시): `bun run dev`
- 테스트: `bun run test` (vitest run). `bun test`는 Bun 내장 러너를 실행하므로 `vite.config.ts`의 jsdom/setup 설정이 적용되지 않는다. 쓰지 않는다.
- 단일 테스트: `bun run test server/fallback.test.ts`
- 타입 검사 + 빌드: `bun run build` (tsc -b 후 vite build)
- 린트: `bun run lint`
- 변경 후 최소 검증: `bun run lint` 와 `bun run test`

## Golden Rules

### Immutable

- `.env`는 읽거나 출력하거나 커밋하지 않는다. (`.gitignore`에 등록, 실제 API 키 포함 가능)
- API 키 값은 서버 밖으로 내보내지 않는다. `GET /api/config`는 키 존재 여부(boolean)만 반환한다. (`server/index.ts:147-153`) 키 값, 키가 포함된 URL을 응답/로그/에러 메시지에 넣지 않는다.
- 이 프로젝트에서 사용하는 AI 응답 코드 규약(import 금지, TypeScript 문법 금지, `render()` 호출)은 `server/index.ts`의 `SYSTEM_PROMPT`와 `server/generator.ts`가 한 쌍이다. 한쪽만 바꾸지 않는다.

### Do's and Don'ts

- Do: 포트를 바꾸면 `server/index.ts:139`(3002)와 `vite.config.ts`의 `/api` proxy target을 함께 바꾼다. 한쪽만 바꾸면 프론트가 API에 닿지 않는다.
- Do: tsconfig에 `erasableSyntaxOnly`, `verbatimModuleSyntax`가 켜져 있다. (`tsconfig.app.json`) 타입은 `import type`으로 가져오고, `enum`/`namespace`/생성자 parameter property는 쓰지 않는다.
- Do: 서버 로직을 추가할 때 테스트가 필요하면 `server/generator.ts`처럼 부수효과 없는 모듈로 분리한다. (`server/generator.ts:1-2`)
- Don't: 테스트에서 `server/index.ts`를 import하지 않는다. import 즉시 `Bun.serve`가 포트를 점유한다. (`server/index.ts:138`)
- Don't: 에러를 던질 때 HTTP 상태 코드 문자열(`503`, `429`)을 메시지에서 제거하지 않는다. 응답 상태 매핑이 `message.includes('503')` 문자열 매칭에 의존한다. (`server/index.ts:194,201`, 원본 throw는 `:85`, `:112`)

### 비대칭 (한쪽 경로에만 있는 처리)

- 모델 폴백(`withModelFallback`)과 `MAX_TOKENS` 잘림 검사는 Google 경로에만 있다. (`server/index.ts:5,123,134`) Anthropic 경로(`callAnthropic`, `:68`)는 단일 모델 고정이고 `stop_reason` 검사가 없다. 공급자 동작을 같다고 가정하고 수정하지 않는다. 한쪽에 동작을 추가하면 다른 쪽에도 필요한지 먼저 판단한다.

### 이중 방어 (같은 위험을 두 곳에서 막음)

- 마크다운 코드펜스 방지: 프롬프트 규칙(`server/index.ts:16`) + `stripCodeFences`(`server/generator.ts:5`).
- `render()` 호출 보장: 프롬프트 규칙(`server/index.ts:12`) + `ensureRenderCall`(`server/generator.ts:16`). react-live `noInline` 모드는 `render()`가 없으면 아무것도 그리지 않는다. (`src/components/LivePreview.tsx:14`)
- 둘 중 하나를 제거하면 모델 응답이 흔들릴 때 미리보기가 빈 화면이 된다. 프롬프트만 믿고 후처리를 지우지 않는다.

### 테스트 경계

- 테스트 있음: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`.
- 테스트 없음: `server/index.ts`(HTTP/외부 API 호출), `src/hooks/useComponentGenerator.ts`, `src/components/LivePreview.tsx`, `src/App.tsx`. 이 영역을 수정하면 `bun run dev`로 직접 생성 흐름을 확인한다.
- `generator.ts`/`fallback.ts` 동작을 바꾸면 해당 `*.test.ts`를 같이 수정한다.

## Project Context

- 목표: 프롬프트로 React 컴포넌트를 AI로 생성하고 react-live로 즉시 미리보기한다.
- Stack: React 19, TypeScript, Vite, Bun(API 프록시, 포트 3002), react-live, vitest, ESLint.

## Standards and References

- 프로젝트 소개/설치/기능 설명은 `README.md`를 따른다.
- 커밋 메시지: `<type>: <한국어 요약>`, type은 feat/fix/refactor/chore. 상세 절차는 `.claude/skills/commit/SKILL.md`.
- 코드 주석과 사용자 노출 에러 메시지는 한국어가 기존 관례다. (`server/fallback.ts`, `server/index.ts:124,196`)
- 의존성 잠금 파일은 `bun.lock`과 `package-lock.json`이 모두 있다. 의존성을 바꾸면 `bun install`로 갱신하고 두 파일이 어긋나지 않았는지 사용자에게 알린다.

## Maintenance Policy

- 이 파일의 규칙과 코드가 어긋나면(포트, 스크립트, 파일 경로, 라인 근거 등) 작업을 마치기 전에 AGENTS.md 수정을 제안한다.
- 규칙에 적힌 라인 번호는 근거 위치다. 코드가 바뀌어 위치가 달라지면 갱신을 제안한다.
