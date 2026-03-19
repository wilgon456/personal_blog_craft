import type { MetadataRoute } from "next"
import { getPageBySlug } from "@/lib/pages"
import { getPublishedPosts } from "@/lib/posts-data"
import { getTagSummaries } from "@/lib/posts"
import { absoluteUrl } from "@/lib/site"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, aboutPage] = await Promise.all([
    getPublishedPosts(),
    getPageBySlug("about"),
  ])
  const tags = getTagSummaries(posts)
  const latestDate =
    aboutPage?.updatedAt || posts[0]?.updatedAt || new Date().toISOString()

  return [
    {
      url: absoluteUrl(),
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("archive/"),
      lastModified: latestDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("about/"),
      lastModified: aboutPage?.updatedAt || latestDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("search/"),
      lastModified: latestDate,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`posts/${post.slug}/`),
      lastModified: post.updatedAt || post.publishedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...tags.map((tag) => ({
      url: absoluteUrl(`tags/${tag.key}/`),
      lastModified: latestDate,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
