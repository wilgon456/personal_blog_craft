const CONTENT_HASH_KEY = "craft-posts-hash"
const DEFAULT_COLLECTION_NAME = "Posts"
const DEFAULT_EVENT_TYPE = "craft_content_changed"
const DEFAULT_VISITOR_ALLOWED_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://tuchizblog.today",
]
const DEFAULT_VISITOR_TIMEZONE = "Asia/Seoul"
const GITHUB_API_VERSION = "2026-03-10"
const VISITOR_COUNT_KEY_PREFIX = "site-visitor-count"
const VISITOR_COUNT_TTL_SECONDS = 60 * 60 * 24 * 14
const VISITOR_ROUTE_PATH = "/api/visits/today"
const VISITOR_SCOPE_PATH = "path"
const VISITOR_SCOPE_SITE = "site"
const VISITOR_SEEN_KEY_PREFIX = "site-visitor-seen"
const VISITOR_SEEN_TTL_SECONDS = 60 * 60 * 48

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === VISITOR_ROUTE_PATH) {
      return handleVisitorRequest(request, env)
    }

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

async function handleVisitorRequest(request, env) {
  const origin = request.headers.get("Origin")
  const corsHeaders = buildCorsHeaders(origin, env)

  if (origin && !isAllowedOrigin(origin, env)) {
    return jsonResponse(
      {
        error: "Origin not allowed",
        ok: false,
      },
      403,
      corsHeaders,
    )
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  if (request.method !== "GET") {
    return jsonResponse(
      {
        error: "Method not allowed",
        ok: false,
      },
      405,
      corsHeaders,
    )
  }

  try {
    const url = new URL(request.url)
    const mode = url.searchParams.get("mode") === "read" ? "read" : "track"
    const scope = url.searchParams.get("scope") === VISITOR_SCOPE_PATH
      ? VISITOR_SCOPE_PATH
      : VISITOR_SCOPE_SITE
    const path = normalizeVisitorPath(url.searchParams.get("path") || "/")
    const dateKey = getDateKey(
      Date.now(),
      env.VISITOR_TIMEZONE || DEFAULT_VISITOR_TIMEZONE,
    )
    const scopeKey = scope === VISITOR_SCOPE_PATH ? `${scope}:${path}` : scope
    const countKey = `${VISITOR_COUNT_KEY_PREFIX}:${dateKey}:${scopeKey}`
    let count = toStoredCount(await env.CONTENT_STATE.get(countKey))
    let counted = false

    if (mode === "track") {
      const visitorFingerprint = await createVisitorFingerprint(request)
      const seenKey = `${VISITOR_SEEN_KEY_PREFIX}:${dateKey}:${scopeKey}:${visitorFingerprint}`
      const alreadyCounted = await env.CONTENT_STATE.get(seenKey)

      if (!alreadyCounted) {
        counted = true
        count += 1

        await env.CONTENT_STATE.put(seenKey, "1", {
          expirationTtl: VISITOR_SEEN_TTL_SECONDS,
        })
        await env.CONTENT_STATE.put(countKey, String(count), {
          expirationTtl: VISITOR_COUNT_TTL_SECONDS,
        })
      }
    }

    return jsonResponse(
      {
        counted,
        count,
        dateKey,
        ok: true,
        scope,
      },
      200,
      corsHeaders,
    )
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        ok: false,
      },
      500,
      corsHeaders,
    )
  }
}

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

function buildCorsHeaders(origin, env) {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  })

  if (origin && isAllowedOrigin(origin, env)) {
    headers.set("Access-Control-Allow-Origin", origin)
  }

  return headers
}

async function createVisitorFingerprint(request) {
  const ipAddress =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown"
  const userAgent = request.headers.get("User-Agent") || "unknown"
  const acceptLanguage = request.headers.get("Accept-Language") || "unknown"

  return createHash(`${ipAddress}|${userAgent}|${acceptLanguage}`)
}

function getDateKey(timestamp, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(timestamp)
}

function isAllowedOrigin(origin, env) {
  if (!origin) {
    return true
  }

  const allowedOrigins = (env.VISITOR_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
  const normalizedAllowedOrigins =
    allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_VISITOR_ALLOWED_ORIGINS

  return normalizedAllowedOrigins.includes(origin)
}

function jsonResponse(payload, status, headers) {
  return new Response(JSON.stringify(payload), {
    headers,
    status,
  })
}

function normalizeVisitorPath(value) {
  if (!value || value === "/") {
    return "/"
  }

  return `/${value.replace(/^\/+/, "").replace(/\/+$/, "")}`
}

function toStoredCount(value) {
  if (!value) {
    return 0
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}
