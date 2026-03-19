# Craft CMS 기반 개인 블로그 개발 계획서

기준 문서: `guide/research.md`  
작성일: 2026-03-19  
대상 프로젝트: `personal_blog_craft`

---

## 1. 프로젝트 개요

본 프로젝트는 Craft를 CMS로 사용하고, GitHub Pages를 무료 배포 환경으로 사용하는 개인 블로그를 구축하는 것을 목표로 한다.

핵심 방향은 아래와 같다.

- 콘텐츠 작성과 관리는 Craft에서 수행
- 웹사이트는 Next.js로 구현
- 배포는 GitHub Pages 사용
- 사이트 반영은 GitHub Actions 재빌드 방식으로 자동화
- SEO는 정적 HTML 생성과 메타데이터 설계로 강화

---

## 2. 최종 개발 목표

### 필수 목표

- Craft에 작성한 공개 글이 블로그에 자동 반영된다.
- GitHub Pages에서 무료로 운영 가능한 구조를 만든다.
- Notion 전용 데이터 의존 없이 Craft 전용 데이터 레이어를 구축한다.
- 포스트 목록, 상세, 태그, 아카이브, 검색을 지원한다.
- SEO 필수 요소를 갖춘다.

### 운영 목표

- 초안과 공개 글의 노출 범위를 분리한다.
- GitHub Actions 기반 자동 배포를 구성한다.
- 이후 커스텀 도메인과 Search Console 연동이 가능하도록 설계한다.

---

## 3. 핵심 의사결정

### 1. CMS

- Notion이 아니라 Craft를 단일 CMS로 사용한다.
- Craft API Connection은 `Read only`로 구성한다.
- 공개 가능한 문서만 API connection에 연결한다.

### 2. 배포 플랫폼

- 1차 배포는 GitHub Pages를 기준으로 설계한다.
- Next.js는 `output: 'export'` 기반의 정적 export 구조로 맞춘다.

### 3. 자동 반영 방식

- 1차 구현은 GitHub Actions `schedule` 기반 자동 재빌드로 진행한다.
- 목표 반영 주기는 10분 내외로 설정한다.
- 추후 필요 시 `repository_dispatch` 방식으로 고도화한다.

### 4. 템플릿 전략

- Notion 블로그 템플릿을 그대로 수정하지 않는다.
- 필요 시 UI 패턴과 화면 구조만 참고한다.
- 데이터 모델, fetch 로직, adapter 계층은 Craft 기준으로 새로 설계한다.

### 5. SEO 전략

- 모든 공개 페이지는 정적 HTML로 생성한다.
- `metadata`, `canonical`, `sitemap`, `robots`, `JSON-LD`를 포함한다.
- slug는 안정적으로 유지 가능한 명시 필드로 관리한다.
- slug는 영문 직접 입력을 기본으로 하고, 누락 시 제목 기반 영문 slug를 자동 생성한다.

---

## 4. 아키텍처 개요

```text
Craft
  -> API Connection (공개 문서만, Read only)
  -> Next.js build
      -> Craft API fetch
      -> adapter normalize
      -> static pages generate
  -> GitHub Actions
      -> build
      -> GitHub Pages deploy
  -> User
```

---

## 5. 데이터 설계 계획

## 5.1 Post 모델 정의

블로그의 공통 콘텐츠 모델은 아래 기준으로 설계한다.

- `title`
- `slug`
- `excerpt`
- `content`
- `tags`
- `published`
- `publishedAt`
- `updatedAt`
- `seoTitle`
- `seoDescription`
- `heroImage`

## 5.2 Craft 문서 구조 계획

Craft 쪽에는 공개용 블로그 컬렉션을 별도로 둔다.

- 공개용 컬렉션
- 초안용 문서 또는 별도 컬렉션
- 태그는 한글/영문 혼용 허용
- 필요 시 대표 이미지, 요약 필드 추가

중요 원칙:

- `published`는 화면 노출 필터로만 사용
- 초안 비공개는 API connection 분리로 해결

## 5.3 Adapter 레이어 계획

Craft API 응답을 바로 UI에 연결하지 않고 adapter 계층을 둔다.

이 레이어의 책임:

- Craft 응답 구조 해석
- 블록/마크다운 본문 정규화
- 누락 필드 기본값 처리
- slug 검증 및 영문 정규화
- slug 누락 시 제목 기반 fallback 생성
- 태그 표시명 유지 및 URL용 태그 값 정규화
- 공개 여부 필터링
- `Post` 모델로 변환

---

## 6. 기능 개발 단계

## Phase 1. 프로젝트 기반 구성

목표:

- Next.js 블로그 기본 구조 준비
- GitHub Pages 배포 가능한 정적 export 기반 확보

작업 항목:

- Next.js 프로젝트 구조 확정
- `output: 'export'` 설정
- 라우팅 구조 설계
- 공통 레이아웃 및 기본 스타일 기반 준비
- GitHub Pages 배포 전략 확정

완료 기준:

- 정적 export가 가능한 빈 블로그 골격이 준비됨

## Phase 2. Craft 연동 기반 구축

목표:

- Craft API에서 블로그 데이터를 읽어올 수 있게 한다.

작업 항목:

- 환경변수 정의
- Craft API client 작성
- 문서/컬렉션 fetch 로직 구현
- adapter 레이어 작성
- `Post` 타입 정의

완료 기준:

- 로컬에서 Craft 데이터를 읽어 정규화된 포스트 목록 생성 가능

## Phase 3. 블로그 핵심 화면 구현

목표:

