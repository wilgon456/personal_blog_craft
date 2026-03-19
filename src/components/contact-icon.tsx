type ContactIconKind = "github" | "instagram" | "linkedin" | "email" | "link"

export function ContactIcon({ kind }: { kind: ContactIconKind }) {
  if (kind === "github") {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M12 2C6.48 2 2 6.59 2 12.24c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-1.03-.01-1.87-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.27 9.27 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.39-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.24C22 6.59 17.52 2 12 2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (kind === "instagram") {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <rect
          height="14"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
          width="14"
          x="5"
          y="5"
        />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.7" cy="7.3" fill="currentColor" r="1.1" />
      </svg>
    )
  }

  if (kind === "linkedin") {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M7 8.5A1.5 1.5 0 1 0 7 5.5a1.5 1.5 0 0 0 0 3ZM5.75 10.25h2.5v8h-2.5zm4.5 0h2.4v1.1h.03c.34-.64 1.16-1.31 2.39-1.31 2.56 0 3.03 1.68 3.03 3.86v4.35h-2.5v-3.86c0-.92-.02-2.1-1.28-2.1-1.28 0-1.48 1-1.48 2.03v3.93h-2.5z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (kind === "email") {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M4 7.5h16v9H4zm0 0 8 5 8-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M10 14a4 4 0 0 1 0-5.66l2.34-2.34a4 4 0 1 1 5.66 5.66L16 13.66m-2 2-2.34 2.34A4 4 0 1 1 6 12.34L8 10.34"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export type { ContactIconKind }
