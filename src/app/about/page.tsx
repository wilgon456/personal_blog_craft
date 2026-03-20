/* eslint-disable @next/next/no-img-element */
import { renderCraftBlocksToHtml } from "@/lib/craft"
import { getAboutPage } from "@/lib/pages"
import { getSiteProfile } from "@/lib/profile"
import { stringifyForInlineScript } from "@/lib/safe-json"
import {
  absoluteUrl,
  siteAuthorName,
  siteAuthorUrl,
  siteName,
} from "@/lib/site"
import Link from "next/link"
import { notFound } from "next/navigation"

export async function generateMetadata() {
  const page = await getAboutPage()

  if (!page) {
    return {
      title: "About",
    }
  }

  return {
    title: page.seoTitle || "About",
    description: page.seoDescription,
    alternates: {
      canonical: absoluteUrl("about/"),
    },
    openGraph: {
      title: page.seoTitle || "About",
      description: page.seoDescription,
      url: absoluteUrl("about/"),
      type: "profile",
      images: page.heroImage ? [{ url: page.heroImage }] : undefined,
    },
    twitter: {
      card: page.heroImage ? "summary_large_image" : "summary",
      title: page.seoTitle || "About",
      description: page.seoDescription,
      images: page.heroImage ? [page.heroImage] : undefined,
    },
  }
}

export default async function AboutPage() {
  const page = await getAboutPage()
  const profile = await getSiteProfile()

  if (!page) {
    notFound()
  }

  const html = renderCraftBlocksToHtml(page.contentBlocks)
  const updatedLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(page.updatedAt))
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteAuthorName,
    url: siteAuthorUrl || absoluteUrl("about/"),
    description: page.seoDescription,
    image: page.heroImage || absoluteUrl(profile.profileImage),
  }

  return (
    <section className="about-page" id="top">
      <script
        dangerouslySetInnerHTML={{
          __html: stringifyForInlineScript(personJsonLd),
        }}
        type="application/ld+json"
      />

      <article className="about-shell">
        <div className="about-shell__eyebrow">About</div>
        <header className="about-header">
          <div className="about-header__content">
            <h1>{page.title}</h1>
            <div className="about-meta">
              <span>{siteAuthorName}</span>
              <span>{updatedLabel}</span>
              <span>{siteName}</span>
            </div>
          </div>

          <div className="about-portrait">
            <img alt={page.title} src={page.heroImage || profile.profileImage} />
          </div>
        </header>

        <div
          className="article-body about-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <nav className="about-nav" aria-label="About navigation">
          <Link href="/">{`< Back`}</Link>
          <a href="#top">Top</a>
        </nav>
      </article>
    </section>
  )
}
