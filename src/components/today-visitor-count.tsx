"use client"

import { useEffect, useState } from "react"
import {
  buildVisitorApiUrl,
  type VisitorCountPayload,
  visitorCountEventName,
} from "@/lib/visitor-api"

type TodayVisitorCountProps = {
  endpoint: string
}

const numberFormatter = new Intl.NumberFormat("en-US")

export function TodayVisitorCount({ endpoint }: TodayVisitorCountProps) {
  const [count, setCount] = useState<number | null>(null)
  const [status, setStatus] = useState<"error" | "loading" | "ready">("loading")

  useEffect(() => {
    const controller = new AbortController()

    function handleVisitorCountUpdate(event: Event) {
      const customEvent = event as CustomEvent<VisitorCountPayload>
      const nextCount = customEvent.detail.count

      if (typeof nextCount !== "number") {
        return
      }

      setCount(nextCount)
      setStatus("ready")
    }

    async function loadTodayVisitorCount() {
      try {
        const response = await fetch(
          buildVisitorApiUrl(endpoint, window.location.origin, {
            mode: "read",
          }),
          {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to load visitor count: ${response.status}`)
        }

        const payload = (await response.json()) as VisitorCountPayload
        if (typeof payload.count !== "number") {
          throw new Error("Visitor count is unavailable")
        }

        setCount(payload.count)
        setStatus("ready")
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setStatus("error")
      }
    }

    window.addEventListener(visitorCountEventName, handleVisitorCountUpdate)
    loadTodayVisitorCount()

    return () => {
      controller.abort()
      window.removeEventListener(visitorCountEventName, handleVisitorCountUpdate)
    }
  }, [endpoint])

  const value =
    status === "ready" && count !== null
      ? numberFormatter.format(count)
      : status === "error"
        ? "--"
        : "..."

  const caption =
    status === "ready"
      ? "unique visitors today"
      : status === "error"
        ? "visitor data unavailable"
        : "counting today's visitors"

  return (
    <div className="home-today-card">
      <strong aria-live="polite" className="home-today-card__value">
        {value}
      </strong>
      <p className="home-today-card__caption">{caption}</p>
    </div>
  )
}
