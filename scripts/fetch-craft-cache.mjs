import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const rootDir = process.cwd()
const envFilePath = path.join(rootDir, ".env.local")

await hydrateLocalEnv()

const craftApiUrl = process.env.CRAFT_API_URL

if (!craftApiUrl) {
  throw new Error("Missing CRAFT_API_URL environment variable.")
}

async function fetchJson(target) {
  const response = await fetch(target, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Craft cache fetch failed: ${response.status} ${target}`)
  }

  return response.json()
}

async function main() {
  const trimmedApiUrl = craftApiUrl.replace(/\/+$/, "")
  const cacheDir = path.join(rootDir, ".cache")
  const cachePath = path.join(cacheDir, "craft-data.json")

  await mkdir(cacheDir, { recursive: true })

  try {
    const collectionsResponse = await fetchJson(`${trimmedApiUrl}/collections`)
    const collections = collectionsResponse.items ?? []
    const collectionItems = {}

    for (const collection of collections) {
      const itemsResponse = await fetchJson(
        `${trimmedApiUrl}/collections/${collection.id}/items?maxDepth=3`,
      )
      collectionItems[collection.name] = itemsResponse.items ?? []
    }

    await writeFile(
      cachePath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          collections,
          collectionItems,
        },
        null,
        2,
      ),
      "utf8",
    )

    console.log(
      `Craft cache refreshed: ${collections.length} collections -> ${cachePath}`,
    )
  } catch (error) {
    try {
      await access(cachePath)
      const message = error instanceof Error ? error.message : String(error)
      console.warn(
        `Craft cache refresh failed, reusing existing snapshot at ${cachePath}: ${message}`,
      )
      return
    } catch {
      throw error
    }
  }
}

async function hydrateLocalEnv() {
  try {
    await access(envFilePath)
  } catch {
    return
  }

  const envFile = await readFile(envFilePath, "utf8")
  const lines = envFile.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()

    if (!process.env[key]) {
      process.env[key] = rawValue
    }
  }
}

await main()
