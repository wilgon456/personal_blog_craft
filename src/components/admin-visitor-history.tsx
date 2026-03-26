"use client"

import { useEffect, useMemo, useState } from "react"
import {
  buildVisitorApiUrl,
  type VisitorCountPayload,
  type VisitorHistoryPayload,
  visitorCountEventName,
} from "@/lib/visitor-api"

type AdminVisitorHistoryProps = {
  days?: number
  endpoint: string
}

const numberFormatter = new Intl.NumberFormat("en-US")

export function AdminVisitorHistory({
  days = 14,
  endpoint,
}: AdminVisitorHistoryProps) {
  const [data, setData] = useState<VisitorHistoryPayload | null>(null)
  const [status, setStatus] = useState<"error" | "loading" | "ready">("loading")

  useEffect(() => {
    const controller = new AbortController()

    function handleVisitorCountUpdate(event: Event) {
      const customEvent = event as CustomEvent<VisitorCountPayload>
      const nextCount = customEvent.detail.count

      if (typeof nextCount !== "number") {
        return
      }

      setData((currentData) => {
        if (!currentData) {
          return currentData
        }

        const nextHistory = currentData.history.map((entry, index) =>
          index === currentData.history.length - 1
            ? {
                ...entry,
                count: nextCount,
              }
            : entry,
        )

        return {
          ...currentData,
          history: nextHistory,
          todayCount: nextCount,
          totalCount: nextHistory.reduce((sum, entry) => sum + entry.count, 0),
        }
      })
    }

    async function loadHistory() {
      try {
        const response = await fetch(
          buildVisitorApiUrl(endpoint, window.location.origin, {
            days,
            mode: "history",
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
          throw new Error(`Failed to load visitor history: ${response.status}`)
        }

        const payload = (await response.json()) as VisitorHistoryPayload

        setData(payload)
        setStatus("ready")
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setStatus("error")
      }
    }

    window.addEventListener(visitorCountEventName, handleVisitorCountUpdate)
    loadHistory()

    return () => {
      controller.abort()
      window.removeEventListener(visitorCountEventName, handleVisitorCountUpdate)
    }
  }, [days, endpoint])

  const maxCount = useMemo(() => {
    if (!data?.history.length) {
      return 0
    }

    return Math.max(...data.history.map((entry) => entry.count), 1)
  }, [data])

  if (status === "loading") {
    return <p className="admin-visitor-empty">Loading visitor history...</p>
  }

  if (status === "error" || !data) {
    return (
      <p className="admin-visitor-empty">
        Visitor history is unavailable right now. Check the Cloudflare Worker route.
      </p>
    )
  }

  return (
    <div className="admin-visitor-panel">
      <div className="admin-visitor-summary">
        <div className="admin-visitor-summary__item">
          <span className="home-panel-heading">Today</span>
          <strong>{numberFormatter.format(data.todayCount)}</strong>
        </div>
        <div className="admin-visitor-summary__item">
          <span className="home-panel-heading">Last {data.days} days</span>
          <strong>{numberFormatter.format(data.totalCount)}</strong>
        </div>
      </div>

      <div className="admin-visitor-chart" role="list" aria-label="Daily visitors">
        {data.history.map((entry) => (
          <div className="admin-visitor-chart__item" key={entry.dateKey} role="listitem">
            <div
              className="admin-visitor-chart__bar"
              style={{
                height: `${Math.max((entry.count / maxCount) * 100, entry.count > 0 ? 12 : 4)}%`,
              }}
              title={`${entry.dateKey}: ${entry.count}`}
            />
            <span className="admin-visitor-chart__count">{entry.count}</span>
            <span className="admin-visitor-chart__date">{entry.dateKey.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
