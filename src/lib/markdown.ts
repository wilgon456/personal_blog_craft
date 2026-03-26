import { marked } from "marked"
import sanitizeHtml from "sanitize-html"
import { normalizeCraftMarkdown } from "@/lib/craft-format"

marked.setOptions({
  breaks: true,
  gfm: true,
})

const allowedTagSet = new Set([
  ...sanitizeHtml.defaults.allowedTags,
  "div",
  "img",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "mark",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
])

const allowedClassMap = {
  div: [
    "craft-callout",
    "craft-block-group",
    /^craft-block-group--depth-\d+$/,
  ],
  mark: [
    "craft-highlight",
    /^craft-highlight--[a-z0-9-]+$/,
  ],
  p: ["craft-caption"],
}

export function renderMarkdownFragment(markdown: string) {
  return marked.parse(normalizeCraftMarkdown(markdown || "")) as string
}

export function sanitizeRenderedHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [...allowedTagSet],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      div: ["class"],
      img: ["src", "alt", "title"],
      mark: ["class"],
      p: ["class"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedClasses: allowedClassMap,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
  })
}

function injectImageAttribute(tag: string, attribute: string, value: string) {
  if (new RegExp(`\\s${attribute}=`, "i").test(tag)) {
    return tag
  }

  return tag.replace("<img", `<img ${attribute}="${value}"`)
}

export function optimizeRenderedHtml(html: string) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let optimizedTag = injectImageAttribute(tag, "loading", "lazy")
    optimizedTag = injectImageAttribute(optimizedTag, "decoding", "async")

    return optimizedTag
  })
}

export function markdownToHtml(markdown: string) {
  return optimizeRenderedHtml(sanitizeRenderedHtml(renderMarkdownFragment(markdown)))
}
