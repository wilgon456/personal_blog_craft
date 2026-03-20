import {
  type CraftBlock,
  flattenCraftBlocks,
  getCraftCollectionItems,
} from "@/lib/craft"
import { summarizeMarkdown } from "@/lib/content-summary"
import { slugify } from "transliteration"

type SitePage = {
  id: string
  title: string
  slug: string
  published: boolean
  updatedAt: string
  seoTitle: string
  seoDescription: string
  heroImage: string
  contentMarkdown: string
  contentBlocks: CraftBlock[]
}

function ensureString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function ensureBoolean(value: unknown) {
  return value === true
}

function ensureDate(value: unknown) {
  const raw = ensureString(value)
  if (!raw) {
    return ""
  }

  const date = new Date(raw)
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString()
}

function toSlug(value: string, fallbackId: string) {
  const normalized = slugify(value, {
    lowercase: true,
    separator: "-",
  })

  return normalized || `page-${fallbackId.slice(0, 8)}`
}

function normalizePage(
  item: Awaited<ReturnType<typeof getCraftCollectionItems>>[number],
): SitePage {
  const properties = item.properties ?? {}
  const title = ensureString(item.title) || "Untitled page"
  const contentMarkdown = flattenCraftBlocks(item.content)
  const slug = toSlug(ensureString(properties.slug) || title, item.id)
  const updatedAt = ensureDate(properties.updated_at) || new Date().toISOString()
  const seoDescription =
    ensureString(properties.seo_description) || summarizeMarkdown(contentMarkdown, 160)

  return {
    id: item.id,
    title,
    slug,
    published: ensureBoolean(properties.published),
    updatedAt,
    seoTitle: ensureString(properties.seo_title) || title,
    seoDescription,
    heroImage: ensureString(properties.hero_image),
    contentMarkdown,
    contentBlocks: item.content ?? [],
  }
}

export async function getPublishedPages() {
  const items = await getCraftCollectionItems("Pages")

  return items
    .map(normalizePage)
    .filter((page) => page.published)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export async function getPageBySlug(slug: string) {
  const pages = await getPublishedPages()
  return pages.find((page) => page.slug === slug) ?? null
}

function matchesAboutPage(page: SitePage) {
  return page.slug === "about" || toSlug(page.title, page.id) === "about"
}

export async function getAboutPage() {
  const pages = await getPublishedPages()
  return pages.find(matchesAboutPage) ?? null
}
