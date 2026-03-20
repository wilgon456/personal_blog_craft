import Link from "next/link"

type BackLinkProps = {
  fallbackHref?: string
}

export function BackLink({ fallbackHref = "/" }: BackLinkProps) {
  return (
    <Link className="tag-back-link" href={fallbackHref}>
      {"< back"}
    </Link>
  )
}
