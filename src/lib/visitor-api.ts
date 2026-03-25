export type VisitorApiMode = "read" | "track"
export type VisitorApiScope = "site" | "path"

export type VisitorApiResponse = {
  counted: boolean
  count: number
  dateKey: string
  scope: VisitorApiScope
}

export const visitorApiEndpoint =
  process.env.NEXT_PUBLIC_VISITOR_API_URL || "/api/visits/today"

export const visitorCountEventName = "tuchiz:visitor-count-updated"

export function buildVisitorApiUrl(
  endpoint: string,
  origin: string,
  {
    mode,
    path,
    scope = "site",
  }: {
    mode: VisitorApiMode
    path?: string
    scope?: VisitorApiScope
  },
) {
  const url = new URL(endpoint, origin)

  url.searchParams.set("mode", mode)
  url.searchParams.set("scope", scope)

  if (scope === "path" && path) {
    url.searchParams.set("path", path)
  }

  return url.toString()
}
