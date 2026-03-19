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
  markdown?: string
  content?: CraftBlock[]
}

type ListResponse<T> = {
  items: T[]
}

const craftApiUrl = process.env.CRAFT_API_URL

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

export async function getCraftCollections() {
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
  const collection = await getPostsCollection()
  const response = await craftFetch<ListResponse<CraftCollectionItem>>(
    `/collections/${collection.id}/items?maxDepth=3`,
  )

  return response.items
}

export async function getCraftCollectionItems(collectionName: string) {
  const collection = await getCollectionByName(collectionName)
  const response = await craftFetch<ListResponse<CraftCollectionItem>>(
    `/collections/${collection.id}/items?maxDepth=3`,
  )

  return response.items
}

export function flattenCraftBlocks(blocks: CraftBlock[] = []): string {
  return blocks
    .flatMap((block) => {
      const current = block.markdown ? [block.markdown] : []
      const children = block.content ? [flattenCraftBlocks(block.content)] : []
      return [...current, ...children]
    })
    .filter(Boolean)
    .join("\n\n")
}
