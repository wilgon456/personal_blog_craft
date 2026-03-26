import { readFile } from "node:fs/promises"
import path from "node:path"
import { notFound } from "next/navigation"
import {
  optimizeRenderedHtml,
  renderMarkdownFragment,
  sanitizeRenderedHtml,
} from "@/lib/markdown"

type CraftCollection = {
  id: string
  name: string
  itemCount: number
  documentId: string
}

type CraftCollectionItem = {
  id: string
  title?: string
  properties?: Record<string, unknown>
  content?: CraftBlock[]
}

export type CraftBlock = {
  id: string
  type?: string
  markdown?: string
  textStyle?: string
  listStyle?: string
  indentationLevel?: number
  decorations?: string[]
  taskInfo?: {
    isCompleted?: boolean
  }
  url?: string
  altText?: string
  fileName?: string
  content?: CraftBlock[]
}

type ListResponse<T> = {
  items: T[]
}

type CraftCacheSnapshot = {
  generatedAt: string
  collections: CraftCollection[]
  collectionItems: Record<string, CraftCollectionItem[]>
}

const craftApiUrl = process.env.CRAFT_API_URL
const craftCachePath = path.join(process.cwd(), ".cache", "craft-data.json")

function getCraftApiUrl() {
  if (!craftApiUrl) {
    throw new Error("Missing CRAFT_API_URL environment variable.")
  }

  return craftApiUrl
}

async function craftFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${getCraftApiUrl()}${path}`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Craft API request failed: ${response.status} ${path}`)
  }

  return (await response.json()) as T
}

async function readCraftCache() {
  try {
    const snapshot = await readFile(craftCachePath, "utf8")
    return JSON.parse(snapshot) as CraftCacheSnapshot
  } catch {
    return null
  }
}

export async function getCraftCollections() {
  const cachedSnapshot = await readCraftCache()

  if (cachedSnapshot) {
    return cachedSnapshot.collections
  }

  const response = await craftFetch<ListResponse<CraftCollection>>("/collections")
  return response.items
}

export async function getCollectionByName(
  name: string,
  fallbackToFirst = false,
) {
  const collections = await getCraftCollections()
  const matchedCollection = collections.find(
    (collection) => collection.name === name,
  )

  if (matchedCollection) {
    return matchedCollection
  }

  if (fallbackToFirst && collections[0]) {
    return collections[0]
  }

  if (!collections.length) {
    notFound()
  }

  notFound()
}

export async function getPostsCollection() {
  return getCollectionByName("Posts", true)
}

export async function getCraftPostItems() {
  const cachedSnapshot = await readCraftCache()

  if (cachedSnapshot?.collectionItems.Posts) {
    return cachedSnapshot.collectionItems.Posts
  }

  const collection = await getPostsCollection()
  const response = await craftFetch<ListResponse<CraftCollectionItem>>(
    `/collections/${collection.id}/items?maxDepth=3`,
  )

  return response.items
}

export async function getCraftCollectionItems(collectionName: string) {
  const cachedSnapshot = await readCraftCache()

  if (cachedSnapshot?.collectionItems[collectionName]) {
    return cachedSnapshot.collectionItems[collectionName]
  }

  const collection = await getCollectionByName(collectionName)
  const response = await craftFetch<ListResponse<CraftCollectionItem>>(
    `/collections/${collection.id}/items?maxDepth=3`,
  )

  return response.items
}

function escapeMarkdownText(value: string) {
  return value.replace(/[[\]\\]/g, "\\$&")
}

function isHeadingStyle(textStyle?: string) {
  return /^h[1-6]$/i.test(textStyle || "")
}

function getHeadingMarker(textStyle?: string) {
  if (!isHeadingStyle(textStyle)) {
    return ""
  }

  return "#".repeat(Number((textStyle || "").slice(1)))
}

