/* eslint-disable @next/next/no-img-element */
import { JsonLd } from "@/components/json-ld"
import { PostCard } from "@/components/post-card"
import { renderCraftBlocksToHtml } from "@/lib/craft"
import {
  getAdjacentPosts,
  getRelatedPosts,
  getSeriesNavigation,
  getSeriesSummaries,
} from "@/lib/posts"
import { getPostBySlug, getPublishedPosts } from "@/lib/posts-data"
import { absoluteUrl } from "@/lib/site"
import {
  buildBlogPostingStructuredData,
  buildBreadcrumbList,
} from "@/lib/structured-data"
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

  const html = renderCraftBlocksToHtml(post.contentBlocks)
  const { previousPost, nextPost } = getAdjacentPosts(posts, post.slug)
  const { previousInSeries, nextInSeries, seriesPosts } = getSeriesNavigation(posts, post)
  const relatedPosts = getRelatedPosts(posts, post, 3)
  const featuredSeries = getSeriesSummaries(posts)
    .filter((summary) => summary.key !== post.seriesKey)
    .slice(0, 3)
  const articleJsonLd = buildBlogPostingStructuredData(post)
  const breadcrumbJsonLd = buildBreadcrumbList([
    {
      name: "Home",
      item: absoluteUrl(),
    },
    {
      name: "Archive",
      item: absoluteUrl("archive/"),
    },
    {
      name: post.title,
      item: absoluteUrl(`posts/${post.slug}/`),
    },
  ])

  return (
    <section className="page-grid">
      <div className="page-main">
        <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
        <article className="article-shell">
          <header className="article-header">
            <p className="article-header__eyebrow">Post</p>
            <h1>{post.title}</h1>
            <div className="post-card__meta">
              <span>{post.displayDate}</span>
              <span>|</span>
              <span>{post.readingMinutes} min read</span>
              {post.series ? (
                <>
                  <span>|</span>
                  <Link className="muted-link" href={`/series/#${post.seriesKey}`}>
                    {post.series}
                  </Link>
                </>
              ) : null}
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
                <img
                  alt={post.title}
                  decoding="async"
                  fetchPriority="high"
                  height="1000"
                  loading="eager"
                  src={post.heroImage}
                  width="1600"
                />
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

          {seriesPosts.length ? (
            <section className="article-section">
              <div className="section-heading">
                <div>
                  <h2>This series</h2>
                  <p>
                    {seriesPosts.length} post(s) in {post.series}.
                  </p>
                </div>
                <Link className="muted-link" href={`/series/#${post.seriesKey}`}>
                  Open series
                </Link>
              </div>

              {post.seriesDescription ? (
                <p className="article-section__description">{post.seriesDescription}</p>
              ) : null}

              <div className="series-list">
                {seriesPosts.map((seriesPost, index) => (
                  <Link
                    className={`series-list__item${
                      seriesPost.slug === post.slug ? " is-active" : ""
                    }`}
                    href={`/posts/${seriesPost.slug}`}
                    key={seriesPost.id}
                  >
                    <span className="series-list__meta">
                      {seriesPost.seriesOrder ?? index + 1}. {seriesPost.displayDate}
                    </span>
                    <strong>{seriesPost.title}</strong>
                  </Link>
                ))}
              </div>

              <div className="article-series-nav">
                {previousInSeries ? (
                  <Link className="archive-item" href={`/posts/${previousInSeries.slug}`}>
                    <p className="eyebrow">Previous In Series</p>
                    <strong>{previousInSeries.title}</strong>
                  </Link>
                ) : (
                  <div className="archive-item">
                    <p className="eyebrow">Previous In Series</p>
                    <strong>Series starts here</strong>
                  </div>
                )}

                {nextInSeries ? (
                  <Link className="archive-item" href={`/posts/${nextInSeries.slug}`}>
                    <p className="eyebrow">Next In Series</p>
                    <strong>{nextInSeries.title}</strong>
                  </Link>
                ) : (
                  <div className="archive-item">
                    <p className="eyebrow">Next In Series</p>
                    <strong>Series ends here</strong>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className="article-section">
            <div className="section-heading">
              <div>
                <h2>Related posts</h2>
                <p>Picked by shared series, tags, category, and recency.</p>
              </div>
            </div>

            {relatedPosts.length ? (
              <div className="post-list post-list--compact-grid">
                {relatedPosts.map((relatedPost) => (
                  <PostCard compact key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            ) : (
              <p className="profile-card__bio">
                Related posts will appear here once more topics overlap.
              </p>
            )}
          </section>

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
        {seriesPosts.length ? (
          <div className="panel">
            <div className="section-heading">
              <h2>Series progress</h2>
            </div>
            <p className="profile-card__bio">
              {seriesPosts.findIndex((seriesPost) => seriesPost.slug === post.slug) + 1} of{" "}
              {seriesPosts.length} in {post.series}.
            </p>
            <div className="mini-list" style={{ marginTop: "1rem" }}>
              {seriesPosts.map((seriesPost, index) => (
                <Link href={`/posts/${seriesPost.slug}`} key={seriesPost.id}>
                  <span>
                    {seriesPost.seriesOrder ?? index + 1}. {seriesPost.title}
                  </span>
                  <span className="muted-link">
                    {seriesPost.slug === post.slug ? "Current" : seriesPost.displayDate}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="panel">
          <div className="section-heading">
            <h2>More series</h2>
          </div>
          {featuredSeries.length ? (
            <div className="mini-list">
              {featuredSeries.map((series) => (
                <Link href={`/series/#${series.key}`} key={series.key}>
                  <span>{series.label}</span>
                  <span className="muted-link">{series.count} posts</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="profile-card__bio">
              Series links will appear here once you group posts in Craft.
            </p>
          )}
        </div>
      </aside>
    </section>
  )
}
