"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import {
  buildVisitorApiUrl,
  type VisitorCountPayload,
  visitorCountEventName,
} from "@/lib/visitor-api"

type VisitorTrackerProps = {
  endpoint: string
}

export function VisitorTracker({ endpoint }: VisitorTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    const controller = new AbortController()

    async function trackVisitor() {
      try {
        const response = await fetch(
          buildVisitorApiUrl(endpoint, window.location.origin, {
            mode: "track",
          }),
          {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            keepalive: true,
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as VisitorCountPayload

        if (typeof payload.count === "number") {
          window.dispatchEvent(
            new CustomEvent<VisitorCountPayload>(visitorCountEventName, {
              detail: payload,
            }),
          )
        }
      } catch {
        if (controller.signal.aborted) {
          return
        }
      }
    }

    trackVisitor()

    return () => {
      controller.abort()
    }
  }, [endpoint, pathname])

  return null
}
