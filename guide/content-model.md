# Craft 콘텐츠 모델과 작성 규칙

## 컬렉션

현재 블로그는 Craft의 `Posts` 컬렉션을 기준으로 동작한다.

## 필드 정의

- `Title`
  - 포스트 제목
  - Craft 컬렉션의 기본 title 컬럼
- `Slug`
  - 영문 slug
  - URL 식별자
- `Excerpt`
  - 목록/SEO 요약문
- `Tags`
  - 다중 선택 태그
  - 한글/영문 혼용 가능
- `Published`
  - 공개 여부
- `Published At`
  - 발행 날짜
- `Updated At`
  - 수정 날짜
- `SEO Title`
  - 검색 결과용 제목
- `SEO Description`
  - 검색 결과용 설명
- `Hero Image`
  - 대표 이미지 URL

## slug 규칙

- slug는 영문 직접 입력이 기본이다.
- slug가 비어 있으면 제목 기반으로 자동 생성된다.
- 제목이 완전히 비영문이라 slug 생성이 어려우면 내부 fallback 값이 사용될 수 있다.
- 발행 후에는 가능하면 slug를 바꾸지 않는다.

## 태그 규칙

- 태그는 한글과 영문 혼용 가능
- 화면 표시에는 입력한 원문을 그대로 사용
- 라우팅용 값은 내부적으로 정규화

## 발행 규칙

- 블로그에 노출되려면 `Published = true`여야 한다.
- 초안은 가능하면 별도 문서/컬렉션 또는 비공개 범위에 둔다.

## 작성 팁

- `Excerpt`는 1~2문장으로 직접 쓰는 편이 가장 좋다.
- `SEO Title`이 비어 있으면 제목이 사용된다.
- `SEO Description`이 비어 있으면 excerpt 또는 본문 요약이 사용된다.
- `Hero Image`가 있으면 카드와 Open Graph 품질이 좋아진다.
