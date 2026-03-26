import { EmptyState } from "@/components/empty-state"
import { JsonLd } from "@/components/json-ld"
import { PostCard } from "@/components/post-card"
import { getSeriesSummaries } from "@/lib/posts"
import { getPublishedPosts } from "@/lib/posts-data"
import { absoluteUrl, siteDescription } from "@/lib/site"
import { buildBreadcrumbList } from "@/lib/structured-data"

export const metadata = {
  title: "Series",
  description: `Browse post series collected across ${siteDescription}`,
  alternates: {
    canonical: absoluteUrl("series/"),
  },
}

export default async function SeriesIndexPage() {
  const posts = await getPublishedPosts()
  const series = getSeriesSummaries(posts)
  const breadcrumbJsonLd = buildBreadcrumbList([
    {
      name: "Home",
      item: absoluteUrl(),
    },
    {
      name: "Series",
      item: absoluteUrl("series/"),
    },
  ])

  return (
    <section className="page-grid">
      <JsonLd data={breadcrumbJsonLd} />
      <div className="page-main">
        <div className="section-heading">
          <h1>Series</h1>
          <p>{series.length} series curated from published posts.</p>
        </div>

        {series.length ? (
          series.map((seriesEntry) => (
            <section className="series-section" id={seriesEntry.key} key={seriesEntry.key}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{seriesEntry.count} posts</p>
                  <h2>{seriesEntry.label}</h2>
                  {seriesEntry.description ? <p>{seriesEntry.description}</p> : null}
                </div>
              </div>

              <div className="post-list">
                {seriesEntry.posts.map((post) => (
                  <div id={`series-card-${post.id}`} key={post.id}>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <EmptyState
            title="No series yet"
            description="Add a shared series name in Craft posts and grouped reading paths will appear here automatically."
          />
        )}
      </div>

      <aside className="page-side">
        <div className="panel">
          <div className="section-heading">
            <h2>Browse Series</h2>
          </div>
          {series.length ? (
            <div className="mini-list">
              {series.map((seriesEntry) => (
                <a href={`#${seriesEntry.key}`} key={seriesEntry.key}>
                  <span>{seriesEntry.label}</span>
                  <span className="muted-link">{seriesEntry.count} posts</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="profile-card__bio">Series shortcuts will appear here.</p>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <h2>How To Use</h2>
          </div>
          <p className="profile-card__bio">
            Add the same <strong>series</strong> value to multiple posts in Craft. If
            you also set <strong>series_order</strong> and <strong>series_description</strong>,
            the reading flow becomes much clearer.
          </p>
        </div>
      </aside>
    </section>
  )
}
