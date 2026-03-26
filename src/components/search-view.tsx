"use client"

import { getSearchResults } from "@/lib/posts"
import { trackGoogleAnalyticsEvent } from "@/lib/google-analytics"
import type { BlogPost } from "@/types/post"
import Link from "next/link"
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"

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
  const lastTrackedQuery = useRef("")
  const searchResults = useMemo(
    () => getSearchResults(posts, deferredQuery),
    [deferredQuery, posts],
  )
  const filteredPosts = normalizedQuery
    ? searchResults.map((result) => result.post)
    : posts

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const url = new URL(window.location.href)

    if (normalizedQuery) {
      url.searchParams.set("q", deferredQuery.trim())
    } else {
      url.searchParams.delete("q")
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  }, [deferredQuery, normalizedQuery])

  useEffect(() => {
    if (!normalizedQuery) {
      lastTrackedQuery.current = ""
      return
    }

    const trackingKey = `${normalizedQuery}:${filteredPosts.length}`

    if (lastTrackedQuery.current === trackingKey) {
      return
    }

    lastTrackedQuery.current = trackingKey
    trackGoogleAnalyticsEvent("view_search_results", {
      result_count: filteredPosts.length,
      search_term: deferredQuery.trim(),
    })
  }, [deferredQuery, filteredPosts.length, normalizedQuery])

  const suggestedPosts = posts.slice(0, 3)

  return (
    <section className="search-panel">
      <div className="section-heading">
        <h1>Search</h1>
        <p>Find posts by title, series, tag, excerpt, or body text.</p>
      </div>

      <div className="search-card">
        <div className="search-panel__controls">
          <input
            className="search-panel__input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try title, series, tag, or a phrase"
            type="search"
            value={query}
          />
        </div>
      </div>

      <p className="search-panel__summary">
        {normalizedQuery
          ? `${filteredPosts.length} ranked result(s) for "${deferredQuery.trim()}".`
          : `${filteredPosts.length} published post(s) available.`}
      </p>

      <div className="search-results">
        {filteredPosts.length ? (
          filteredPosts.map((post) => (
            <Link
              className="search-result"
              href={`/posts/${post.slug}`}
              key={post.id}
              onClick={() =>
                trackGoogleAnalyticsEvent("select_content", {
                  content_type: "post",
                  item_id: post.slug,
                  item_name: post.title,
                  search_term: deferredQuery.trim(),
                })
              }
            >
              <div className="search-result__meta">
                {post.displayDate} | {post.readingMinutes} min read
              </div>
              <div className="search-result__title">{post.title}</div>
              {post.series ? (
                <div className="search-result__series">Series: {post.series}</div>
              ) : null}
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </Link>
          ))
        ) : (
          <div className="empty-card">
            <p className="eyebrow">No matches</p>
            <h2>Nothing matched this search yet.</h2>
            <p>Try a simpler keyword, a tag, or browse one of the recent posts below.</p>
            <div className="search-results search-results--compact">
              {suggestedPosts.map((post) => (
                <Link className="search-result" href={`/posts/${post.slug}`} key={post.id}>
                  <div className="search-result__meta">
                    {post.displayDate} | {post.readingMinutes} min read
                  </div>
                  <div className="search-result__title">{post.title}</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
