# Craft CMS 기반 개인 블로그 조사 보고서

조사일: 2026-03-19  
대상 프로젝트: `personal_blog_craft`  
목적: Craft를 CMS로 사용하면서 GitHub 기반 무료 블로그를 운영할 수 있는지 검증하고, Notion 블로그 템플릿 재활용 여부와 SEO 전략까지 포함해 구현 방향을 결정한다.

---

## 1. 요구사항 정리

이번 조사에서 반드시 만족해야 하는 조건은 아래 4가지다.

1. Craft에서 글을 작성하면 블로그가 업데이트되어야 한다.
2. 블로그는 GitHub 기반 무료 웹페이지로 운영하고 싶다.
3. Notion 블로그 템플릿을 수정해서 쓰는 편이 나은지, 별도 블로그를 새로 만드는 편이 나은지 비교가 필요하다.
4. Craft를 CMS로 쓰더라도 SEO는 강하게 가져가고 싶다.

---

## 2. 핵심 결론

### 결론 요약

- Craft를 CMS처럼 사용하는 것은 가능하다.
- GitHub Pages로 무료 배포도 가능하다.
- 다만 GitHub Pages는 정적 호스팅이므로, Craft 수정 사항이 사이트에 반영되려면 "사이트 재빌드/재배포"가 필요하다.
- 따라서 "Craft에서 글 작성 즉시 반영"은 GitHub Pages 단독 기능이 아니라, GitHub Actions 트리거 전략으로 해결해야 한다.
- Notion 블로그 템플릿을 그대로 포크해서 쓰는 것보다는, "Craft 전용 데이터 레이어를 가진 별도 블로그"를 만드는 편이 장기적으로 더 안정적이다.
- 단, 기존 Notion 블로그 템플릿의 UI, 포스트 카드, 태그 화면, SEO 구조는 참고하거나 일부 차용할 가치가 있다.
- SEO는 충분히 강하게 설계할 수 있다. 핵심은 정적 HTML 생성, 메타데이터, canonical, sitemap, robots, JSON-LD, 커스텀 도메인, 이미지 전략이다.

### 최종 권장안

**권장안은 `Craft API + Next.js 정적 export + GitHub Actions + GitHub Pages` 조합이다.**

단, 운영 방식은 아래처럼 잡는 것이 현실적이다.

- 콘텐츠 작성: Craft
- 데이터 수집: 빌드 시 Craft API 호출
- 사이트 생성: Next.js static export
- 배포: GitHub Pages
- 자동 반영: GitHub Actions `schedule` 또는 `repository_dispatch`
- SEO 강화: 정적 prerender + 메타데이터 + 구조화 데이터 + 커스텀 도메인

---

## 3. 조사 결과

## 3.1 Craft를 CMS로 활용할 수 있는가

### 가능 여부

가능하다. Craft 공식 도움말과 공식 "Imagine" 사례에서 API Connection을 만들어 특정 문서를 외부 툴이나 웹사이트와 연결하는 흐름을 직접 안내하고 있다. Craft는 현재 다음 성격을 가진다.

- API Connection으로 특정 문서 또는 공간 범위를 외부에 연결할 수 있다.
- 읽기 전용 연결을 만들 수 있다.
- 문서 검색, 문서 조회, 블록 조회, 컬렉션 관련 작업을 API로 다룰 수 있다.
- 블록 응답은 `application/json` 또는 `text/markdown` 형태로 가져올 수 있다.

즉, Craft를 "글 작성 도구 + 콘텐츠 원본"으로 쓰고, 외부 블로그가 이를 읽어 렌더링하는 구조는 공식 방향성과도 맞다.

### 블로그 CMS로서의 장점

- 에디터 경험이 좋다.
- 컬렉션 필드로 `tags`, `date`, `published` 같은 메타데이터를 관리하기 쉽다.
- 블록을 `text/markdown`으로 받을 수 있어 Notion block renderer보다 렌더링 복잡도가 낮을 가능성이 크다.
- 검색과 문서 접근 범위를 API connection 단위로 관리할 수 있다.

### 가장 중요한 제약

