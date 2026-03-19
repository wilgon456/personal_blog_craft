/* eslint-disable @next/next/no-img-element */
import { PostCard } from "@/components/post-card"
import { markdownToHtml } from "@/lib/markdown"
import {
  getAdjacentPosts,
} from "@/lib/posts"
import { getPostBySlug, getPublishedPosts } from "@/lib/posts-data"
import { absoluteUrl, siteAuthorName, siteAuthorUrl, siteName } from "@/lib/site"
import Link from "next/link"
import { notFound } from "next/navigation"

type PostPageProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post not found",
    }
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: {
      canonical: absoluteUrl(`posts/${post.slug}/`),
    },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      url: absoluteUrl(`posts/${post.slug}/`),
      type: "article",
      images: post.heroImage ? [{ url: post.heroImage }] : undefined,
    },
    twitter: {
      card: post.heroImage ? "summary_large_image" : "summary",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.heroImage ? [post.heroImage] : undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const [post, posts] = await Promise.all([
    getPostBySlug(slug),
    getPublishedPosts(),
  ])

  if (!post) {
    notFound()
  }

  const html = markdownToHtml(post.contentMarkdown)
  const { previousPost, nextPost } = getAdjacentPosts(posts, post.slug)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: siteAuthorName,
      url: siteAuthorUrl || absoluteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
    mainEntityOfPage: absoluteUrl(`posts/${post.slug}/`),
    image: post.heroImage ? [post.heroImage] : undefined,
  }
  const relatedPosts = posts
    .filter(
      (candidate) =>
        candidate.slug !== post.slug &&
        candidate.tags.some((tag) => post.tags.includes(tag)),
    )
    .slice(0, 2)

  return (
    <section className="page-grid">
      <div className="page-main">
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd),
          }}
          type="application/ld+json"
        />
        <article className="article-shell">
          <header className="article-header">
            <p className="article-header__eyebrow">Post</p>
            <h1>{post.title}</h1>
            <div className="post-card__meta">
              <span>{post.displayDate}</span>
              <span>|</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            {post.heroImage ? (
              <div
                className="post-card__image"
                style={{
                  borderRadius: "24px",
                  marginBottom: "1rem",
                  marginTop: "1rem",
                  overflow: "hidden",
                }}
              >
                <img alt={post.title} src={post.heroImage} />
              </div>
            ) : null}
            {post.excerpt ? (
              <p className="article-header__summary">{post.excerpt}</p>
            ) : null}
            <div className="tag-row" style={{ marginTop: "1rem" }}>
              {post.tags.map((tag) => (
                <Link
                  className="tag-pill"
                  href={`/tags/${post.tagKeys[tag]}`}
                  key={tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </header>

          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <nav className="article-navigation" aria-label="Post navigation">
            {previousPost ? (
              <Link href={`/posts/${previousPost.slug}`}>
                <p className="eyebrow">Previous</p>
                <strong>{previousPost.title}</strong>
              </Link>
            ) : (
              <div className="archive-item">
                <p className="eyebrow">Previous</p>
                <strong>No earlier post</strong>
              </div>
            )}

            {nextPost ? (
              <Link href={`/posts/${nextPost.slug}`}>
                <p className="eyebrow">Next</p>
                <strong>{nextPost.title}</strong>
              </Link>
            ) : (
              <div className="archive-item">
                <p className="eyebrow">Next</p>
                <strong>No newer post</strong>
              </div>
            )}
          </nav>
        </article>
      </div>

      <aside className="page-side">
        <div className="panel">
          <div className="section-heading">
            <h2>Related notes</h2>
          </div>
          {relatedPosts.length ? (
            <div className="mini-list">
              {relatedPosts.map((relatedPost) => (
                <Link href={`/posts/${relatedPost.slug}`} key={relatedPost.id}>
                  <span>{relatedPost.title}</span>
                  <span className="muted-link">{relatedPost.displayDate}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="profile-card__bio">
              Related posts will appear here when tags overlap.
            </p>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>Read more</h2>
          </div>
          {posts
            .filter((candidate) => candidate.slug !== post.slug)
            .slice(0, 2)
            .map((candidate) => (
              <PostCard key={candidate.id} compact post={candidate} />
            ))}
        </div>
      </aside>
    </section>
  )
}
