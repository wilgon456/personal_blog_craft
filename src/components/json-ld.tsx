import { stringifyForInlineScript } from "@/lib/safe-json"

type JsonLdProps = {
  data: unknown
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: stringifyForInlineScript(data),
      }}
      type="application/ld+json"
    />
  )
}
