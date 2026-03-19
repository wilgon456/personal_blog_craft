# personal_blog_craft

Craft를 CMS로 사용하고 Next.js App Router로 정적 HTML을 생성한 뒤 GitHub Pages에 배포하는 개인 블로그 프로젝트다.

## 현재 상태

- Craft `Posts` 컬렉션 연동 완료
- 홈 / 상세 / 태그 / 아카이브 / 검색 구현 완료
- GitHub Pages 배포 워크플로 연결 완료
- `sitemap.xml`, `robots.txt`, canonical, 기본 Open Graph, JSON-LD 적용 완료

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Craft Multi-Document API
- GitHub Pages
- GitHub Actions

## 로컬 실행

`.env.local` 예시:

```env
CRAFT_API_URL=https://connect.craft.do/links/your-link/api/v1
SITE_URL=https://your-site.example
BLOG_AUTHOR_NAME=your-name
BLOG_AUTHOR_URL=https://your-profile.example
```

개발 서버:

```bash
npm run dev
```

정적 빌드 확인:

```bash
npm run build
```

품질 검사:

```bash
npm run lint
npm run typecheck
```

## 프로젝트 구조

```text
src/
  app/
    page.tsx
    archive/page.tsx
    posts/[slug]/page.tsx
    tags/[tag]/page.tsx
    search/page.tsx
    sitemap.ts
    robots.ts
  components/
  lib/
    craft.ts
    posts.ts
    markdown.ts
    site.ts
  types/
guide/
  research.md
  plan.md
  diy.md
```

## 배포 방식

배포는 [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)에서 처리한다.

- `main` 푸시 시 자동 배포
- 수동 실행 가능
- 15분 주기 스케줄 재빌드
- `CRAFT_API_URL`은 GitHub Actions Secret 사용

현재 GitHub Pages 주소:

- <https://wilgon456.github.io/personal_blog_craft/>

## Craft 데이터 흐름

1. GitHub Actions 또는 로컬 빌드가 Craft API를 호출한다.
2. `src/lib/craft.ts`에서 컬렉션과 아이템을 가져온다.
3. `src/lib/posts.ts`에서 블로그 포스트 모델로 정규화한다.
4. `published=true` 포스트만 화면에 노출한다.
5. Next.js가 정적 페이지를 생성한다.

## 중요한 운영 원칙

- 공개 문서와 초안 문서는 가능하면 분리한다.
- `published=false`는 노출 필터일 뿐, 보안 경계로 믿지 않는다.
- slug는 영문 직접 입력이 기본이며 비어 있으면 제목 기반으로 자동 생성된다.
- 태그는 한글/영문 혼용 가능하지만 라우트용 값은 내부적으로 정규화된다.

## 참고 문서

- [research.md](./guide/research.md)
- [plan.md](./guide/plan.md)
- [diy.md](./guide/diy.md)
- [content-model.md](./guide/content-model.md)
- [operations.md](./guide/operations.md)