Craft 공식 "Personal Blog" 가이드에는 매우 중요한 경고가 있다.

- 사이트에서 `Published` 필드로 노출 여부를 제어할 수는 있다.
- 하지만 같은 문서를 public API connection으로 노출하면, unpublished 글도 API를 통해 접근될 수 있다고 안내한다.

이건 이 프로젝트에서 가장 중요한 사실 중 하나다.  
즉, `published=false`는 "사이트 렌더링 필터"일 뿐이고, "비공개 보안" 수단이 아니다.

### 따라서 필요한 운영 원칙

Craft를 CMS로 쓸 때는 아래 원칙이 필요하다.

1. 공개용 글과 초안 글을 같은 API connection에 두지 않는다.
2. 최소 권한 원칙으로 `Read only` connection만 사용한다.
3. 공개 가능한 문서만 별도 Craft 문서/컬렉션으로 분리하는 편이 안전하다.
4. `published`는 렌더링 필터로만 쓰고, 비공개 제어는 문서 분리로 해결한다.

---

## 3.2 GitHub 기반 무료 블로그 운영이 가능한가

### 가능 여부

가능하다. GitHub Pages는 무료로 정적 사이트를 호스팅할 수 있고, public repository에서도 사용할 수 있다. 또한 HTTPS와 custom domain도 지원한다.

### 장점

- 무료
- GitHub 저장소와 배포 흐름이 단순함
- custom domain 연결 가능
- HTTPS 강제 가능
- 정적 HTML 기반이라 기본 SEO 토대가 좋음

### 핵심 제약

GitHub Pages는 정적 호스팅이다. 즉, 서버가 상시 실행되는 구조가 아니므로 아래 기능은 직접 제공하지 않는다.

- 실시간 SSR
- Next.js ISR
- 요청 시점의 동적 재생성
- 서버 기반 webhook 처리

Next.js 공식 문서도 static export에서 ISR, 기본 image optimization, redirects/rewrites 등 서버가 필요한 기능은 지원되지 않는다고 명시한다.

### 의미하는 바

Craft에 새 글을 올려도 GitHub Pages 사이트는 자동으로 내용이 바뀌지 않는다.  
반드시 다시 빌드해서 정적 파일을 새로 배포해야 한다.

즉, 사용자가 원하는 "Craft에 작성하면 블로그 업데이트"는 아래처럼 해석해야 현실적이다.

- "글을 쓰면 즉시 웹서버가 새 데이터를 읽는다"는 방식은 GitHub Pages와 맞지 않는다.
- 대신 "글이 바뀌면 GitHub Actions가 다시 빌드해서 몇 분 내 반영된다"는 방식은 충분히 가능하다.

### 업데이트 자동화 방식 비교

#### 방식 A. `schedule` 기반 주기 빌드

- GitHub Actions가 5분~15분 간격으로 Craft API를 조회
- 변경이 있으면 빌드 후 Pages 재배포
- 장점: 구현이 가장 단순함
- 단점: 완전 실시간은 아님

참고로 GitHub 공식 문서상 scheduled workflow의 최소 간격은 5분이다.

#### 방식 B. `repository_dispatch` 기반 외부 트리거

- 외부 스크립트/자동화가 GitHub API로 `repository_dispatch`를 호출
- GitHub Actions가 즉시 빌드
- 장점: 더 빠른 반영 가능
- 단점: Craft 쪽 변경을 감지해서 GitHub로 신호를 보낼 별도 자동화가 필요함

#### 방식 C. 서버리스/별도 호스팅 사용

- 예: Vercel, Cloudflare Pages
- on-demand revalidation 또는 webhook 기반 갱신 구성 가능
- 장점: 가장 자연스러운 CMS 경험
- 단점: 이번 요구사항인 "GitHub 기반 무료 운영"과는 우선순위가 다름

### GitHub Pages 기준 최종 판단

요구사항 2번을 우선하면 GitHub Pages는 충분히 가능하다.  
다만 운영 기대치는 아래처럼 맞추는 편이 정확하다.

