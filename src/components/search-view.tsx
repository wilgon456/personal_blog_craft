"use client"

import type { BlogPost } from "@/types/post"
import Link from "next/link"
import { useDeferredValue, useState } from "react"

type SearchViewProps = {
  initialQuery: string
  posts: BlogPost[]
}

export function SearchView({ initialQuery, posts }: SearchViewProps) {
  const [query, setQuery] = useState(() => {
    if (typeof window === "undefined") {
      return initialQuery
    }

    const params = new URLSearchParams(window.location.search)
    return params.get("q") ?? initialQuery
  })

  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLowerCase()

  const filteredPosts = normalizedQuery
    ? posts.filter((post) => {
        const haystack = [
          post.title,
          post.excerpt,
          post.contentMarkdown,
          post.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()

        return haystack.includes(normalizedQuery)
      })
    : posts

  return (
    <section className="search-panel">
      <div className="section-heading">
        <h1>Search</h1>
        <p>Find posts by keyword, phrase, or tag.</p>
      </div>

      <div className="search-card">
        <div className="search-panel__controls">
          <input
            className="search-panel__input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try title, excerpt, content, or a tag"
            type="search"
            value={query}
          />
        </div>
      </div>

      <p className="search-panel__summary">
        {normalizedQuery
          ? `${filteredPosts.length} result(s) for "${deferredQuery}".`
          : `${filteredPosts.length} published post(s) available.`}
      </p>

      <div className="search-results">
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <Link className="search-result" href={`/posts/${post.slug}`} key={post.id}>
              <div className="search-result__meta">
                {post.displayDate} | {post.readingMinutes} min read
              </div>
              <div className="search-result__title">{post.title}</div>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </Link>
          ))
        ) : (
          <div className="empty-card">
            <p className="eyebrow">No matches</p>
            <h2>Nothing matched this search yet.</h2>
            <p>Try a simpler keyword or publish more posts from Craft.</p>
          </div>
        )}
      </div>
    </section>
  )
}
