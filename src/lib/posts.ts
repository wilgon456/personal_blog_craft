import type { BlogPost } from "@/types/post"
import { slugify } from "transliteration"
import { flattenCraftBlocks, getCraftPostItems } from "@/lib/craft"

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

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function takeExcerpt(text: string, maxLength = 180) {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

function toEnglishSlug(value: string, fallbackId: string) {
  const normalized = slugify(value, {
    lowercase: true,
    separator: "-",
  })

  return normalized || `post-${fallbackId.slice(0, 8)}`
}

export function normalizeTagKey(tag: string) {
  return slugify(tag, {
    lowercase: true,
    separator: "-",
  })
}

function readingMinutesFromText(text: string) {
  const wordCount = stripMarkdown(text).split(/\s+/).filter(Boolean).length
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
  const excerpt =
    ensureString(properties.excerpt) ||
    takeExcerpt(stripMarkdown(contentMarkdown), 180)
  const rawTags = ensureStringArray(properties.tags)
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
    tags: rawTags,
    tagKeys,
    published: ensureBoolean(properties.published),
    publishedAt,
    updatedAt,
    displayDate: displayDate(publishedAt),
    year: new Date(publishedAt).getFullYear(),
    seoTitle: ensureString(properties.seo_title) || title,
    seoDescription: ensureString(properties.seo_description) || excerpt,
    heroImage: ensureString(properties.hero_image),
    contentMarkdown,
    readingMinutes: readingMinutesFromText(contentMarkdown || excerpt),
  }
}

export async function getAllPosts() {
  const items = await getCraftPostItems()

  return items
    .map(normalizePost)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export async function getPublishedPosts() {
  const posts = await getAllPosts()
  return posts.filter((post) => post.published)
}

export async function getPostBySlug(slug: string) {
  const posts = await getPublishedPosts()
  return posts.find((post) => post.slug === slug)
}

export function getLatestPosts(posts: BlogPost[], limit: number) {
  return posts.slice(0, limit)
}

export function countUniqueTags(posts: BlogPost[]) {
  return new Set(posts.flatMap((post) => post.tags)).size
}

export function getTagSummaries(posts: BlogPost[]) {
  const counts = new Map<string, number>()

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({
      label,
      count,
      key: normalizeTagKey(label),
    }))
    .sort((left, right) => right.count - left.count)
}

export function getArchiveGroups(posts: BlogPost[]) {
  const groups = new Map<number, BlogPost[]>()

  for (const post of posts) {
    const collection = groups.get(post.year) ?? []
    collection.push(post)
    groups.set(post.year, collection)
  }

  return [...groups.entries()]
    .sort((left, right) => right[0] - left[0])
    .map(([year, groupedPosts]) => ({
      year,
      posts: groupedPosts,
    }))
}

export function getAdjacentPosts(posts: BlogPost[], slug: string) {
  const index = posts.findIndex((post) => post.slug === slug)

  return {
    nextPost: index > 0 ? posts[index - 1] : null,
    previousPost: index >= 0 && index < posts.length - 1 ? posts[index + 1] : null,
  }
}

export function findDisplayTagByKey(posts: BlogPost[], tagKey: string) {
  for (const post of posts) {
    for (const [tag, key] of Object.entries(post.tagKeys)) {
      if (key === tagKey) {
        return tag
      }
    }
  }

  return null
}
