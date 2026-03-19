const CONTENT_HASH_KEY = "craft-posts-hash"
const DEFAULT_COLLECTION_NAME = "Posts"
const DEFAULT_EVENT_TYPE = "craft_content_changed"
const GITHUB_API_VERSION = "2026-03-10"

const worker = {
  async fetch() {
    return Response.json({
      ok: true,
      service: "craft-content-dispatch",
      message: "Use the scheduled trigger or /cdn-cgi/handler/scheduled during local dev.",
    })
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduledCheck(controller, env))
  },
}

export default worker

async function runScheduledCheck(controller, env) {
  validateEnv(env)

  const snapshot = await buildCraftSnapshot(env)
  const currentHash = await createHash(JSON.stringify(snapshot))
  const previousHash = await env.CONTENT_STATE.get(CONTENT_HASH_KEY)

  if (previousHash === currentHash) {
    console.log(
      JSON.stringify({
        changed: false,
        checkedAt: new Date(controller.scheduledTime).toISOString(),
        hash: currentHash,
        publishedCount: snapshot.length,
      }),
    )
    return
  }

  await triggerRepositoryDispatch(env, {
    checkedAt: new Date(controller.scheduledTime).toISOString(),
    hash: currentHash,
    previousHash,
    publishedCount: snapshot.length,
  })

  await env.CONTENT_STATE.put(CONTENT_HASH_KEY, currentHash)
  await env.CONTENT_STATE.put(
    `${CONTENT_HASH_KEY}:meta`,
    JSON.stringify({
      checkedAt: new Date(controller.scheduledTime).toISOString(),
      hash: currentHash,
      publishedCount: snapshot.length,
    }),
  )

  console.log(
    JSON.stringify({
      changed: true,
      checkedAt: new Date(controller.scheduledTime).toISOString(),
      hash: currentHash,
      publishedCount: snapshot.length,
    }),
  )
}

function validateEnv(env) {
  const requiredKeys = [
    "CONTENT_STATE",
    "CRAFT_API_URL",
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "GITHUB_TOKEN",
  ]

  for (const key of requiredKeys) {
    if (!env[key]) {
      throw new Error(`Missing required Worker binding or variable: ${key}`)
    }
  }
}

async function buildCraftSnapshot(env) {
  const apiUrl = trimTrailingSlash(env.CRAFT_API_URL)
  const collectionName = env.CRAFT_COLLECTION_NAME || DEFAULT_COLLECTION_NAME
  const depth = env.CRAFT_ITEMS_MAX_DEPTH || "-1"

  const collections = await fetchJson(`${apiUrl}/collections`)
  const collection = collections.items?.find((item) => item.name === collectionName)

  if (!collection) {
    throw new Error(`Craft collection not found: ${collectionName}`)
  }

  const itemsResponse = await fetchJson(
    `${apiUrl}/collections/${collection.id}/items?maxDepth=${encodeURIComponent(depth)}`,
  )

  const publishedItems = (itemsResponse.items || [])
    .filter((item) => item.properties?.published === true)
    .map((item) => ({
      id: item.id,
      title: item.title || "",
      properties: normalizeProperties(item.properties || {}),
      content: item.content || [],
    }))
    .sort((left, right) => {
      const leftKey = left.properties.slug || left.title || left.id
      const rightKey = right.properties.slug || right.title || right.id
      return String(leftKey).localeCompare(String(rightKey))
    })

  return publishedItems
}

function normalizeProperties(properties) {
  const normalized = {}

  for (const [key, value] of Object.entries(properties)) {
    if (Array.isArray(value)) {
      normalized[key] = [...value]
      continue
    }

    normalized[key] = value
  }

  return normalized
}

async function triggerRepositoryDispatch(env, payload) {
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "craft-content-dispatch-worker",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      body: JSON.stringify({
        event_type: env.GITHUB_EVENT_TYPE || DEFAULT_EVENT_TYPE,
        client_payload: {
          source: "cloudflare-worker",
          collection: env.CRAFT_COLLECTION_NAME || DEFAULT_COLLECTION_NAME,
          ...payload,
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `GitHub repository_dispatch failed with ${response.status}: ${body}`,
    )
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`)
  }

  return response.json()
}

async function createHash(value) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  )

  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "")
}