- 목표: "Craft 편집 후 자동 재배포"
- 현실적 수준: "5~15분 내 자동 반영" 또는 "외부 트리거 연결 시 준실시간 반영"

---

## 3.3 Notion 블로그 템플릿 수정 vs 별도 블로그 제작

### 먼저 전제

현재 요구사항의 CMS는 Notion이 아니라 Craft다.  
따라서 "Notion 블로그 템플릿을 가져다 쓰는 것"은 사실상 "UI/라우팅/포스트 화면 구조를 재활용할지"의 문제이지, 데이터 계층까지 그대로 가져다 쓰는 문제는 아니다.

### Notion 템플릿 재활용의 장점

- 이미 검증된 블로그 UI를 빠르게 확보할 수 있다.
- 포스트 목록, 태그, 아카이브, 상세 페이지, 검색 화면 구조가 갖춰져 있을 가능성이 높다.
- 메타태그, RSS, sitemap, 포스트 라우팅 같은 SEO 보일러플레이트가 이미 있을 수 있다.

### Notion 템플릿 재활용의 단점

- Notion API는 page properties, block children, rich text 등 Notion 고유 모델에 강하게 묶여 있다.
- 많은 템플릿이 block renderer, notion-specific schema, slug 처리, preview image 처리, webhook 또는 polling 구조를 전제로 한다.
- CMS를 Craft로 바꾸는 순간, 핵심 데이터 계층을 거의 다 다시 작성해야 할 가능성이 크다.
- 결국 템플릿을 "수정"하는 수준이 아니라 "거의 재구성"하는 일이 되기 쉽다.

### 별도 블로그 제작의 장점

- Craft 데이터 모델 기준으로 처음부터 단순하게 설계할 수 있다.
- static export, GitHub Pages, custom domain, canonical, sitemap 같은 요구사항을 처음부터 맞춤 설계할 수 있다.
- 불필요한 Notion 의존 코드와 블록 파서를 제거할 수 있어 유지보수가 쉬워진다.
- 번들 크기, 데이터 fetch 비용, 디버깅 포인트를 줄일 수 있다.

### 별도 블로그 제작의 단점

- 초기에 목록/상세/태그/검색/아카이브 화면을 새로 만들어야 한다.
- 디자인과 컴포넌트 기반이 없다면 구현 시간이 조금 더 든다.

### 최종 판단

**"Notion 블로그 템플릿을 그대로 수정"하는 방식은 비추천이다.**

대신 아래 전략이 가장 균형이 좋다.

1. 블로그는 Craft 전용 구조로 별도 만든다.
2. 단, Notion 블로그 템플릿에서 아래 요소는 선별적으로 가져온다.
   - 포스트 카드 UI
   - 목록/상세 라우팅 구조
   - 태그/아카이브 페이지 설계
   - SEO 메타데이터 패턴
   - RSS/sitemap 구현 방식

즉, **정답은 "템플릿 포크"가 아니라 "패턴 차용 + Craft 전용 재구성"**이다.

---

## 3.4 Craft를 CMS로 쓰면서 SEO를 강하게 가져갈 수 있는가

### 결론

가능하다.  
SEO가 약해지는 이유는 "Craft를 쓴다"는 사실 자체가 아니라, "어떻게 렌더링하고 배포하느냐"에 달려 있다.

Craft를 실시간 클라이언트 렌더링 방식으로 붙이면 SEO가 약해질 수 있지만, Next.js static export로 HTML을 미리 생성해서 GitHub Pages에 배포하면 SEO 토대는 충분히 강해진다.

### 반드시 가져가야 할 SEO 전략

#### 1. 모든 포스트를 정적 HTML로 prerender

- 포스트 상세, 태그, 아카이브, 메인 페이지를 빌드 시점에 HTML로 생성한다.
- 크롤러가 JS 실행 없이 핵심 콘텐츠를 읽을 수 있어야 한다.

#### 2. 포스트별 고유 URL과 안정적인 slug

- slug는 title 기반 자동 생성만 믿지 말고, 명시 필드로 두는 편이 안전하다.
- 한번 발행한 slug는 가급적 바꾸지 않는다.

#### 3. 강한 메타데이터

