"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect } from "react"

type GoogleAnalyticsProps = {
  measurementId: string
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!measurementId) {
      return
    }

    const search = window.location.search.replace(/^\?/, "")
    const pagePath = search ? `${pathname}?${search}` : pathname
    let isCancelled = false

    const sendPageView = () => {
      if (isCancelled) {
        return
      }

      if (typeof window.gtag !== "function") {
        window.setTimeout(sendPageView, 250)
        return
      }

      window.gtag("event", "page_view", {
        page_location: window.location.href,
        page_path: pagePath,
        page_title: document.title,
        send_to: measurementId,
      })
    }

    sendPageView()

    return () => {
      isCancelled = true
    }
  }, [measurementId, pathname])

  if (!measurementId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}
