import type { Metadata } from "next"
import { Manrope, Newsreader } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import {
  siteAuthorName,
  siteAuthorUrl,
  siteDescription,
  siteName,
  siteUrl,
} from "@/lib/site"

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
})

const displayFont = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="site-frame">
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="site-brand" href="/">
                <span className="site-brand__eyebrow">Craft CMS blog</span>
                <strong>{siteName}</strong>
              </Link>

              <nav className="site-nav" aria-label="Main navigation">
                <Link href="/">Home</Link>
                <Link href="/archive">Archive</Link>
                <Link href="/search">Search</Link>
                {siteAuthorUrl ? (
                  <a href={siteAuthorUrl} rel="noreferrer" target="_blank">
                    About
                  </a>
                ) : (
                  <span className="site-nav__muted">{siteAuthorName}</span>
                )}
              </nav>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer__inner">
              <p>
                {siteName} is built with Craft as the writing space and Next.js
                as the static blog engine.
              </p>
              <p>
                <span>{new Date().getFullYear()}</span>
                <span>{siteAuthorName}</span>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
