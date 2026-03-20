import { EmptyState } from "@/components/empty-state"
import { getArchiveMonthGroups } from "@/lib/posts"
import { getPublishedPosts } from "@/lib/posts-data"
import { absoluteUrl, siteDescription } from "@/lib/site"
import Link from "next/link"

export const metadata = {
  title: "Archive",
  description: `Browse the archive timeline for ${siteDescription}`,
  alternates: {
    canonical: absoluteUrl("archive/"),
  },
}

export default async function ArchivePage() {
  const posts = await getPublishedPosts()
  const archive = getArchiveMonthGroups(posts)

  return (
    <section className="page-grid">
      <div className="page-main">
        <div className="section-heading">
          <h1>Archive</h1>
          <p>{posts.length} posts arranged by month.</p>
        </div>

        {!archive.length ? (
          <EmptyState
            title="Archive is still empty"
            description="Publish your first Craft post and it will appear here automatically."
          />
        ) : (
          archive.map((group) => (
            <section className="archive-year" id={group.id} key={group.key}>
              <div className="section-heading">
                <h2>{group.label}</h2>
                <p>{group.posts.length} entries</p>
              </div>

              <div className="archive-list">
                {group.posts.map((post) => (
                  <Link className="archive-item" href={`/posts/${post.slug}`} key={post.id}>
                    <div className="archive-item__meta">
                      {post.displayDate} | {post.readingMinutes} min read
                    </div>
                    <div className="archive-item__title">{post.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <aside className="page-side">
        <div className="panel">
          <div className="section-heading">
            <h2>Browse by time</h2>
          </div>
          {!!archive.length && (
            <div className="archive-time-grid" aria-label="Archive month shortcuts">
              {archive.map((group) => (
                <a className="archive-time-link" href={`#${group.id}`} key={group.key}>
                  {group.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </aside>
    </section>
  )
}