포스트마다 아래 필드를 준비하는 것이 좋다.

- `seoTitle`
- `seoDescription`
- `publishedAt`
- `updatedAt`
- `tags`
- `heroImage`
- `canonicalUrl` 또는 site URL 기반 canonical 생성

Next.js의 metadata 기능으로 title, description, Open Graph, Twitter Card, canonical을 페이지별로 생성한다.

#### 4. `sitemap.xml`과 `robots.txt`

Next.js는 `sitemap.ts`와 `robots.ts` 규약으로 sitemap과 robots 파일을 생성할 수 있다.  
이 기능은 정적 export와도 잘 맞는다.

#### 5. JSON-LD 구조화 데이터

블로그 포스트에는 `BlogPosting` 또는 `Article` JSON-LD를 넣는 것이 좋다.

권장 포함 항목:

- headline
- description
- image
- author
- datePublished
- dateModified
- mainEntityOfPage

Next.js 공식 가이드도 JSON-LD를 `<script type="application/ld+json">`로 렌더링하는 방식을 권장한다.

#### 6. 커스텀 도메인 + HTTPS

`username.github.io`보다 별도 커스텀 도메인이 브랜딩과 canonical 관리 측면에서 더 좋다.  
GitHub Pages는 custom domain과 HTTPS 강제를 지원한다.

#### 7. 이미지 전략

GitHub Pages + static export에서는 Next.js 기본 이미지 최적화 서버를 쓸 수 없다.  
따라서 아래 둘 중 하나가 필요하다.

- 일반 `img` 사용
- `next/image`를 쓰되 custom loader 구성

썸네일과 OG 이미지는 절대 URL 기준으로 관리하는 편이 안전하다.

#### 8. 얇은 JS, 빠른 HTML

- 검색은 가능하면 정적 인덱스 기반의 가벼운 클라이언트 검색으로 유지
- 초기 JS 번들 최소화
- 글 본문은 서버가 아닌 빌드 시 렌더링

#### 9. Search Console 운영

- Google Search Console 등록
- sitemap 제출
- canonical/색인 상태 확인
- 구조화 데이터 검증

### SEO에서 오히려 주의할 점

- 초안 URL이 외부에 노출되지 않게 콘텐츠 분리를 확실히 해야 한다.
- 태그 페이지가 너무 많아 얇은 페이지가 대량 생성되면 품질이 떨어질 수 있다.
- 같은 글이 여러 URL로 열리지 않도록 canonical과 slug 정책을 고정해야 한다.
- `robots.txt`는 비공개 보호 수단이 아니다.

---

## 4. 추천 아키텍처

## 4.1 전체 구조

```text
Craft
  -> API Connection (Read only, 공개 문서만 연결)
  -> GitHub Actions
      -> Craft API fetch
      -> normalize to Post model
      -> Next.js build (output: export)
      -> GitHub Pages deploy
  -> 사용자
```

## 4.2 데이터 모델 권장안

최소 필드:

- `title`
- `slug`
- `excerpt`
- `content`
- `tags`
- `published`
- `publishedAt`
- `updatedAt`

SEO 필드:

- `seoTitle`
- `seoDescription`
- `heroImage`
- `canonicalUrl`

운영 편의 필드:

- `series`
- `featured`
- `draftNote` 또는 내부 메모용 필드

주의: 내부 메모용 필드는 공개 문서와 분리하는 편이 더 안전하다.

---

## 5. 구현 방향 권장안

## 5.1 1차 구현 권장

가장 현실적인 1차 버전은 아래다.

1. Craft에 공개용 블로그 컬렉션 문서를 만든다.
2. `published=true` 글만 렌더링하되, 초안은 아예 다른 문서/connection으로 분리한다.
3. GitHub Actions가 10분 간격으로 Craft API를 확인해 Pages를 다시 빌드한다.
4. Next.js static export로 정적 HTML을 생성한다.
5. 메인, 포스트 상세, 태그, 아카이브, 검색, sitemap, robots, RSS를 붙인다.
6. custom domain과 HTTPS를 붙인다.

이 방식은 구현 난도, 비용, 운영 안정성의 균형이 가장 좋다.

