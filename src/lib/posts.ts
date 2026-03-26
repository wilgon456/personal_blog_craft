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

export function normalizeSeriesKey(series: string) {
  return slugify(series, {
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

export function sortPostsBySeriesOrder(posts: BlogPost[]) {
  return [...posts].sort((left, right) => {
    const leftOrder = left.seriesOrder ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.seriesOrder ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.publishedAt.localeCompare(right.publishedAt)
  })
}

export function getSeriesSummaries(posts: BlogPost[]) {
  const groupedPosts = new Map<string, BlogPost[]>()

  for (const post of posts) {
    if (!post.seriesKey) {
      continue
    }

    const collection = groupedPosts.get(post.seriesKey) ?? []
    collection.push(post)
    groupedPosts.set(post.seriesKey, collection)
  }

  return [...groupedPosts.entries()]
    .map(([seriesKey, seriesPosts]) => {
      const orderedPosts = sortPostsBySeriesOrder(seriesPosts)
      const anchorPost = orderedPosts[0]

      return {
        count: orderedPosts.length,
        description: anchorPost?.seriesDescription ?? "",
        key: seriesKey,
        label: anchorPost?.series ?? seriesKey,
        latestPublishedAt: sortPostsByDate(orderedPosts)[0]?.publishedAt ?? "",
        posts: orderedPosts,
      }
    })
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return right.latestPublishedAt.localeCompare(left.latestPublishedAt)
    })
}

export function getPostsBySeries(posts: BlogPost[], seriesKey: string) {
  return sortPostsBySeriesOrder(
    posts.filter((post) => post.seriesKey === seriesKey),
  )
}

export function getSeriesNavigation(posts: BlogPost[], post: BlogPost) {
  if (!post.seriesKey) {
    return {
      nextInSeries: null,
      previousInSeries: null,
      seriesPosts: [],
    }
  }

  const seriesPosts = getPostsBySeries(posts, post.seriesKey)
  const index = seriesPosts.findIndex((candidate) => candidate.slug === post.slug)

  return {
    nextInSeries:
      index >= 0 && index < seriesPosts.length - 1 ? seriesPosts[index + 1] : null,
    previousInSeries: index > 0 ? seriesPosts[index - 1] : null,
    seriesPosts,
  }
}

export function getRelatedPosts(posts: BlogPost[], post: BlogPost, limit = 3) {
  return posts
    .filter((candidate) => candidate.slug !== post.slug)
    .map((candidate) => {
      let score = 0

      if (post.seriesKey && candidate.seriesKey === post.seriesKey) {
        score += 120
      }

      if (post.categoryKey && candidate.categoryKey === post.categoryKey) {
        score += 18
      }

      const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length
      score += sharedTags * 24

      const dateDistance = Math.abs(
        new Date(candidate.publishedAt).valueOf() - new Date(post.publishedAt).valueOf(),
      )
      score += Math.max(0, 12 - Math.floor(dateDistance / (1000 * 60 * 60 * 24 * 45)))

      return {
        post: candidate,
        score,
      }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return right.post.publishedAt.localeCompare(left.post.publishedAt)
    })
    .slice(0, limit)
    .map((candidate) => candidate.post)
}

export function getSearchResults(posts: BlogPost[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return posts.map((post) => ({
      post,
      score: 0,
    }))
  }

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const compactQuery = normalizedQuery.replace(/\s+/g, "")

  return posts
    .map((post) => {
      const title = post.title.toLowerCase()
      const excerpt = post.excerpt.toLowerCase()
      const content = post.contentMarkdown.toLowerCase()
      const tags = post.tags.join(" ").toLowerCase()
      const series = post.series.toLowerCase()
      const compactTitle = title.replace(/\s+/g, "")
      const compactSeries = series.replace(/\s+/g, "")
      let score = 0

      if (title === normalizedQuery) {
        score += 160
      }

      if (title.includes(normalizedQuery)) {
        score += 120
      }

      if (series && series === normalizedQuery) {
        score += 90
      }

      if (series && series.includes(normalizedQuery)) {
        score += 60
      }

      if (tags.includes(normalizedQuery)) {
        score += 44
      }

      if (excerpt.includes(normalizedQuery)) {
        score += 26
      }

      if (content.includes(normalizedQuery)) {
        score += 12
      }

      if (compactQuery && compactTitle.includes(compactQuery)) {
        score += 24
      }

      if (compactQuery && compactSeries.includes(compactQuery)) {
        score += 16
      }

      for (const token of queryTokens) {
        if (title.includes(token)) {
          score += 18
        }

        if (series.includes(token)) {
          score += 12
        }

        if (tags.includes(token)) {
          score += 10
        }

        if (excerpt.includes(token)) {
          score += 6
        }

        if (content.includes(token)) {
          score += 3
        }
      }

      return {
        post,
        score,
      }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return right.post.publishedAt.localeCompare(left.post.publishedAt)
    })
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
