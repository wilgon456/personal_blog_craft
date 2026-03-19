import { marked } from "marked"
import { normalizeCraftMarkdown } from "@/lib/craft-format"

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function markdownToHtml(markdown: string) {
  return marked.parse(normalizeCraftMarkdown(markdown || "")) as string
}
