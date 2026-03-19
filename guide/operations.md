# 운영 가이드

## 환경변수

로컬 `.env.local`

```env
CRAFT_API_URL=https://connect.craft.do/links/your-link/api/v1
SITE_URL=https://your-site.example
BLOG_AUTHOR_NAME=your-name
BLOG_AUTHOR_URL=https://your-profile.example
```

GitHub Actions Secret

- `CRAFT_API_URL`

현재 공개 connection 기준으로는 별도 `CRAFT_API_TOKEN`이 필요하지 않다.

## 배포

배포 워크플로:

- 파일: `.github/workflows/deploy-pages.yml`
- 트리거:
  - `main` 브랜치 push
  - 수동 실행
  - 15분 주기 schedule

## 배포 순서

1. GitHub Actions가 저장소를 체크아웃한다.
2. `npm ci` 실행
3. `npm run build` 실행
4. `out/` 산출물을 GitHub Pages artifact로 업로드
5. Pages에 배포

## 커스텀 도메인 전환 시 할 일

현재 Pages는 저장소 하위 경로 `/personal_blog_craft` 기준으로 배포된다.

커스텀 도메인으로 전환할 때는 아래를 바꾼다.

1. GitHub Pages에 custom domain 연결
2. workflow의 `SITE_URL`을 실제 도메인으로 수정
3. workflow의 `BASE_PATH`를 빈 값으로 바꾸는 방향 검토
4. canonical과 sitemap 주소 확인

## 트러블슈팅

### 1. 홈 화면은 뜨는데 새 글이 안 보임

확인할 것:

- `Published`가 true인지
- `Published At` 값이 들어있는지
- GitHub Actions 최근 배포가 성공했는지

### 2. GitHub Pages에서 404가 난다

확인할 것:

- Pages 설정이 `workflow` 모드인지
- 최근 Actions run이 성공했는지
- `BASE_PATH`가 현재 Pages URL 구조와 맞는지

### 3. 상세 페이지가 비어 보인다

확인할 것:

- Craft 컬렉션 아이템 안에 실제 본문 블록이 있는지
- 블록이 `content`로 내려오는지

### 4. 태그 페이지가 예상과 다르게 보인다

확인할 것:

- Craft 태그 값에 불필요한 공백이 없는지
- 같은 의미의 태그가 서로 다른 표기로 섞여 있지 않은지

### 5. SEO 메타가 기대와 다르다

확인할 것:

- `SEO Title`, `SEO Description` 입력 여부
- `SITE_URL` 설정값
- 배포 후 페이지 소스에서 canonical/open graph 확인

## 점검 명령어

```bash
npm run lint
npm run typecheck
npm run build
```
