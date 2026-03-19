import { EmptyState } from "@/components/empty-state"
import { PostCard } from "@/components/post-card"
import { findDisplayTagByKey, getPublishedPosts } from "@/lib/posts"
import { absoluteUrl } from "@/lib/site"
import { notFound } from "next/navigation"

type TagPageProps = {
  params: {
    tag: string
  }
}

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  const keys = new Set<string>()

  for (const post of posts) {
    for (const tagKey of Object.values(post.tagKeys)) {
      keys.add(tagKey)
    }
  }

  return [...keys].map((tag) => ({ tag }))
}

export async function generateMetadata({ params }: TagPageProps) {
  const { tag } = params
  const posts = await getPublishedPosts()
  const displayTag = findDisplayTagByKey(posts, tag)

  return {
    title: displayTag ? `Tag: ${displayTag}` : "Tag",
    alternates: displayTag
      ? {
          canonical: absoluteUrl(`tags/${tag}/`),
        }
      : undefined,
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = params
  const posts = await getPublishedPosts()
  const displayTag = findDisplayTagByKey(posts, tag)

  if (!displayTag) {
    notFound()
  }

  const filteredPosts = posts.filter((post) => post.tagKeys[displayTag] === tag)

  return (
    <section className="page-grid">
      <div className="page-main">
        <div className="section-heading">
          <h1>{displayTag}</h1>
          <p>{filteredPosts.length} posts in this tag.</p>
        </div>

        {filteredPosts.length ? (
          <div className="post-list">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No posts in this tag yet"
            description="Once a published post includes this tag, it will appear here automatically."
          />
        )}
      </div>

      <aside className="page-side">
        <div className="panel">
          <div className="section-heading">
            <h2>Tag note</h2>
          </div>
          <p className="profile-card__bio">
            Tags can mix Korean and English labels. Internally we normalize them
            into route-safe keys, but the original label stays visible.
          </p>
        </div>
      </aside>
    </section>
  )
}