function getHeadingContent(markdown: string) {
  const matched = markdown.match(/^(#{1,6})\s+(.+)$/)

  if (!matched) {
    return null
  }

  return {
    marker: matched[1],
    content: matched[2].trim(),
  }
}

function stripCalloutTag(markdown: string) {
  const matched = markdown.match(/^<callout>\s*([\s\S]*?)\s*<\/callout>$/i)
  return matched ? matched[1].trim() : null
}

function trimCraftIndent(markdown: string, level: number) {
  const craftIndent = "  ".repeat(level)

  return markdown
    .split("\n")
    .map((line) => (line.startsWith(craftIndent) ? line.slice(craftIndent.length) : line))
    .join("\n")
}

function unwrapCraftCallout(markdown: string, block: CraftBlock) {
  const content = stripCalloutTag(markdown)

  if (!content) {
    return markdown
  }

  if (block.listStyle && block.listStyle !== "none") {
    return content
  }

  return content
    .split("\n")
    .map((line) => (line.trim() ? `> ${line}` : ">"))
    .join("\n")
}

function stripListMarker(markdown: string, listStyle?: string) {
  const [firstLine = "", ...restLines] = markdown.split("\n")
  let normalizedFirstLine = firstLine

  if (listStyle === "numbered") {
    normalizedFirstLine = firstLine.replace(/^\d+\.\s+/, "")
  } else if (listStyle === "task") {
    normalizedFirstLine = firstLine.replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
  } else if (listStyle === "bullet" || listStyle === "toggle") {
    normalizedFirstLine = firstLine.replace(/^[-*+]\s+/, "")
  }

  return [normalizedFirstLine, ...restLines].join("\n")
}

function applyListPrefix(markdown: string, block: CraftBlock) {
  const prefix =
    block.listStyle === "numbered"
      ? "1. "
      : block.listStyle === "task"
        ? `- [${block.taskInfo?.isCompleted ? "x" : " "}] `
        : "- "
  const [firstLine = "", ...restLines] = markdown.split("\n")
  const continuationIndent = " ".repeat(prefix.length)

  return [
    `${prefix}${firstLine}`,
    ...restLines.map((line) => (line.trim() ? `${continuationIndent}${line}` : "")),
  ].join("\n")
}

function applyListIndent(markdown: string, level: number) {
  const indent = "    ".repeat(level)

  if (!indent) {
    return markdown
  }

  return markdown
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line}` : ""))
    .join("\n")
}

function normalizeBlockMarkdown(
  markdown: string,
  block: CraftBlock,
  options?: {
    preserveCallout?: boolean
  },
) {
  const trimmed = trimCraftIndent(markdown, block.indentationLevel ?? 0)
  const normalizedStructuralMarkdown =
    options?.preserveCallout && stripCalloutTag(trimmed)
      ? stripCalloutTag(trimmed) || trimmed
      : unwrapCraftCallout(trimmed, block)
  const withoutListMarker = stripListMarker(normalizedStructuralMarkdown, block.listStyle)

  if (block.listStyle === "numbered" && isHeadingStyle(block.textStyle)) {
    return withoutListMarker
  }

  if (block.listStyle && block.listStyle !== "none") {
    return applyListIndent(
      applyListPrefix(withoutListMarker, block),
      block.indentationLevel ?? 0,
    )
  }

  return withoutListMarker
}

function nextNumberedHeadingIndex(
  numberedHeadingIndexes: Map<number, number>,
  level: number,
) {
  for (const key of [...numberedHeadingIndexes.keys()]) {
    if (key > level) {
      numberedHeadingIndexes.delete(key)
    }
  }

  const nextIndex = (numberedHeadingIndexes.get(level) ?? 0) + 1
  numberedHeadingIndexes.set(level, nextIndex)
  return nextIndex
}

function renderNumberedHeading(
  markdown: string,
  block: CraftBlock,
  numberedHeadingIndexes: Map<number, number>,
) {
  const heading = getHeadingContent(markdown)
  const headingMarker = heading?.marker || getHeadingMarker(block.textStyle)
  const headingContent = heading?.content || markdown.trim()

  if (!headingMarker || !headingContent) {
    return markdown
  }

  const indentationLevel = block.indentationLevel ?? 0
  const numberedIndex = nextNumberedHeadingIndex(
    numberedHeadingIndexes,
    indentationLevel,
  )

  return `${headingMarker} ${numberedIndex}. ${headingContent}`
}

function blockToMarkdown(
  block: CraftBlock,
  numberedHeadingIndexes: Map<number, number>,
) {
  const markdown = block.markdown?.replace(/\s+$/, "")

  if (markdown?.trim()) {
    const normalized = normalizeBlockMarkdown(markdown, block)

    if (block.listStyle === "numbered" && isHeadingStyle(block.textStyle)) {
      return renderNumberedHeading(normalized, block, numberedHeadingIndexes)
    }

    return normalized
  }

  if (block.type === "image" && block.url) {
    const altText = escapeMarkdownText(
      block.altText?.trim() || block.fileName?.trim() || "Image",
    )

    return normalizeBlockMarkdown(`![${altText}](${block.url})`, block)
  }

  if (block.type === "file" && block.url) {
    const fileName = escapeMarkdownText(block.fileName?.trim() || "Attachment")
    return normalizeBlockMarkdown(`[${fileName}](${block.url})`, block)
  }

  return ""
}

function isRenderableListBlock(block: CraftBlock) {
  return Boolean(
    block.listStyle &&
      block.listStyle !== "none" &&
      !(block.listStyle === "numbered" && isHeadingStyle(block.textStyle)),
  )
}

function linearizeCraftBlocks(blocks: CraftBlock[] = []): CraftBlock[] {
  return blocks.flatMap((block) => [
    block,
    ...linearizeCraftBlocks(block.content ?? []),
  ])
}

function syncIndentGroups(currentDepth: number, targetDepth: number) {
  const parts: string[] = []
  const normalizedTargetDepth = Math.max(0, Math.min(targetDepth, 5))

  if (normalizedTargetDepth > currentDepth) {
    for (let depth = currentDepth + 1; depth <= normalizedTargetDepth; depth += 1) {
      parts.push(
        `<div class="craft-block-group craft-block-group--depth-${depth}">`,
      )
    }
  } else if (normalizedTargetDepth < currentDepth) {
    for (let depth = currentDepth; depth > normalizedTargetDepth; depth -= 1) {
      parts.push("</div>")
    }
  }

  return {
    html: parts.join(""),
    depth: normalizedTargetDepth,
  }
}

function getRenderableMarkdown(
  block: CraftBlock,
  numberedHeadingIndexes: Map<number, number>,
  options?: {
    preserveCallout?: boolean
  },
) {
  const markdown = block.markdown?.replace(/\s+$/, "")

  if (markdown?.trim()) {
    const normalized = normalizeBlockMarkdown(markdown, block, options)

    if (block.listStyle === "numbered" && isHeadingStyle(block.textStyle)) {
      return renderNumberedHeading(normalized, block, numberedHeadingIndexes)
    }

    return normalized
  }

  if (block.type === "image" && block.url) {
    const altText = escapeMarkdownText(
      block.altText?.trim() || block.fileName?.trim() || "Image",
    )

    return normalizeBlockMarkdown(`![${altText}](${block.url})`, block, options)
  }

  if (block.type === "file" && block.url) {
    const fileName = escapeMarkdownText(block.fileName?.trim() || "Attachment")
    return normalizeBlockMarkdown(`[${fileName}](${block.url})`, block, options)
  }

  return ""
}

export function flattenCraftBlocks(blocks: CraftBlock[] = []): string {
  const parts: string[] = []
  const numberedHeadingIndexes = new Map<number, number>()

  for (const block of blocks) {
    const current = blockToMarkdown(block, numberedHeadingIndexes)
    const children = block.content ? flattenCraftBlocks(block.content) : ""

    if (current || children) {
      parts.push(current && children ? `${current}\n\n${children}` : current || children)
    }
  }

  return parts.join("\n\n")
}

function isCalloutBlock(block: CraftBlock) {
  return Boolean(
    block.decorations?.includes("callout") ||
      (block.markdown && stripCalloutTag(block.markdown)),
  )
}

function renderCalloutGroup(
  blocks: CraftBlock[],
  startIndex: number,
  numberedHeadingIndexes: Map<number, number>,
) {
  const innerHtml: string[] = []
  let index = startIndex

  while (index < blocks.length && isCalloutBlock(blocks[index])) {
    const block = blocks[index]

    if (isRenderableListBlock(block)) {
      const markdownParts = [
        getRenderableMarkdown(block, numberedHeadingIndexes, {
          preserveCallout: true,
        }),
      ]

      while (
        index + 1 < blocks.length &&
        isCalloutBlock(blocks[index + 1]) &&
        isRenderableListBlock(blocks[index + 1])
      ) {
        index += 1
        markdownParts.push(
          getRenderableMarkdown(blocks[index], numberedHeadingIndexes, {
            preserveCallout: true,
          }),
        )
      }

      const listMarkdown = markdownParts.filter(Boolean).join("\n")

      if (listMarkdown) {
        innerHtml.push(renderMarkdownFragment(listMarkdown))
      }
    } else {
      const markdown = getRenderableMarkdown(block, numberedHeadingIndexes, {
        preserveCallout: true,
      })

      if (markdown) {
        innerHtml.push(renderMarkdownFragment(markdown))
      }
    }

    index += 1
  }

  return {
    html: `<div class="craft-callout">${innerHtml.join("")}</div>`,
    nextIndex: index - 1,
  }
}

export function renderCraftBlocksToHtml(blocks: CraftBlock[] = []) {
  const linearBlocks = linearizeCraftBlocks(blocks)
  const htmlParts: string[] = []
  const numberedHeadingIndexes = new Map<number, number>()
  let currentDepth = 0

  for (let index = 0; index < linearBlocks.length; index += 1) {
    const block = linearBlocks[index]

    if (isCalloutBlock(block)) {
      const renderedCallout = renderCalloutGroup(
        linearBlocks,
        index,
        numberedHeadingIndexes,
      )
      htmlParts.push(renderedCallout.html)
      index = renderedCallout.nextIndex
      continue
    }

    const targetDepth = block.indentationLevel ?? 0
    const syncedGroup = syncIndentGroups(currentDepth, targetDepth)

    if (syncedGroup.html) {
      htmlParts.push(syncedGroup.html)
      currentDepth = syncedGroup.depth
    }

    if (isRenderableListBlock(block)) {
      const markdownParts = [getRenderableMarkdown(block, numberedHeadingIndexes)]

      while (index + 1 < linearBlocks.length && isRenderableListBlock(linearBlocks[index + 1])) {
        index += 1
        markdownParts.push(
          getRenderableMarkdown(linearBlocks[index], numberedHeadingIndexes),
        )
      }

      const listMarkdown = markdownParts.filter(Boolean).join("\n")

      if (listMarkdown) {
        htmlParts.push(renderMarkdownFragment(listMarkdown))
      }

      continue
    }

    const markdown = getRenderableMarkdown(block, numberedHeadingIndexes)

    if (markdown) {
      htmlParts.push(renderMarkdownFragment(markdown))
    }
  }

  const closedGroups = syncIndentGroups(currentDepth, 0)

  if (closedGroups.html) {
    htmlParts.push(closedGroups.html)
  }

  return optimizeRenderedHtml(sanitizeRenderedHtml(htmlParts.join("")))
}
