"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"
import {
  getCountapiUrl,
  getDateKey,
  type VisitorApiResponse,
  visitorCountEventName,
} from "@/lib/visitor-api"

/**
 * 페이지 방문 시 countapi.xyz의 hit 엔드포인트를 호출해 카운트를 올리고,
 * 응답으로 받은 최신 방문자 수를 커스텀 이벤트로 broadcast 합니다.
 *
 * TodayVisitorCount 컴포넌트가 이 이벤트를 수신해 화면을 업데이트합니다.
 */
export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const controller = new AbortController()

    async function trackVisitor() {
      try {
        const response = await fetch(getCountapiUrl("track"), {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
          keepalive: true,
          signal: controller.signal,
        })

        if (!response.ok) {
          return
        }

        const data = (await response.json()) as { value: number }

        const payload: VisitorApiResponse = {
          counted: true,
          count: data.value,
          dateKey: getDateKey(),
          scope: "site",
        }

        window.dispatchEvent(
          new CustomEvent<VisitorApiResponse>(visitorCountEventName, {
            detail: payload,
          }),
        )
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
  }, [pathname])

  return null
}
