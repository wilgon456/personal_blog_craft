"use client"

import { useRouter } from "next/navigation"

type BackLinkProps = {
  fallbackHref?: string
}

export function BackLink({ fallbackHref = "/" }: BackLinkProps) {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <button className="tag-back-link" onClick={handleBack} type="button">
      {"< back"}
    </button>
  )
}
