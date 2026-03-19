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
  siteAuthorUrl,
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
  const latestPosts = getLatestPosts(posts, 12)
  const tagSummaries = getTagSummaries(posts).slice(0, 20)
  const featuredPost = latestPosts[0] ?? null
  const feedPosts = featuredPost ? latestPosts.slice(1) : latestPosts
  const initials = siteAuthorName.slice(0, 2).toUpperCase()

  return (
    <section className="home-shell">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([websiteJsonLd, personJsonLd]),
        }}
        type="application/ld+json"
      />

      <aside className="home-left">
        <div>
          <p className="home-panel-heading">Tags</p>
          <div className="home-rail">
            <div className="home-tag-list" style={{ marginTop: "0.1rem" }}>
              {tagSummaries.length ? (
                tagSummaries.map((tag) => (
                  <Link className="home-tag-link" href={`/tags/${tag.key}`} key={tag.key}>
                    <span>{tag.label}</span>
                    <span className="home-tag-link__count">{tag.count}</span>
                  </Link>
                ))
              ) : (
                <p className="profile-card__bio">
                  Publish posts with tags to fill this rail.
                </p>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="home-center">
        <section className="home-mobile-profile">
          <p className="home-panel-heading">Profile</p>
          <div className="home-profile">
            <div className="home-avatar">{initials}</div>
            <div className="home-profile__content">
              <div className="home-profile__name">{siteAuthorName}</div>
              <div className="home-profile__role">frontend developer</div>
              <p className="profile-card__bio" style={{ marginTop: "0.55rem" }}>
                {siteDescription}
              </p>
            </div>
          </div>
        </section>

        {featuredPost ? (
          <section className="featured-post">
            <div className="home-feed-header">
              <div className="home-feed-title-wrap">
                <p className="home-panel-heading">Featured Post</p>
              </div>
            </div>
            <article className="featured-post__card">
              {featuredPost.heroImage ? (
                <div className="featured-post__image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={featuredPost.title} src={featuredPost.heroImage} />
                </div>
              ) : null}
              <div className="featured-post__body">
                {featuredPost.tags[0] ? (
                  <Link
                    className="featured-post__tag"
                    href={`/tags/${featuredPost.tagKeys[featuredPost.tags[0]]}`}
                  >
                    {featuredPost.tags[0]}
                  </Link>
                ) : null}
                <Link href={`/posts/${featuredPost.slug}`}>
                  <h2 className="featured-post__title">{featuredPost.title}</h2>
                </Link>
                <div className="post-card__meta">
                  <span>{featuredPost.displayDate}</span>
                  <span>|</span>
                  <span>{featuredPost.readingMinutes} min read</span>
                </div>
                {featuredPost.excerpt ? (
                  <p className="featured-post__excerpt">{featuredPost.excerpt}</p>
                ) : null}
              </div>
            </article>
          </section>
        ) : null}

        <section className="home-search-card panel">
          <p className="home-panel-heading">Search</p>
          <form action={`${basePath}/search/`} method="get">
            <input
              aria-label="Search posts"
              name="q"
              placeholder="Search Keyword..."
              type="search"
            />
          </form>
        </section>

        <div className="home-mobile-tags">
          {tagSummaries.map((tag) => (
            <Link className="tag-pill" href={`/tags/${tag.key}`} key={tag.key}>
              {tag.label}
            </Link>
          ))}
        </div>

        <div className="home-feed-header">
          <div className="home-feed-title-wrap">
            <h1 className="home-feed-title">All Posts</h1>
            <p>{posts.length} posts, {countUniqueTags(posts)} tags</p>
          </div>
          <div className="home-feed-header__actions">
            <span>Desc</span>
            <span>Latest</span>
          </div>
        </div>

        {feedPosts.length ? (
          <div className="post-list">
            {feedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published posts yet"
            description="Create posts in your Craft Posts collection and set Published to true to fill this feed."
          />
        )}
      </div>

      <aside className="home-right">
        <section className="home-right-group">
          <p className="home-panel-heading">Profile</p>
          <div className="panel home-right-card">
            <div className="home-profile">
              <div className="home-avatar">{initials}</div>
              <div className="home-profile__content">
                <div className="home-profile__name">{siteAuthorName}</div>
                <div className="home-profile__role">frontend developer</div>
                <p className="profile-card__bio" style={{ marginTop: "0.55rem" }}>
                  {siteDescription}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-right-group">
          <p className="home-panel-heading">Service</p>
          <div className="panel home-right-card">
            <div className="home-link-grid">
              <Link href="/archive">
                <span>Archive</span>
                <span className="home-contact-label">Open</span>
              </Link>
              <Link href="/search">
                <span>Search</span>
                <span className="home-contact-label">Open</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="home-right-group">
          <p className="home-panel-heading">Contact</p>
          <div className="panel home-right-card">
            <div className="home-contact-list">
              <a href="https://github.com/wilgon456" rel="noreferrer" target="_blank">
                <span>github</span>
              </a>
              <a href={siteAuthorUrl} rel="noreferrer" target="_blank">
                <span>instagram</span>
              </a>
            </div>
          </div>
        </section>

        <section className="home-right-group home-right-footer">
          <a href="https://github.com/wilgon456" rel="noreferrer" target="_blank">
            {new Date().getFullYear()} {siteAuthorName}
          </a>
        </section>
      </aside>
    </section>
  )
}
