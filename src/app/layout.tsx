import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import {
  absoluteUrl,
  siteAuthorName,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from "@/lib/site"

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
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
  keywords: siteKeywords,
  alternates: {
    canonical: absoluteUrl(),
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: absoluteUrl(),
    title: siteName,
    description: siteDescription,
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={bodyFont.variable}>
        <div className="site-frame">
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="site-brand" href="/">
                <span className="site-brand__eyebrow">TL</span>
                <strong>{siteName}</strong>
              </Link>

              <nav className="site-nav" aria-label="Main navigation">
                <Link href="/">HOME</Link>
                <Link href="/about">ABOUT</Link>
              </nav>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer">
            <div className="site-footer__inner">
              <p />
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
