import type { BlogPost } from "@/types/post"
import { slugify } from "transliteration"

export const ALL_CATEGORY_KEY = "all"

export function normalizeTagKey(tag: string) {
  return slugify(tag, {
    lowercase: true,
    separator: "-",
  })
}

export function normalizeCategoryKey(category: string) {
  return slugify(category, {
    lowercase: true,
    separator: "-",
  })
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

export function getCategorySummaries(posts: BlogPost[]) {
  const counts = new Map<string, number>()

  for (const post of posts) {
    if (!post.category) {
      continue
    }

    counts.set(post.category, (counts.get(post.category) ?? 0) + 1)
  }

  return [
    {
      label: "All",
      count: posts.length,
      key: ALL_CATEGORY_KEY,
    },
    ...[...counts.entries()]
      .map(([label, count]) => ({
        label,
        count,
        key: normalizeCategoryKey(label),
      }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }

        return left.label.localeCompare(right.label)
      }),
  ]
}

export function filterPostsByCategory(posts: BlogPost[], categoryKey: string) {
  if (categoryKey === ALL_CATEGORY_KEY) {
    return posts
  }

  return posts.filter((post) => post.categoryKey === categoryKey)
}

export function sortPostsByDate(
  posts: BlogPost[],
  order: "asc" | "desc" = "desc",
) {
  return [...posts].sort((left, right) => {
    return order === "asc"
      ? left.publishedAt.localeCompare(right.publishedAt)
      : right.publishedAt.localeCompare(left.publishedAt)
  })
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

export function getArchiveMonthGroups(posts: BlogPost[]) {
  const groups = new Map<string, BlogPost[]>()

  for (const post of posts) {
    const publishedDate = new Date(post.publishedAt)

    if (Number.isNaN(publishedDate.valueOf())) {
      continue
    }

    const year = publishedDate.getFullYear()
    const month = publishedDate.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, "0")}`
    const collection = groups.get(key) ?? []
    collection.push(post)
    groups.set(key, collection)
  }

  return [...groups.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([key, groupedPosts]) => {
      const [yearText, monthText] = key.split("-")
      const year = Number(yearText)
      const month = Number(monthText)

      return {
        id: `archive-${yearText}-${monthText}`,
        key,
        year,
        month,
        label: `${yearText}.${monthText}`,
        posts: groupedPosts,
      }
    })
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
