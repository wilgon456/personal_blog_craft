import { stripHtmlTags } from "@/lib/craft-format"

export function markdownToPlainText(markdown: string) {
  const withMarkdownStripped = markdown
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\s#{1,6}\s+/g, " ")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/<\/?highlight[^>]*>/gi, " ")
    .replace(/[*_~]/g, "")
    .replace(/&[a-z]+;/gi, " ")

  return stripHtmlTags(withMarkdownStripped)
    .replace(/\s+/g, " ")
    .trim()
}

export function summarizeText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

export function summarizeMarkdown(markdown: string, maxLength: number) {
  return summarizeText(markdownToPlainText(markdown), maxLength)
}
