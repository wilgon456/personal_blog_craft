"use client"

import { useEffect, useState } from "react"
import {
  getCountapiUrl,
  type VisitorApiResponse,
  visitorCountEventName,
} from "@/lib/visitor-api"

/**
 * countapi.xyz에서 누적 방문자 수를 가져와 화면에 표시합니다.
 *
 * 1. 컴포넌트 마운트 시 GET 요청으로 현재 카운트를 불러옵니다.
 * 2. VisitorTracker 컴포넌트가 방문 추적 후 발행하는 커스텀 이벤트를 수신해
 *    실시간으로 수치를 최신 값으로 갱신합니다.
 */
const numberFormatter = new Intl.NumberFormat("en-US")

export function TodayVisitorCount() {
  const [count, setCount] = useState<number | null>(null)
  const [status, setStatus] = useState<"error" | "loading" | "ready">("loading")

  useEffect(() => {
    const controller = new AbortController()

    function handleVisitorCountUpdate(event: Event) {
      const customEvent = event as CustomEvent<VisitorApiResponse>
      setCount(customEvent.detail.count)
      setStatus("ready")
    }

    async function loadVisitorCount() {
      try {
        const response = await fetch(getCountapiUrl("read"), {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load visitor count: ${response.status}`)
        }

        const data = (await response.json()) as { value: number }
        setCount(data.value)
        setStatus("ready")
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setStatus("error")
      }
    }

    window.addEventListener(visitorCountEventName, handleVisitorCountUpdate)
    loadVisitorCount()

    return () => {
      controller.abort()
      window.removeEventListener(visitorCountEventName, handleVisitorCountUpdate)
    }
  }, [])

  const value =
    status === "ready" && count !== null
      ? numberFormatter.format(count)
      : status === "error"
        ? "--"
        : "..."

  const caption =
    status === "ready"
      ? "total visitors"
      : status === "error"
        ? "visitor data unavailable"
        : "counting visitors"

  return (
    <div className="home-today-card">
      <strong aria-live="polite" className="home-today-card__value">
        {value}
      </strong>
      <p className="home-today-card__caption">{caption}</p>
    </div>
  )
}
