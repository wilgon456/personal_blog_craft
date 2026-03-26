export const gaMeasurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackGoogleAnalyticsEvent(
  eventName: string,
  parameters: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return
  }

  if (typeof window.gtag !== "function") {
    return
  }

  window.gtag("event", eventName, parameters)
}
