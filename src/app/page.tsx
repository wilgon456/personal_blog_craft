import Link from "next/link"
import { HomeFeed } from "@/components/home-feed"
import { getPublishedPosts } from "@/lib/posts-data"
import { getTagSummaries } from "@/lib/posts"
import {
  absoluteUrl,
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

function ContactIcon({ kind }: { kind: "github" | "instagram" }) {
  if (kind === "github") {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="20"
        viewBox="0 0 24 24"
        width="20"
      >
        <path
          d="M12 2C6.48 2 2 6.59 2 12.24c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.27 9.27 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.24C22 6.59 17.52 2 12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <rect
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.8"
        width="14"
        x="5"
        y="5"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.7" cy="7.3" fill="currentColor" r="1.1" />
    </svg>
  )
}

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const tagSummaries = getTagSummaries(posts).slice(0, 20)
  const initials = siteAuthorName.slice(0, 2).toUpperCase()
  const startedYear = 2026
  const currentYear = new Date().getFullYear()

  return (
    <section className="home-shell">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([websiteJsonLd, personJsonLd]),
        }}
        type="application/ld+json"
      />

      <HomeFeed
        authorName={siteAuthorName}
        description={siteDescription}
        initials={initials}
        posts={posts}
        tagSummaries={tagSummaries}
      />

      <aside className="home-right">
        <section className="home-right-group">
          <div className="panel home-right-card">
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
          </div>
        </section>

        <section className="home-right-group">
          <div className="panel home-right-card">
            <p className="home-panel-heading">Service</p>
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
          <div className="panel home-right-card">
            <p className="home-panel-heading">Contact</p>
            <div className="home-contact-list">
              <a href="https://github.com/wilgon456" rel="noreferrer" target="_blank">
                <span className="home-contact-item">
                  <span className="home-contact-icon">
                    <ContactIcon kind="github" />
                  </span>
                  <span>github</span>
                </span>
              </a>
              {siteAuthorUrl ? (
                <a href={siteAuthorUrl} rel="noreferrer" target="_blank">
                  <span className="home-contact-item">
                    <span className="home-contact-icon">
                      <ContactIcon kind="instagram" />
                    </span>
                    <span>instagram</span>
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="home-right-group home-right-footer">
          <p className="home-copyright">
            ⓒ Copyright {startedYear === currentYear ? currentYear : `${startedYear}-${currentYear}`}. Tuchi. All rights reserved.
          </p>
        </section>
      </aside>
    </section>
  )
}
