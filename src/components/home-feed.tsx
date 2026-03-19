"use client"

import Link from "next/link"
import { startTransition, useMemo, useRef, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { PostCard } from "@/components/post-card"
import {
  ALL_CATEGORY_KEY,
  filterPostsByCategory,
  getCategorySummaries,
  getLatestPosts,
  getTagSummaries,
  sortPostsByDate,
} from "@/lib/posts"
import { basePath } from "@/lib/site"
import type { BlogPost } from "@/types/post"

type HomeFeedProps = {
  authorName: string
  description: string
  initials: string
  posts: BlogPost[]
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function SortArrowIcon({ direction }: { direction: "asc" | "desc" }) {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d={direction === "desc" ? "M8 3v10m0 0-3-3m3 3 3-3" : "M8 13V3m0 0-3 3m3-3 3 3"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function SortButton({
  direction,
  onClick,
}: {
  direction: "asc" | "desc"
  onClick: () => void
}) {
  return (
    <button
      aria-label={direction === "desc" ? "Switch to oldest first" : "Switch to newest first"}
      className="home-sort-icon is-active"
      onClick={onClick}
      title={direction === "desc" ? "Newest first" : "Oldest first"}
      type="button"
    >
      <SortArrowIcon direction={direction} />
    </button>
  )
}

export function HomeFeed({
  authorName,
  description,
  initials,
  posts,
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
  const filteredTagSummaries = useMemo(
    () => getTagSummaries(filteredPosts).slice(0, 20),
    [filteredPosts],
  )
  const latestPosts = getLatestPosts(filteredPosts, 12)

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
            placeholder="Search keyword..."
            type="search"
          />
        </form>
      </section>

      <section className="home-feed-shell">
        <div className="home-feed-header">
          <div className="home-feed-title-wrap">
            <details className="home-dropdown" ref={dropdownRef}>
              <summary className="home-dropdown__summary">
                <span className="home-feed-title">
                  {currentCategory?.label ?? "All"} Posts
                </span>
                <span className="home-dropdown__chevron">
                  <ChevronDownIcon />
                </span>
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
            {filteredTagSummaries.length ? (
              <div className="home-mobile-tags home-tags-strip">
                <span className="home-mobile-tags__label">Browse tags</span>
                {filteredTagSummaries.map((tag) => (
                  <Link className="tag-pill" href={`/tags/${tag.key}`} key={tag.key}>
                    {tag.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="home-feed-toolbar">
            <div className="home-feed-header__actions">
              <SortButton
                direction={currentOrder}
                onClick={() =>
                  updateQuery({ order: currentOrder === "desc" ? "asc" : "desc" })
                }
              />
            </div>
          </div>
        </div>

        {latestPosts.length ? (
          <div className="post-list">
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No posts in this category yet"
            description="Choose another category or publish a post with this category in Craft."
          />
        )}
      </section>
    </div>
  )
}
