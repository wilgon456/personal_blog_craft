# 사용자 직접 준비 항목 정리

기준 문서: `guide/plan.md`  
목적: 개발 진행 전, Codex가 대신 만들 수 없고 사용자가 직접 준비해야 하는 항목을 미리 정리한다.

---

## 1. 가장 먼저 직접 해야 하는 것

아래 항목은 내가 대신 생성할 수 없으니, 사용자가 먼저 준비해두면 개발이 바로 가능하다.

### 1. Craft 공개용 블로그 문서/컬렉션 만들기

필요 이유:

- 블로그 원본 데이터가 어디에 있는지 정해야 내가 연동 코드를 만들 수 있다.

직접 해야 할 일:

- Craft 안에 공개용 블로그 컬렉션 문서를 만든다.
- 블로그에 공개할 글만 이 문서에 둔다.
- 초안은 가능하면 별도 문서나 별도 컬렉션으로 분리한다.

권장 필드:

- `title`
- `slug`
- `excerpt`
- `tags`
- `published`
- `publishedAt`
- `updatedAt`
- `seoTitle`
- `seoDescription`
- `heroImage`

최소 필드:

- `title`
- `slug`
- `published`
- `publishedAt`

### 2. Craft API Connection 생성

필요 이유:

- 내가 Craft 데이터를 읽으려면 API endpoint 또는 연결 정보가 필요하다.

직접 해야 할 일:

- Craft에서 공개용 문서만 포함한 API Connection을 만든다.
- 권한은 가능하면 `Read only`로 설정한다.
- 연결 URL, 인증 방식, 필요 시 토큰 값을 확보한다.

중요:

- 초안 글이 포함된 문서를 같은 connection에 넣지 않는 것을 권장한다.
- `published=false`만으로 비공개가 보장되지 않는다고 보고 운영하는 편이 안전하다.

### 3. `.env` 또는 `.env.local`에 Craft 연결 정보 넣기

필요 이유:

- 내가 바로 fetch 코드와 adapter를 작성할 수 있다.

우선 넣어두면 좋은 값:

```env
CRAFT_API_URL=
CRAFT_API_TOKEN=
SITE_URL=
BLOG_AUTHOR_NAME=
BLOG_AUTHOR_URL=
```

설명:

- `CRAFT_API_URL`: Craft API endpoint
- `CRAFT_API_TOKEN`: 인증이 필요할 경우 사용하는 값
- `SITE_URL`: 최종 사이트 주소. 없으면 우선 예정 도메인 또는 `https://username.github.io` 형태로 가정 가능
- `BLOG_AUTHOR_NAME`: 작성자 이름
- `BLOG_AUTHOR_URL`: 작성자 소개 페이지 또는 프로필 URL

주의:

- 실제 Craft 연결 구조에 따라 토큰 키 이름은 달라질 수 있다.
- 값이 아직 불확실하면 일단 빈 값으로 두고 URL부터 넣어도 된다.

---

## 2. 배포 전에 직접 해야 하는 것

### 4. GitHub 저장소 준비

필요 이유:

- GitHub Pages와 GitHub Actions 배포를 연결하려면 저장소가 필요하다.

직접 해야 할 일:

- GitHub repository를 만든다.
- 이 프로젝트를 그 저장소와 연결할 준비를 한다.

있으면 좋은 정보:

- 저장소 주소
- 사용할 기본 브랜치 이름

### 5. GitHub Pages 사용 여부 확정

필요 이유:

- 내가 배포 workflow를 GitHub Pages 기준으로 맞추려면 대상이 명확해야 한다.

직접 해야 할 일:

- GitHub Pages로 운영할 저장소를 확정한다.
- 가능하면 public repository 여부도 같이 확정한다.

### 6. GitHub Secrets 등록

필요 이유:

- API 토큰처럼 민감한 값은 workflow에서 secret으로 읽는 편이 안전하다.

직접 해야 할 일:

- 저장소 `Settings -> Secrets and variables -> Actions`에서 필요한 secret을 등록한다.

후보 secret:

- `CRAFT_API_URL`
- `CRAFT_API_TOKEN`
- 기타 실제 인증에 필요한 값

참고:

- 로컬 `.env.local`과 GitHub Actions secret은 둘 다 필요할 수 있다.

---

## 3. SEO와 도메인 관련해서 직접 해야 하는 것

### 7. 최종 사이트 주소 결정

