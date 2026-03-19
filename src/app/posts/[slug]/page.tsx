/* eslint-disable @next/next/no-img-element */
import { PostCard } from "@/components/post-card"
import { markdownToHtml } from "@/lib/markdown"
import {
  getAdjacentPosts,
  getPostBySlug,
  getPublishedPosts,
} from "@/lib/posts"
import Link from "next/link"
import { notFound } from "next/navigation"

type PostPageProps = {
  params: {
    slug: string
  }
}

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: "Post not found",
    }
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params
  const [post, posts] = await Promise.all([
    getPostBySlug(slug),
    getPublishedPosts(),
  ])

  if (!post) {
    notFound()
  }

  const html = markdownToHtml(post.contentMarkdown)
  const { previousPost, nextPost } = getAdjacentPosts(posts, post.slug)
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
        <article className="article-shell">
          <header className="article-header">
            <p className="article-header__eyebrow">Post</p>
            <h1>{post.title}</h1>
            <div className="post-card__meta">
              <span>{post.displayDate}</span>
              <span>|</span>
              <span>{post.readingMinutes} min read</span>
            </div>
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

          {post.heroImage ? (
            <div
              className="post-card__image"
              style={{ borderRadius: "24px", marginBottom: "1.4rem", overflow: "hidden" }}
            >
              <img alt={post.title} src={post.heroImage} />
            </div>
          ) : null}

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