## 5.2 2차 개선 권장

운영하면서 더 빠른 반영이 필요하면 아래를 검토한다.

- 외부 자동화로 `repository_dispatch` 트리거
- 검색 인덱스 정교화
- OG 이미지 자동 생성
- 커버 이미지 CDN 또는 이미지 최적화 서비스 연결

## 5.3 비추천 방향

- Notion 전용 템플릿을 그대로 포크해서 Craft 소스로 억지 변환
- `published=false`만 믿고 초안을 공개 connection에 두는 방식
- GitHub Pages인데 ISR/SSR 전제를 가진 구조 채택
- 클라이언트 fetch 중심으로 본문을 렌더링하는 구조

---

## 6. 최종 권장 결정

### 추천 결정

**별도 Craft 전용 블로그를 만든다.**

다만 완전히 백지에서 시작하기보다는, 기존 Notion 블로그 템플릿에서 UI와 정보 구조만 차용하는 방식이 가장 좋다.

### 이유

- CMS가 Craft로 바뀌면 데이터 계층을 어차피 다시 설계해야 한다.
- GitHub Pages의 정적 호스팅 제약까지 고려하면, 처음부터 static export 기준으로 설계하는 편이 깔끔하다.
- SEO를 강하게 가져가려면 템플릿의 "Notion 호환성"보다 "정적 HTML + 메타데이터 품질"이 더 중요하다.
- Craft 공식 사례도 블로그 CMS 활용 가능성을 보여주지만, unpublished 노출 위험 때문에 공개 범위 설계를 직접 통제해야 한다.

### 프로젝트 방향 한 줄 요약

**Craft는 콘텐츠 원본, Next.js는 정적 블로그 생성기, GitHub Pages는 무료 배포층으로 사용한다.**

---

## 7. 실행 체크리스트

구현 전에 확정할 항목:

- 공개용 Craft 문서 구조
- 초안 분리 방식
- slug 정책
- 태그 정책
- 대표 이미지 정책
- custom domain 사용 여부
- GitHub Actions 반영 주기

구현 시 필수 항목:

- Craft API adapter
- Post 타입 정의
- static export 설정
- sitemap / robots / RSS
- metadata / canonical / JSON-LD
- Pages 배포 워크플로

운영 시 필수 항목:

- Search Console 등록
- sitemap 제출
- 초안 노출 점검
- 빌드 실패 알림 확인

---

## 8. 조사 근거 링크

### Craft

- Craft API 안내: <https://support.craft.do/en/integrate/api>
- Craft Imagine 메인: <https://www.craft.do/imagine>
- Craft 공식 Personal Blog 사례: <https://www.craft.do/imagine/personal-blog>

### GitHub Pages / GitHub Actions

- GitHub Pages HTTPS: <https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https>
- GitHub Actions workflow events: <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows>

### Next.js

- Static export: <https://nextjs.org/docs/app/guides/static-exports>
- `sitemap.xml`: <https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap>
- `robots.txt`: <https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots>
- JSON-LD 가이드: <https://nextjs.org/docs/app/guides/json-ld>

### Google Search Central

- Article structured data: <https://developers.google.com/search/docs/appearance/structured-data/article>
- Canonical URL 관리: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Sitemap 가이드: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- Robots 소개: <https://developers.google.com/search/docs/crawling-indexing/robots/intro>

### Notion

- Page properties: <https://developers.notion.com/reference/page-property-values>
- Webhooks: <https://developers.notion.com/reference/webhooks>

---

## 9. 최종 메모

이번 조사 기준으로는 아래 판단이 가장 적절하다.

- Craft CMS 사용: 가능
- GitHub 무료 블로그 운영: 가능
- Craft 작성 후 자동 반영: 가능, 단 재빌드 방식으로 접근해야 함
- Notion 템플릿 포크: 비추천
- Craft 전용 블로그 + 일부 UI 차용: 추천
- SEO 강화: 충분히 가능

다음 단계에서는 이 조사 결과를 기준으로 실제 구현용 설계 문서와 작업 계획을 세분화하면 된다.
