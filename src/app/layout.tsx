import type { Metadata } from "next"
import Image from "next/image"
import localFont from "next/font/local"
import Link from "next/link"
import { GoogleAnalytics } from "@/components/google-analytics"
import { ThemeToggle } from "@/components/theme-toggle"
import { VisitorTracker } from "@/components/visitor-tracker"
import "./globals.css"
import { gaMeasurementId } from "@/lib/google-analytics"
import {
  absoluteUrl,
  siteBrandIcon,
  siteDescription,
  siteKeywords,
  siteName,
  siteUrl,
} from "@/lib/site"

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: siteKeywords,
  other: {
    "google-adsense-account": "ca-pub-9527227465279219",
  },
  alternates: {
    canonical: absoluteUrl(),
  },
  icons: {
    icon: [
      { url: "/site-icon.png", type: "image/png" },
      { url: "/site-icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/site-icon.png", type: "image/png" }],
    shortcut: ["/site-icon.png"],
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
      <body className={`${pretendard.variable} ${pretendard.className}`}>
        <GoogleAnalytics measurementId={gaMeasurementId} />
        <VisitorTracker />
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
                <span className="site-brand__eyebrow">
                  <Image
                    alt={`${siteName} icon`}
                    height={30}
                    priority
                    src={siteBrandIcon}
                    width={30}
                  />
                </span>
                <strong>{siteName}</strong>
              </Link>

              <nav className="site-nav" aria-label="Main navigation">
                <ThemeToggle />
                <Link href="/">HOME</Link>
                <Link href="/about">ABOUT</Link>
                <Link href="/archive">ARCHIVE</Link>
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
