export type VisitorApiMode = "read" | "track"
export type VisitorApiScope = "site" | "path"

export type VisitorApiResponse = {
  counted: boolean
  count: number
  dateKey: string
  scope: VisitorApiScope
}

export const visitorCountEventName = "tuchiz:visitor-count-updated"

// countapi.xyz — 무료, 계정 가입 없이 사용 가능한 방문자 카운터 API
const COUNTAPI_NAMESPACE = "tuchizblog"
const COUNTAPI_KEY = "site-visits"
const COUNTAPI_BASE = "https://api.countapi.xyz"

/**
 * countapi.xyz 엔드포인트 URL을 반환합니다.
 * - mode "track": 카운트를 1 증가시키고 현재 값을 반환 (hit)
 * - mode "read":  카운트를 변경 없이 현재 값만 반환 (get)
 */
export function getCountapiUrl(mode: VisitorApiMode): string {
  const action = mode === "track" ? "hit" : "get"
  return `${COUNTAPI_BASE}/${action}/${COUNTAPI_NAMESPACE}/${COUNTAPI_KEY}`
}

export function getDateKey(): string {
  return new Date().toISOString().split("T")[0]
}

// ── 하위 호환성을 위해 기존 심볼들을 유지합니다 ──────────────────────────
/** @deprecated getCountapiUrl() 을 사용하세요 */
export const visitorApiEndpoint = ""

/** @deprecated getCountapiUrl() 을 사용하세요 */
export function buildVisitorApiUrl(
  _endpoint: string,
  _origin: string,
  { mode, scope = "site" }: { mode: VisitorApiMode; path?: string; scope?: VisitorApiScope },
): string {
  return getCountapiUrl(mode)
}
