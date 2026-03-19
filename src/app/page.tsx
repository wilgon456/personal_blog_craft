import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { PostCard } from "@/components/post-card"
import {
  countUniqueTags,
  getLatestPosts,
  getPublishedPosts,
  getTagSummaries,
} from "@/lib/posts"
import {
  absoluteUrl,
  basePath,
  siteAuthorName,
  siteDescription,
  siteName,
  siteUrl,
} from "@/lib/site"

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: absoluteUrl(),
  description: siteDescription,
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteAuthorName,
  url: siteUrl,
}

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const latestPosts = getLatestPosts(posts, 6)
  const tagSummaries = getTagSummaries(posts).slice(0, 10)

  return (
    <section className="page-grid">
      <div className="page-main">
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteJsonLd, personJsonLd]),
          }}
          type="application/ld+json"
        />
        <section className="hero panel">
          <p className="hero__eyebrow">Writing from Craft</p>
          <h1>
            Quiet structure,
            <br />
            warm reading.
          </h1>
          <p className="hero__body">
            {siteDescription} This layout borrows the calm editorial feeling of
            morethan-log, then reshapes it for a Craft-powered static blog.
          </p>
          <div className="hero__actions">
            <Link className="button-link" href="/archive">
              Browse archive
            </Link>
            <Link className="button-muted" href="/search">
              Search notes
            </Link>
          </div>
          <div className="metrics">
            <div className="metric">
              <strong>{posts.length}</strong>
              <span>Published posts</span>
            </div>
            <div className="metric">
              <strong>{countUniqueTags(posts)}</strong>
              <span>Tags in use</span>
            </div>
            <div className="metric">
              <strong>{new Set(posts.map((post) => post.year)).size || 0}</strong>
              <span>Archive years</span>
            </div>
          </div>
        </section>

        <section className="search-card">
          <form action={`${basePath}/search/`} method="get">
            <input
              aria-label="Search posts"
              name="q"
              placeholder="Search by title, excerpt, content, or tag"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <div className="section-heading">
            <h2>Latest posts</h2>
            <p>Published notes appear automatically from Craft.</p>
          </div>

          {latestPosts.length ? (
            <div className="post-list">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published posts yet"
              description="Create posts in your Craft Posts collection and set Published to true to fill this page."
            />
          )}
        </section>
      </div>

      <aside className="page-side">
        <section className="panel">
          <p className="eyebrow">Profile</p>
          <h2 className="profile-card__name">{siteAuthorName}</h2>
          <p className="profile-card__bio">
            A Craft-first writing flow with GitHub Pages delivery. The CMS stays
            simple and the reading experience stays focused.
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Popular tags</h2>
          </div>
          <div className="tag-row">
            {tagSummaries.length ? (
              tagSummaries.map((tag) => (
                <Link className="tag-pill" href={`/tags/${tag.key}`} key={tag.key}>
                  {tag.label} · {tag.count}
                </Link>
              ))
            ) : (
              <p className="profile-card__bio">
                Tags will show up after the first post is published.
              </p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Shortcuts</h2>
          </div>
          <div className="mini-list">
            <Link href="/archive">
              <span>Archive timeline</span>
              <span className="muted-link">Open</span>
            </Link>
            <Link href="/search">
              <span>Keyword search</span>
              <span className="muted-link">Open</span>
            </Link>
          </div>
        </section>
      </aside>
    </section>
  )
}
