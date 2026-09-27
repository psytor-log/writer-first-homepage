# Writer-first Homepage

글을 쓰는 경험을 우선으로 설계하는 개인 기록 홈페이지입니다.

- 기획서: `docs/PLAN.md`
- 화면정의서: `docs/SCREEN_SPEC.md`
- 디자인 시스템: `DESIGN.md`

## 목표 확인 요약

- 프로젝트명(영문): `writer-first-homepage`
- 프로젝트 별명(한글): 미정
- 프로젝트 유형: 개인 홈페이지 및 글쓰기 관리 도구
- 목표: 글 작성자가 이미지·서식·문단·메뉴를 직접 편집하고, 독자는 모바일과 검색에서 쉽게 기록을 찾는 홈페이지를 제공한다.
- 측정 기준: 에디터, 메뉴 트리, 모바일, SEO/AI 검색 기본 요건을 구현하고 검증한다.
- 완료 조건: 기획서, 화면정의서, 구현물, 검증 기록을 모두 남긴다.
- 현재 단계: 기획 및 벤치마킹 조사
- 다음 작업: 기획서를 바탕으로 작성 화면과 발행 화면을 구현한다.

목표 컨펌 자동 진행(§0).

## 기본 메뉴

- 발자취: 한 줄 성취 기록
- 비즈로그: 사업의 계획과 회고
- 에세이: 생각, 인사이트, 푸념
- 일상: 독서·여행·일상 사진 기록
- 지식: 다시 찾는 지식 라이브러리

## 실행

```powershell
npm.cmd run dev
npm.cmd run build
```

`/studio` 경로는 현재 앱의 `글 쓰기` 버튼으로 열립니다. 작성 중인 제목·요약·본문·메뉴는 브라우저 `localStorage`에 자동 저장됩니다.

## SEO와 검색 등록

`npm.cmd run build`는 배포 URL이 주어지면 `canonical`, Open Graph URL, `WebSite` JSON-LD, `robots.txt`, `sitemap.xml`, `feed.xml`을 함께 생성한다. 홈은 최신 발행일(`publishedAt`) 내림차순으로 표시된다.

GitHub Pages 배포는 `.github/workflows/deploy.yml`에 준비되어 있다. 새 GitHub 저장소의 기본 브랜치를 `main`으로 설정하고 Pages의 Source를 **GitHub Actions**로 선택하면, `main` 푸시마다 `https://계정명.github.io/저장소명/`으로 배포된다. 워크플로가 이 URL과 하위 경로를 자동 주입하므로 수동으로 사이트맵 도메인을 고칠 필요가 없다.

배포가 완료되어 실제 URL이 열린 뒤에는 아래 두 등록을 해야 검색 수집을 요청할 수 있다.

1. [Google Search Console](https://search.google.com/search-console)에 URL-prefix 속성을 추가하고 소유권을 확인한 뒤 `sitemap.xml`을 제출한다.
2. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에 같은 사이트를 등록한다. 제공받은 확인 코드를 `VITE_NAVER_SITE_VERIFICATION`에 넣어 다시 배포한 후, `sitemap.xml`과 `feed.xml`을 각각 제출한다.

검색 반영 시점과 순위는 보장할 수 없다. 새 글마다 공개 URL, 본문 HTML, 고유 제목·설명·대표 이미지·`Article` JSON-LD를 생성하고 사이트맵/RSS에 추가해야 개별 글도 검색 결과에 안정적으로 노출된다.

## 배포 전 필수 연결

이 구현은 편집 UX를 먼저 검증하는 로컬 스튜디오다. 실제 공개 발행을 위해서는 다음을 연결해야 한다.

1. `localStorage` 저장소를 GitHub API, CMS 또는 데이터베이스와 이미지 스토리지로 교체한다.
2. 공개 글을 서버 또는 빌드 시 HTML로 렌더링한다. 검색엔진용 본문은 브라우저 실행 뒤에만 생기면 안 된다.
3. 글 발행 때 공개 글 URL을 정적 HTML·`sitemap.xml`·`feed.xml`에 추가하도록 발행 저장소를 연결한다. 현재 배포 워크플로는 홈페이지 URL을 자동 생성한다.
4. 게시물마다 canonical URL, Open Graph, `Article` JSON-LD를 생성한다.

`robots.txt`는 ChatGPT 검색 후보가 되도록 `OAI-SearchBot`은 허용하고, 모델 학습과 별도인 `GPTBot`은 기본적으로 차단한다. 정책은 언제든 변경할 수 있다.

## 관리자 인증 연결

홈의 `관리자 글쓰기` 버튼은 아이디·비밀번호 입력 화면을 열고 `POST /api/auth/login`으로 `{ username, password }`를 전달한다. 성공 시 서버는 `HttpOnly`, `Secure`, `SameSite=Strict` 세션 쿠키를 발급해야 한다.

정적 GitHub Pages만으로는 비밀번호를 안전하게 검증할 수 없다. 아이디·비밀번호를 프론트엔드 코드나 `VITE_*` 환경 변수에 넣으면 누구나 내려받아 볼 수 있으므로 금지한다. 실제 배포 전에는 Cloudflare Workers, Vercel Functions 또는 별도 서버 중 하나에 이 API와 비밀 환경 변수를 구성해야 한다.

### Cloudflare Worker 설정

이 프로젝트에는 `auth-worker/`가 포함되어 있다. Cloudflare에 로그인한 터미널에서 다음 순서로 실행한다. 비밀번호는 명령 다음의 보안 입력 창에만 넣으며, 코드·Git·채팅에 쓰지 않는다.

```powershell
cd 'I:\AI for works\writer-first-homepage\auth-worker'
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

배포 뒤 `auth-worker/wrangler.toml`의 `ALLOWED_ORIGIN`을 홈페이지의 실제 origin으로 변경해 다시 배포한다. 그리고 프로젝트 루트에 `.env.local`을 만들고 Worker URL을 넣는다.

```text
VITE_AUTH_API_BASE_URL=https://personal-homepage-admin-auth.YOUR-SUBDOMAIN.workers.dev
```

서로 다른 도메인의 쿠키가 브라우저에서 막히지 않도록, 공개 홈페이지와 Worker API는 같은 개인 도메인의 하위 도메인으로 운영하는 것을 권장한다. 예: `www.example.com`과 `admin-api.example.com`.

### 방명록과 메일 알림

방명록은 Cloudflare D1에 저장하며 공개 API는 닉네임·본문·작성 시각만 반환한다. 이메일과 비공개 글은 인증된 관리자 API에서만 반환한다. 먼저 `auth-worker/wrangler.toml`의 D1 바인딩 주석을 실제 `database_id`로 교체한 뒤 아래를 실행한다.

```powershell
cd 'I:\AI for works\writer-first-homepage\auth-worker'
npx wrangler d1 execute personal-homepage-messages --remote --file=schema.sql
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put MESSAGE_FROM_EMAIL
npx wrangler deploy
```

`ADMIN_USERNAME`과 `ADMIN_EMAIL`에는 같은 관리자 이메일을 설정하면 된다. `RESEND_API_KEY`와 발신 주소는 Resend에서 발급받아야 메일 알림이 발송된다.
