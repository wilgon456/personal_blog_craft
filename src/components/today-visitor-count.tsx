/* eslint-disable @next/next/no-img-element */

const HITS_BADGE_URL =
  "https://hitscounter.dev/api/hit?url=https%3A%2F%2Ftuchizblog.today&label=visitors&icon=heart-fill&color=%23198754"

export function TodayVisitorCount() {
  return (
    <div className="home-today-card">
      <img
        alt="Visitor counter badge"
        className="home-today-card__badge"
        src={HITS_BADGE_URL}
      />
      <p className="home-today-card__caption">badge shows today / total</p>
    </div>
  )
}
