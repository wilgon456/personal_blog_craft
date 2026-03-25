/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next"
import { ContactIcon } from "@/components/contact-icon"
import { HomeFeed } from "@/components/home-feed"
import { TodayVisitorCount } from "@/components/today-visitor-count"
import { getContactLinks } from "@/lib/contacts"
import { getPublishedPosts } from "@/lib/posts-data"
import { getSiteProfile } from "@/lib/profile"
import { stringifyForInlineScript } from "@/lib/safe-json"
import {
  absoluteUrl,
  siteDescription,
  siteName,
  siteUrl,
} from "@/lib/site"
import { visitorApiEndpoint } from "@/lib/visitor-api"

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
  name: "",
  url: siteUrl,
  image: "",
}

export const metadata: Metadata = {
  other: {
    "naver-site-verification": "aa1113495e97be161452c2ef2d4435c5a3104a61",
  },
}

export default async function HomePage() {
  const posts = await getPublishedPosts()
  const profile = await getSiteProfile()
  const contacts = await getContactLinks()
  const startedYear = 2026
  const currentYear = new Date().getFullYear()
  const personJsonLdData = {
    ...personJsonLd,
    name: profile.displayName,
    image: absoluteUrl(profile.profileImage),
  }

  return (
    <section className="home-shell">
      <script
        dangerouslySetInnerHTML={{
          __html: stringifyForInlineScript([websiteJsonLd, personJsonLdData]),
        }}
        type="application/ld+json"
      />

      <HomeFeed posts={posts} profile={profile} />

      <aside className="home-right">
        <section className="home-right-group">
          <div className="panel home-right-card">
            <p className="home-panel-heading">I am</p>
            <div className="home-profile">
              <div className="home-avatar">
                <img alt={profile.displayName} src={profile.profileImage} />
              </div>
              <div className="home-profile__content">
                <div className="home-profile__name">{profile.displayName}</div>
                <div className="home-profile__role">{profile.role}</div>
                <p className="profile-card__bio" style={{ marginTop: "0.55rem" }}>
                  {profile.bio}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-right-group home-right-group--spaced">
          <div className="panel home-right-card">
            <p className="home-panel-heading">Contact</p>
            <div className="home-contact-list">
              {contacts.map((contact) => (
                <a href={contact.url} key={contact.id} rel="noreferrer" target="_blank">
                  <span className="home-contact-item">
                    <span className="home-contact-icon">
                      <ContactIcon kind={contact.icon} />
                    </span>
                    <span>{contact.label}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="home-right-group home-right-group--spaced">
          <div className="panel home-right-card">
            <p className="home-panel-heading">Today</p>
            <TodayVisitorCount endpoint={visitorApiEndpoint} />
          </div>
        </section>

        <section className="home-right-group home-right-footer">
          <p className="home-copyright">
            Copyright {startedYear === currentYear ? currentYear : `${startedYear}-${currentYear}`}. Tuchi
          </p>
        </section>
      </aside>
    </section>
  )
}
