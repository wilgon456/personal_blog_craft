import type { BlogPost } from "@/types/post"
import {
  absoluteUrl,
  siteAuthorName,
  siteAuthorUrl,
  siteBrandIcon,
  siteName,
} from "@/lib/site"

type BreadcrumbEntry = {
  name: string
  item: string
}

export function buildBreadcrumbList(entries: BreadcrumbEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  }
}

export function buildBlogPostingStructuredData(post: BlogPost) {
  const canonicalUrl = absoluteUrl(`posts/${post.slug}/`)

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "ko-KR",
    articleSection: post.category || undefined,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    image: post.heroImage ? [post.heroImage] : undefined,
    author: {
      "@type": "Person",
      name: siteAuthorName,
      url: siteAuthorUrl || absoluteUrl("about/"),
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: absoluteUrl(),
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteBrandIcon),
      },
    },
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl(),
    },
  }
}
