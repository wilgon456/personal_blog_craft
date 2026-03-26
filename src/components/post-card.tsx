/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { type BlogPost } from "@/types/post"

type PostCardProps = {
  post: BlogPost
  compact?: boolean
}

export function PostCard({ post, compact = false }: PostCardProps) {
  return (
    <article className="post-card">
      {post.heroImage && !compact ? (
        <div className="post-card__image">
          <img
            alt={post.title}
            decoding="async"
            height="1000"
            loading="lazy"
            src={post.heroImage}
            width="1600"
          />
        </div>
      ) : null}

      <div className="post-card__body">
        {post.category ? (
          <div className="post-card__category">{post.category}</div>
        ) : null}

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

        <Link href={`/posts/${post.slug}`}>
          <h3 className="post-card__title">{post.title}</h3>
        </Link>

        {post.excerpt ? (
          <p className="post-card__excerpt">{post.excerpt}</p>
        ) : null}

        <div className="post-card__footer">
          <div className="tag-row">
            {post.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <Link
                className="tag-pill"
                href={`/tags/${post.tagKeys[tag]}`}
                key={`${post.id}-${tag}`}
              >
                {tag}
              </Link>
            ))}
          </div>

          <Link className="muted-link" href={`/posts/${post.slug}`}>
            Read post
          </Link>
        </div>
      </div>
    </article>
  )
}
