/* eslint-disable @next/next/no-img-element */

/**
 * hits.seeyoufarm.com 뱃지 방식으로 방문자 수를 표시합니다.
 *
 * - img 태그 하나로 카운트 증가 + 뱃지 표시가 동시에 처리됩니다.
 * - 외부 API 서버 상태에 무관하게 안정적으로 작동합니다.
 * - 이전에 사용하던 countapi.xyz 서비스는 2023년 서비스 종료로 대체했습니다.
 */
const HITS_BADGE_URL =
  "https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Ftuchizblog.today&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=visitors&edge_flat=false"

export function TodayVisitorCount() {
  return (
    <div className="home-today-card">
      <img
        alt="방문자 수"
        src={HITS_BADGE_URL}
        style={{ height: "auto", maxWidth: "100%" }}
      />
    </div>
  )
}