필요 이유:

- canonical, sitemap, Open Graph URL, robots 설정에 필요하다.

직접 해야 할 일:

- 아래 둘 중 하나를 결정한다.
  - GitHub 기본 주소 사용: `https://username.github.io/...`
  - 커스텀 도메인 사용

이 값은 `.env`의 `SITE_URL`에 넣어두면 좋다.

### 8. 커스텀 도메인 준비

필요 이유:

- 커스텀 도메인을 쓰면 SEO와 브랜딩 측면에서 더 좋다.

직접 해야 할 일:

- 도메인을 구매하거나 이미 가진 도메인을 정한다.
- 나중에 GitHub Pages와 연결할 수 있게 DNS 수정 권한을 확보한다.

### 9. Search Console 등록 준비

필요 이유:

- 배포 후 색인 상태와 sitemap 제출을 확인하려면 필요하다.

직접 해야 할 일:

- Google Search Console에 사용할 Google 계정을 정한다.
- 도메인 속성 또는 URL prefix 속성 중 어떤 방식으로 등록할지 결정한다.

이 단계는 개발 전에 꼭 완료할 필요는 없지만, 배포 직후 바로 진행할 수 있게 준비해두면 좋다.

---

## 4. 콘텐츠 운영 측면에서 직접 정해야 하는 것

### 10. slug 운영 규칙 확정

필요 이유:

- URL 구조가 한번 정해지면 바꾸기 어렵다.

직접 결정할 것:

- slug를 직접 입력할지
- 제목 기반 자동 생성할지
- 한글 slug 허용 여부

권장:

- 직접 입력 또는 영문 slug 고정

### 11. 태그 운영 규칙 확정

필요 이유:

- 태그 페이지 구조와 URL 설계에 영향이 있다.

직접 결정할 것:

- 태그를 영문만 쓸지
- 한글 태그도 허용할지
- 대소문자 구분을 할지

권장:

- 태그 노출명은 자유롭게 쓰더라도 URL용 값은 정규화하는 방향

### 12. 대표 이미지 정책 정하기

필요 이유:

- SEO와 SNS 공유 카드 품질에 직접 영향이 있다.

직접 결정할 것:

- 모든 글에 `heroImage`를 필수로 할지
- 없으면 기본 OG 이미지를 쓸지
- 이미지를 어디에 저장할지

권장:

- 초기에는 외부 이미지 URL 또는 고정 이미지 URL 정책으로 단순하게 시작

---

## 5. 내가 바로 작업하려면 최소한 필요한 준비물

아래 3가지만 있으면 실제 개발에 바로 들어갈 수 있다.

1. Craft 공개용 API endpoint
2. 인증이 필요하면 토큰 또는 연결 방식 정보
3. `.env.local`에 들어간 실제 값

최소 예시:

```env
CRAFT_API_URL=https://...
CRAFT_API_TOKEN=...
SITE_URL=https://your-site-url.example
```

---

## 6. 준비 완료 후 나에게 알려주면 좋은 내용

작업 재개할 때 아래 정보만 주면 된다.

- Craft API URL 준비 완료
- 토큰 준비 완료 여부
- `.env.local` 작성 완료 여부
- 공개용 Craft 문서 구조 확정 여부
- 최종 사이트 주소 또는 임시 주소

예시:

```text
Craft API URL 넣어뒀고 .env.local 작성했어.
공개용 컬렉션 필드는 title, slug, excerpt, tags, published, publishedAt 이야.
SITE_URL은 일단 https://username.github.io 로 넣어뒀어.
```

---

## 7. 체크리스트

- [ ] Craft 공개용 블로그 문서/컬렉션 생성
- [ ] 초안 문서 분리
- [ ] Craft API Connection 생성
- [ ] API URL 확보
- [ ] API 토큰 또는 인증 방식 확인
- [ ] `.env.local` 작성
- [ ] GitHub 저장소 준비
- [ ] GitHub Pages 사용 저장소 확정
- [ ] GitHub Actions Secrets 등록
- [ ] `SITE_URL` 확정
- [ ] slug 정책 확정
- [ ] 태그 정책 확정
- [ ] 대표 이미지 정책 확정

---

## 8. 한 줄 정리

개발을 바로 시작하려면, 사용자는 먼저 **Craft 공개용 API 연결 정보와 `.env.local` 값**을 준비해두면 된다.
