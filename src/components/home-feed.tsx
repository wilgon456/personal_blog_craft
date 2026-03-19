"use client"

import { EmptyState } from "@/components/empty-state"
import { PostCard } from "@/components/post-card"
import {
  ALL_CATEGORY_KEY,
  countUniqueTags,
  filterPostsByCategory,
  getCategorySummaries,
  getLatestPosts,
  sortPostsByDate,
} from "@/lib/posts"
import { basePath } from "@/lib/site"
import type { BlogPost } from "@/types/post"
import Link from "next/link"
import { startTransition, useMemo, useRef, useState } from "react"

type TagSummary = {
  label: string
  count: number
  key: string
}

type HomeFeedProps = {
  authorName: string
  description: string
  initials: string
  posts: BlogPost[]
  tagSummaries: TagSummary[]
}

function SortButton({
  active = false,
  direction,
  onClick,
}: {
  active?: boolean
  direction: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      aria-label={direction === "desc" ? "Newest first" : "Oldest first"}
      className={`home-sort-icon${active ? " is-active" : ""}`}
      onClick={onClick}
      title={direction === "desc" ? "Newest first" : "Oldest first"}
      type="button"
    >
      {direction === "desc" ? "↓" : "↑"}
    </button>
  )
}

export function HomeFeed({
  authorName,
  description,
  initials,
  posts,
  tagSummaries,
}: HomeFeedProps) {
  const dropdownRef = useRef<HTMLDetailsElement>(null)
  const [currentOrder, setCurrentOrder] = useState<"asc" | "desc">(() => {
    if (typeof window === "undefined") {
      return "desc"
    }

    const params = new URLSearchParams(window.location.search)
    return params.get("order") === "asc" ? "asc" : "desc"
  })
  const [currentCategoryKey, setCurrentCategoryKey] = useState(() => {
    if (typeof window === "undefined") {
      return ALL_CATEGORY_KEY
    }

    const params = new URLSearchParams(window.location.search)
    return params.get("category") ?? ALL_CATEGORY_KEY
  })
  const categorySummaries = useMemo(() => getCategorySummaries(posts), [posts])
  const currentCategory =
    categorySummaries.find((category) => category.key === currentCategoryKey) ??
    categorySummaries[0]
  const filteredPosts = useMemo(() => {
    return sortPostsByDate(
      filterPostsByCategory(posts, currentCategory?.key ?? ALL_CATEGORY_KEY),
      currentOrder,
    )
  }, [currentCategory?.key, currentOrder, posts])
  const latestPosts = getLatestPosts(filteredPosts, 12)
  const featuredPost = latestPosts[0] ?? null
  const feedPosts = featuredPost ? latestPosts.slice(1) : latestPosts

  function syncUrl(categoryKey: string, order: "asc" | "desc") {
    if (typeof window === "undefined") {
      return
    }

    const url = new URL(window.location.href)

    if (categoryKey === ALL_CATEGORY_KEY) {
      url.searchParams.delete("category")
    } else {
      url.searchParams.set("category", categoryKey)
    }

    if (order === "desc") {
      url.searchParams.delete("order")
    } else {
      url.searchParams.set("order", order)
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  }

  function updateQuery(next: { category?: string; order?: "asc" | "desc" }) {
    const nextCategory = next.category ?? currentCategoryKey
    const nextOrder = next.order ?? currentOrder

    startTransition(() => {
      setCurrentCategoryKey(nextCategory)
      setCurrentOrder(nextOrder)
      syncUrl(nextCategory, nextOrder)
    })
  }

  function selectCategory(categoryKey: string) {
    dropdownRef.current?.removeAttribute("open")
    updateQuery({ category: categoryKey })
  }

  return (
    <div className="home-center">
      <section className="home-mobile-profile">
        <p className="home-panel-heading">Profile</p>
        <div className="home-profile">
          <div className="home-avatar">{initials}</div>
          <div className="home-profile__content">
            <div className="home-profile__name">{authorName}</div>
            <div className="home-profile__role">frontend developer</div>
            <p className="profile-card__bio" style={{ marginTop: "0.55rem" }}>
              {description}
            </p>
          </div>
        </div>
      </section>

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

      <div className="home-mobile-tags home-tags-strip">
        <span className="home-mobile-tags__label">🏷️ Tags</span>
        {tagSummaries.map((tag) => (
          <Link className="tag-pill" href={`/tags/${tag.key}`} key={tag.key}>
            {tag.label}
          </Link>
        ))}
      </div>

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
              {featuredPost.category ? (
                <span className="featured-post__tag">{featuredPost.category}</span>
              ) : featuredPost.tags[0] ? (
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

      <div className="home-feed-header">
        <div className="home-feed-title-wrap">
          <details className="home-dropdown" ref={dropdownRef}>
            <summary className="home-dropdown__summary">
              <span className="home-feed-title">
                {currentCategory?.label ?? "All"} Posts
              </span>
              <span className="home-dropdown__chevron">⌄</span>
            </summary>
            <div className="home-dropdown__menu">
              {categorySummaries.map((category) => (
                <button
                  className={`home-dropdown__item${
                    category.key === currentCategory?.key ? " is-active" : ""
                  }`}
                  key={category.key}
                  onClick={() => selectCategory(category.key)}
                  type="button"
                >
                  <span>{category.label}</span>
                  <span>{category.count}</span>
                </button>
              ))}
            </div>
          </details>
          <p>
            {filteredPosts.length} posts, {countUniqueTags(filteredPosts)} tags
          </p>
        </div>
        <div className="home-feed-header__actions">
          <SortButton
            active={currentOrder === "desc"}
            direction="desc"
            onClick={() => updateQuery({ order: "desc" })}
          />
          <SortButton
            active={currentOrder === "asc"}
            direction="asc"
            onClick={() => updateQuery({ order: "asc" })}
          />
        </div>
      </div>

      {latestPosts.length ? (
        <div className="post-list">
          {feedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No posts in this category yet"
          description="Choose another category or publish a post with this category in Craft."
        />
      )}
    </div>
  )
}
