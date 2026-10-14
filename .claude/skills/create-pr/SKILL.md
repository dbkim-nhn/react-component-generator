---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 템플릿에 맞는 한국어 PR 제목과 본문을 작성하고 GitHub PR을 생성한다. 사용자가 "PR 만들어줘", "PR 올려줘", "풀리퀘 생성", "pull request 열어줘", "create pr", "리뷰 요청할 수 있게 PR 올려줘"처럼 현재 브랜치를 GitHub에 PR로 올려 달라고 하면 반드시 이 스킬을 사용한다. 커밋만 요청하는 경우(commit 스킬)나 기존 PR 리뷰 반영(autofix)에는 쓰지 않는다.
context: fork
allowed-tools: Read Glob Grep Bash
---

# create-pr

현재 브랜치와 base 브랜치의 차이를 분석해 PR을 만든다. 이 스킬은 `context: fork`로 분리된 컨텍스트에서 실행되므로 사용자에게 질문할 수 없다. 판단이 필요한 지점은 아래 규칙대로 안전한 쪽으로 처리하고, 결과는 마지막 보고에 남긴다.

PR 본문은 `references/pr-template.md`를 따른다. 템플릿을 먼저 읽는다.

## 절차

### 1. 사전 확인

```bash
git branch --show-current
git status --short
gh auth status
gh repo view --json defaultBranchRef -q .defaultBranchRef.name   # base 후보
git remote -v
```

아래 경우는 PR을 만들지 않고 이유를 보고하고 끝낸다. 되돌리기 어려운 동작을 임의로 하지 않기 위해서다.

- 현재 브랜치가 base(기본 브랜치)와 같다. 기본 브랜치에서 PR을 만들 수 없다. 새 브랜치를 만들어야 한다고 안내한다.
- `gh`가 인증되어 있지 않거나 origin remote가 없다.
- base 대비 커밋이 0개다.
- 이미 같은 브랜치의 열린 PR이 있다 (`gh pr view --json url,state`). URL을 알려준다.

working tree에 커밋되지 않은 변경이 있으면 PR 범위에서 제외된다는 점을 보고에 적는다. 커밋은 이 스킬이 하지 않는다(commit 스킬의 역할).

### 2. 변경 분석

base 브랜치 기준으로 이 브랜치가 추가한 변경만 본다.

```bash
git fetch origin <base> --quiet
git log origin/<base>..HEAD --oneline
git diff origin/<base>...HEAD --stat
git diff origin/<base>...HEAD        # 큰 경우 파일별로 나눠서 읽는다
```

- 커밋 메시지와 diff를 함께 본다. 메시지만 믿으면 실제 변경과 어긋날 수 있다.
- 테스트 파일 변경, 설정/의존성 변경, UI 변경 여부를 구분해 둔다. 템플릿의 테스트·스크린샷 항목을 채우는 근거가 된다.
- 연결할 이슈 번호가 브랜치명, 커밋 메시지, 인자에 있으면 사용한다. 없으면 이슈 항목은 "없음"으로 둔다. 번호를 추측해서 쓰지 않는다.

### 3. 제목과 본문 작성

- 제목: 커밋 컨벤션과 같은 `<type>: <한국어 요약>`. type은 feat/fix/refactor/chore. 커밋이 여러 개여도 PR 전체를 대표하는 하나의 type과 요약을 고른다. 70자 이내.
- 본문: `references/pr-template.md`의 섹션을 그대로 채운다. 섹션 이름과 순서는 바꾸지 않는다.
- 근거 없는 내용을 쓰지 않는다. 테스트를 실행하지 않았으면 "실행함"이라고 쓰지 않는다. 실행 여부를 확인하려면 프로젝트의 테스트 명령(`AGENTS.md`/`README.md`)을 실제로 돌리고 결과를 적는다. 돌릴 수 없으면 "미실행"이라고 적는다.
- 해당 없는 선택 섹션(예: UI 변경이 없을 때의 스크린샷)은 "해당 없음" 한 줄로 둔다.
- API 키, 토큰, `.env` 값, 개인정보가 diff에 보이면 본문에 인용하지 않는다. 파일명만 적고, PR 생성을 중단한 뒤 보고한다.

### 4. push 및 PR 생성

1. 원격에 현재 브랜치가 없거나 뒤처져 있으면 `git push -u origin <branch>`. 기본 브랜치로는 push하지 않는다. force push는 하지 않는다.
2. 본문을 임시 파일에 쓰고 `--body-file`로 전달한다. 본문 안의 따옴표, 백틱, 줄바꿈이 셸에서 깨지는 것을 막기 위해서다.

```bash
gh pr create --base <base> --title "<제목>" --body-file <본문 파일> [--draft]
```

- 인자(`$ARGUMENTS`)에 `draft`, `--draft`, "초안"이 있으면 `--draft`를 붙인다.
- 인자에 base 브랜치가 지정되어 있으면 그것을 쓰고, 없으면 기본 브랜치를 쓴다.
- 리뷰어/라벨은 인자로 명시된 경우에만 붙인다.

### 5. 결과 보고

forked 컨텍스트에서 돌아가므로 메인 대화에는 이 보고만 전달된다. 아래를 짧게 담는다.

```
PR 생성 완료
- URL: <PR URL>
- 제목: <제목>
- base <- head: main <- feature/xxx (커밋 N개)
- 테스트: <실행 결과 또는 미실행>
- 참고: <커밋되지 않은 변경, 건너뛴 항목 등. 없으면 생략>
```

PR을 만들지 않았다면 이유와 사용자가 해야 할 일을 적는다.

## 하지 말아야 할 것

- 기본 브랜치로 push하거나 force push하지 않는다.
- 커밋을 새로 만들지 않는다. 필요하면 commit 스킬을 먼저 쓰라고 안내한다.
- 템플릿 섹션을 임의로 추가/삭제/이름 변경하지 않는다.
- 이미 존재하는 PR을 수정하거나 닫지 않는다.
