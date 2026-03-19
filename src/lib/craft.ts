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
  const markdown = block.markdown?.replace(/\s+$/, "")

  if (markdown?.trim()) {
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

function isListItemMarkdown(markdown: string) {
  return /^\s*(?:[-*+]|\d+\.)\s+/.test(markdown)
}

function isOrderedListItemMarkdown(markdown: string) {
  return /^\s*\d+\.\s+/.test(markdown)
}

function indentMarkdown(markdown: string, spaces = 4) {
  const indent = " ".repeat(spaces)
  return markdown
    .split("\n")
    .map((line) => (line.trim() ? `${indent}${line}` : ""))
    .join("\n")
}

export function flattenCraftBlocks(blocks: CraftBlock[] = []): string {
  const parts: string[] = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const current = blockToMarkdown(block)
    const children = block.content ? flattenCraftBlocks(block.content) : ""

    // Craft 문서에서 번호 섹션의 본문이 같은 레벨 형제 블록으로 내려오는 경우를 흡수한다.
    if (current && isOrderedListItemMarkdown(current)) {
      const sectionChildren: string[] = []

      if (children) {
        sectionChildren.push(children)
      }

      let cursor = index + 1
      while (cursor < blocks.length) {
        const sibling = blocks[cursor]
        const siblingMarkdown = blockToMarkdown(sibling)

        if (siblingMarkdown && isOrderedListItemMarkdown(siblingMarkdown)) {
          break
        }

        const siblingChildren = sibling.content ? flattenCraftBlocks(sibling.content) : ""

        if (siblingMarkdown && siblingChildren) {
          sectionChildren.push(`${siblingMarkdown}\n\n${siblingChildren}`)
        } else if (siblingMarkdown || siblingChildren) {
          sectionChildren.push(siblingMarkdown || siblingChildren)
        }

        cursor += 1
      }

      if (sectionChildren.length) {
        parts.push(`${current}\n${indentMarkdown(sectionChildren.join("\n\n"))}`)
      } else {
        parts.push(current)
      }

      index = cursor - 1
      continue
    }

    if (current && children) {
      if (isListItemMarkdown(current)) {
        parts.push(`${current}\n${indentMarkdown(children)}`)
      } else {
        parts.push(`${current}\n\n${children}`)
      }
      continue
    }

    if (current || children) {
      parts.push(current || children)
    }
  }

  return parts.join("\n\n")
}
