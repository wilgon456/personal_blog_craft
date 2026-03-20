import { readFile } from "node:fs/promises"
import path from "node:path"
import { notFound } from "next/navigation"

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

type CraftBlock = {
  id: string
  type?: string
  markdown?: string
  textStyle?: string
  listStyle?: string
  indentationLevel?: number
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

function trimCraftIndent(markdown: string, level: number) {
  const craftIndent = "  ".repeat(level)

  return markdown
    .split("\n")
    .map((line) => (line.startsWith(craftIndent) ? line.slice(craftIndent.length) : line))
    .join("\n")
}

function unwrapCraftCallout(markdown: string, block: CraftBlock) {
  const matched = markdown.match(/^<callout>\s*([\s\S]*?)\s*<\/callout>$/i)

  if (!matched) {
    return markdown
  }

  const content = matched[1].trim()

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

function applyMarkdownIndent(markdown: string, level: number) {
  const indent = "    ".repeat(level)

  if (!indent) {
    return markdown
  }

  return markdown
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line}` : ""))
    .join("\n")
}

function normalizeBlockMarkdown(markdown: string, block: CraftBlock) {
  const trimmed = trimCraftIndent(markdown, block.indentationLevel ?? 0)
  const normalizedStructuralMarkdown = unwrapCraftCallout(trimmed, block)
  const withoutListMarker = stripListMarker(normalizedStructuralMarkdown, block.listStyle)
  const withListPrefix =
    block.listStyle && block.listStyle !== "none"
      ? applyListPrefix(withoutListMarker, block)
      : withoutListMarker

  return applyMarkdownIndent(withListPrefix, block.indentationLevel ?? 0)
}

function blockToMarkdown(block: CraftBlock) {
  const markdown = block.markdown?.replace(/\s+$/, "")

  if (markdown?.trim()) {
    return normalizeBlockMarkdown(markdown, block)
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

export function flattenCraftBlocks(blocks: CraftBlock[] = []): string {
  const parts: string[] = []

  for (const block of blocks) {
    const current = blockToMarkdown(block)
    const children = block.content ? flattenCraftBlocks(block.content) : ""

    if (current || children) {
      parts.push(current && children ? `${current}\n\n${children}` : current || children)
    }
  }

  return parts.join("\n\n")
}
