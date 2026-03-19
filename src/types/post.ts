export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  categoryKey: string
  tags: string[]
  tagKeys: Record<string, string>
  published: boolean
  publishedAt: string
  updatedAt: string
  displayDate: string
  year: number
  seoTitle: string
  seoDescription: string
  heroImage: string
  contentMarkdown: string
  readingMinutes: number
}
