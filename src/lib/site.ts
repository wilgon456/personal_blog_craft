const fallbackSiteUrl = "https://tuchizblog.today"

export const siteUrl = process.env.SITE_URL || fallbackSiteUrl
export const basePath = process.env.BASE_PATH || ""
export const siteAuthorName = process.env.BLOG_AUTHOR_NAME || "tuchi"
export const siteAuthorUrl = process.env.BLOG_AUTHOR_URL || ""
export const siteName = "TUCHIZ-LOG"
export const siteDescription =
  "A personal blog generated from Craft content and served as a static site."
export const siteKeywords = [
  "Craft CMS",
  "Next.js blog",
  "static blog",
  "personal blog",
  "developer notes",
]

export function absoluteUrl(path = "") {
  const trimmedSiteUrl = siteUrl.replace(/\/+$/, "")
  const trimmedPath = path.replace(/^\/+/, "")

  return trimmedPath ? `${trimmedSiteUrl}/${trimmedPath}` : trimmedSiteUrl
}
