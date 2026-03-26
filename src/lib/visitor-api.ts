export type VisitorApiMode = "history" | "read" | "track"
export type VisitorApiScope = "site"

export type VisitorCountPayload = {
  count?: number
  counted: boolean
  dateKey?: string
  ok: boolean
  scope: VisitorApiScope
}

export type VisitorHistoryEntry = {
  count: number
  dateKey: string
}

export type VisitorHistoryPayload = {
  days: number
  history: VisitorHistoryEntry[]
  ok: boolean
  scope: VisitorApiScope
  todayCount: number
  totalCount: number
}

export const visitorApiEndpoint = "/api/visits/today"
export const visitorCountEventName = "tuchiz:visitor-count-updated"

export function buildVisitorApiUrl(
  endpoint: string,
  origin: string,
  {
    days,
    mode,
  }: {
    days?: number
    mode: VisitorApiMode
  },
) {
  const url = new URL(endpoint, origin)

  url.searchParams.set("mode", mode)
  url.searchParams.set("scope", "site")

  if (typeof days === "number") {
    url.searchParams.set("days", String(days))
  }

  return url.toString()
}