- 정규화된 `Post` 데이터를 실제 페이지에 연결한다.

작업 항목:

- 메인 페이지
- 포스트 상세 페이지
- 태그 페이지
- 아카이브 페이지
- 검색 기능
- 이전글/다음글 탐색

완료 기준:

- 공개 포스트 기준으로 주요 화면이 정상 렌더링됨

## Phase 4. SEO 강화

목표:

- 검색엔진 친화적인 정적 블로그 구조를 완성한다.

작업 항목:

- 페이지별 metadata 설계
- canonical URL 생성
- Open Graph / Twitter Card 설정
- `sitemap.xml` 생성
- `robots.txt` 생성
- 포스트별 JSON-LD 삽입
- RSS 지원 여부 검토 및 가능 시 추가

완료 기준:

- 주요 SEO 자산이 정적으로 생성됨

## Phase 5. 자동 배포 및 운영 자동화

목표:

- Craft 변경 사항이 주기적으로 블로그에 반영되도록 한다.

작업 항목:

- GitHub Actions workflow 작성
- build + deploy 파이프라인 구성
- `schedule` 트리거 설정
- 실패 시 로그 확인 가능한 구조 정리
- 추후 `repository_dispatch` 확장 가능성 고려

완료 기준:

- GitHub Pages에 자동 배포가 동작함
- 일정 주기마다 Craft 변경 내용이 반영됨

## Phase 6. 운영 문서화

목표:

- 혼자 운영해도 헷갈리지 않도록 가이드를 정리한다.

작업 항목:

- README 업데이트
- Craft 문서 작성 규칙 정리
- 필드 정의 문서화
- 배포/환경변수/트러블슈팅 정리

완료 기준:

- 프로젝트 설치, 운영, 배포 절차를 문서만 보고 재현 가능

---

## 7. 페이지 구성 계획

필수 페이지:

- 홈
- 블로그 목록
- 포스트 상세
- 태그별 목록
- 아카이브
- 검색 결과
- 404

선택 페이지:

- About
- Projects
- RSS
- sitemap / robots 출력 경로

---

## 8. SEO 구현 체크리스트

필수 항목:

- 고정 slug
- 영문 slug 정책 적용
- 고유 `title` / `description`
- canonical URL
- Open Graph 메타
- Twitter Card 메타
- `sitemap.xml`
- `robots.txt`
- JSON-LD (`Article` 또는 `BlogPosting`)
- 커스텀 도메인 대응 가능 구조

권장 항목:

- 대표 이미지 필수화
- `updatedAt` 반영
- 태그 페이지 index 정책 검토
- Search Console 제출 준비

---

## 9. 환경변수 계획

필수:

- `CRAFT_API_URL`

상황에 따라 추가 가능:

- `SITE_URL`
- `CRAFT_API_TOKEN` 또는 인증 관련 값
- `BLOG_AUTHOR_NAME`
- `BLOG_AUTHOR_URL`

주의:

- 실제 Craft 연결 방식에 따라 인증 키 이름은 조정될 수 있다.
- 민감한 값은 GitHub Actions secret으로 관리한다.

---

## 10. 리스크와 대응 계획

### 1. 초안 노출 리스크

리스크:

- `published=false` 글이 API connection에 포함되면 외부 접근 가능성이 있다.

대응:

- 공개 문서와 초안 문서를 분리한다.
- 공개용 API connection만 사이트 빌드에 사용한다.

### 2. GitHub Pages 동적 기능 제약

리스크:

- ISR, 서버 기반 이미지 최적화, 실시간 webhook 처리 불가

대응:

- 정적 export 구조로 고정한다.
- 자동 반영은 재빌드 방식으로 설계한다.

### 3. Craft 응답 구조 변경 가능성

리스크:

- API 응답 구조가 예상과 다를 수 있다.

대응:

- adapter 레이어로 UI와 API를 분리한다.
- 응답 파싱 로직을 한 곳에 집중한다.

### 4. 이미지 처리 복잡도

리스크:

- 외부 이미지 URL, 대표 이미지, OG 이미지 처리가 일관되지 않을 수 있다.

대응:

- 초기 버전은 단순한 외부 URL 기반으로 통일한다.
- 필요 시 이후 custom loader 또는 CDN 전략을 도입한다.

---

## 11. 완료 기준

아래 조건을 만족하면 1차 개발 완료로 본다.

- Craft 공개 문서의 포스트가 블로그에 렌더링된다.
- 초안은 사이트에 노출되지 않는다.
- 포스트 목록, 상세, 태그, 아카이브, 검색이 동작한다.
- GitHub Pages에 정적 배포가 가능하다.
- GitHub Actions 자동 배포가 동작한다.
- 주요 SEO 요소가 포함된다.

---

## 12. 우선 구현 순서

1. 프로젝트 골격과 정적 export 설정
2. Craft API client와 adapter 구현
3. Post 모델 및 fetch 흐름 확정
4. 목록/상세/태그/아카이브 구현
5. 검색 기능 구현
6. SEO 자산 추가
7. GitHub Actions 배포 자동화
8. README 및 운영 문서 정리

---

## 13. Codex 작업 지시 요약

1. Craft 전용 블로그 구조를 기준으로 프로젝트를 구성한다.
2. Notion 전용 데이터 모델이나 블록 렌더링 의존을 제거한다.
3. Craft API adapter 레이어를 분리한다.
4. GitHub Pages 정적 배포 기준으로 기능을 구현한다.
5. SEO 필수 요소를 초기 버전부터 포함한다.
6. 자동 반영은 GitHub Actions 재빌드 방식으로 구성한다.
