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

function blockToMarkdown(block: CraftBlock) {
  const markdown = block.markdown?.trim()

  if (markdown) {
    return markdown
  }

  if (block.type === "image" && block.url) {
    const altText = escapeMarkdownText(
      block.altText?.trim() || block.fileName?.trim() || "Image",
    )

    return `![${altText}](${block.url})`
  }

  if (block.type === "file" && block.url) {
    const fileName = escapeMarkdownText(block.fileName?.trim() || "Attachment")
    return `[${fileName}](${block.url})`
  }

  return ""
}

export function flattenCraftBlocks(blocks: CraftBlock[] = []): string {
  return blocks
    .flatMap((block) => {
      const current = blockToMarkdown(block)
      const currentParts = current ? [current] : []
      const children = block.content ? [flattenCraftBlocks(block.content)] : []
      return [...currentParts, ...children]
    })
    .filter(Boolean)
    .join("\n\n")
}
