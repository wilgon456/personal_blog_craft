import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import "./globals.css"
import {
  absoluteUrl,
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const storedTheme = localStorage.getItem("tuchiz-theme");
                if (storedTheme === "light" || storedTheme === "dark") {
                  document.documentElement.dataset.theme = storedTheme;
                }
              } catch (error) {}
            })();`,
          }}
        />
        <div className="site-frame">
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="site-brand" href="/">
                <span className="site-brand__eyebrow">TL</span>
                <strong>{siteName}</strong>
              </Link>

              <nav className="site-nav" aria-label="Main navigation">
                <Link href="/">HOME</Link>
                <ThemeToggle />
                <Link href="/about">ABOUT</Link>
              </nav>
            </div>
          </header>

          <main className="site-main">{children}</main>

          <footer className="site-footer" />
        </div>
      </body>
    </html>
  )
}
