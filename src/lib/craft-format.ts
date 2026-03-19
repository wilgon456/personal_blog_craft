const highlightTagPattern =
  /<highlight(?:\s+color=["']?([^"'>\s]+)["']?)?\s*>([\s\S]*?)<\/highlight>/gi

function sanitizeClassToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "")
}

export function normalizeCraftMarkdown(markdown: string) {
  if (!markdown) {
    return ""
  }

  return markdown.replace(highlightTagPattern, (_match, color: string, content: string) => {
    const token = sanitizeClassToken(color || "")
    const className = token
      ? `craft-highlight craft-highlight--${token}`
      : "craft-highlight"

    return `<mark class="${className}">${content.trim()}</mark>`
  })
}

export function stripHtmlTags(text: string) {
  return text.replace(/<[^>]+>/g, " ")
}
