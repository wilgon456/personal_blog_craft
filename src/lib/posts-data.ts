import { flattenCraftBlocks, getCraftPostItems } from "@/lib/craft"
import { markdownToPlainText, summarizeMarkdown } from "@/lib/content-summary"
import {
  normalizeCategoryKey,
  normalizeTagKey,
} from "@/lib/posts"
import type { BlogPost } from "@/types/post"
import { slugify } from "transliteration"

function ensureString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function ensureStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => ensureString(item))
    .filter(Boolean)
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

function toEnglishSlug(value: string, fallbackId: string) {
  const normalized = slugify(value, {
    lowercase: true,
    separator: "-",
  })

  return normalized || `post-${fallbackId.slice(0, 8)}`
}

function readingMinutesFromText(text: string) {
  const wordCount = markdownToPlainText(text).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 220))
}

function displayDate(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.valueOf())) {
    return "Undated"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function normalizePost(item: Awaited<ReturnType<typeof getCraftPostItems>>[number]): BlogPost {
  const properties = item.properties ?? {}
  const title = ensureString(item.title) || "Untitled post"
  const contentMarkdown = flattenCraftBlocks(item.content)
  const excerptFromContent = summarizeMarkdown(contentMarkdown, 180)
  const seoDescriptionFromContent = summarizeMarkdown(contentMarkdown, 160)
  const excerpt =
    ensureString(properties.excerpt) ||
    excerptFromContent
  const rawTags = ensureStringArray(properties.tags)
  const category = ensureString(properties.category)
  const publishedAt =
    ensureDate(properties.published_at) ||
    ensureDate(properties.updated_at) ||
    new Date().toISOString()
  const updatedAt = ensureDate(properties.updated_at) || publishedAt
  const slug = toEnglishSlug(ensureString(properties.slug) || title, item.id)
  const tagKeys = Object.fromEntries(
    rawTags.map((tag) => [tag, normalizeTagKey(tag)]),
  )

  return {
    id: item.id,
    title,
    slug,
    excerpt,
    category,
    categoryKey: category ? normalizeCategoryKey(category) : "",
    tags: rawTags,
    tagKeys,
    published: ensureBoolean(properties.published),
    publishedAt,
    updatedAt,
    displayDate: displayDate(publishedAt),
    year: new Date(publishedAt).getFullYear(),
    seoTitle: ensureString(properties.seo_title) || title,
    seoDescription:
      ensureString(properties.seo_description) ||
      seoDescriptionFromContent ||
      excerpt,
    heroImage: ensureString(properties.hero_image),
    contentMarkdown,
    readingMinutes: readingMinutesFromText(contentMarkdown || excerpt),
  }
}

let allPostsPromise: Promise<BlogPost[]> | null = null
let publishedPostsPromise: Promise<BlogPost[]> | null = null

const buildAllPosts = async () => {
  const items = await getCraftPostItems()

  return items
    .map(normalizePost)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export async function getAllPosts() {
  allPostsPromise ??= buildAllPosts()
  return allPostsPromise
}

const buildPublishedPosts = async () => {
  const posts = await getAllPosts()
  return posts.filter((post) => post.published)
}

export async function getPublishedPosts() {
  publishedPostsPromise ??= buildPublishedPosts()
  return publishedPostsPromise
}

export async function getPostBySlug(slug: string) {
  const posts = await getPublishedPosts()
  return posts.find((post) => post.slug === slug)
}
