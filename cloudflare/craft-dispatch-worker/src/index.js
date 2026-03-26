const ADMIN_BASIC_AUTH_REALM = "TUCHIZ Admin"
const ADMIN_DASHBOARD_HISTORY_DAYS = 14
const ADMIN_ROUTE_PATH = "/admin"
const CONTENT_HASH_KEY = "craft-posts-hash"
const DEFAULT_COLLECTION_NAME = "Posts"
const DEFAULT_CONTACTS = [
  {
    label: "instagram",
    url: "https://instagram.com/junicatz",
  },
  {
    label: "github",
    url: "https://github.com/wilgon456",
  },
  {
    label: "gmail",
    url: "mailto:juncatz1945@gmail.com",
  },
]
const DEFAULT_EVENT_TYPE = "craft_content_changed"
const DEFAULT_PROFILE = {
  bio: "A personal blog generated from Craft content and served as a static site.",
  displayName: "tuchi",
  profileImage: "/profile_img.png",
  role: "frontend developer",
}
const DEFAULT_VISITOR_ALLOWED_ORIGINS = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://tuchizblog.today",
]
const DEFAULT_VISITOR_TIMEZONE = "Asia/Seoul"
const GITHUB_API_VERSION = "2026-03-10"
const SITE_NAME = "TUCHIZ-LOG"
const SITE_ORIGIN = "https://tuchizblog.today"
const VISITOR_COUNT_KEY_PREFIX = "site-visitor-count"
const VISITOR_COUNT_TTL_SECONDS = 60 * 60 * 24 * 400
const VISITOR_HISTORY_MAX_DAYS = 90
const VISITOR_ROUTE_PATH = "/api/visits/today"
const VISITOR_SCOPE_SITE = "site"
const VISITOR_SEEN_KEY_PREFIX = "site-visitor-seen"
const VISITOR_SEEN_TTL_SECONDS = 60 * 60 * 48

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === VISITOR_ROUTE_PATH) {
      return handleVisitorRequest(request, env)
    }

    if (isAdminRoutePath(url.pathname)) {
      return handleAdminRequest(request, env)
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
    const timeZone = env.VISITOR_TIMEZONE || DEFAULT_VISITOR_TIMEZONE
    const mode = getVisitorMode(url.searchParams.get("mode"))

    if (mode !== "track") {
      const authState = authenticateAdminRequest(request, env)

      if (!authState.authorized) {
        return buildAdminJsonUnauthorizedResponse(authState, corsHeaders)
      }
    }

    const scope = VISITOR_SCOPE_SITE
    const dateKey = getDateKey(Date.now(), timeZone)
    const scopeKey = scope
    const countKey = getVisitorCountKey(dateKey, scopeKey)
    let count = toStoredCount(await env.CONTENT_STATE.get(countKey))
    let counted = false

    if (mode === "history") {
      const days = clampHistoryDays(url.searchParams.get("days"))
      const history = await readVisitorHistory(env, days, timeZone)

      return jsonResponse(
        {
          days,
          history,
          ok: true,
          scope,
          todayCount: history.at(-1)?.count ?? 0,
          totalCount: history.reduce((sum, entry) => sum + entry.count, 0),
        },
        200,
        corsHeaders,
      )
    }

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

      return jsonResponse(
        {
          counted,
          ok: true,
          scope,
        },
        200,
        corsHeaders,
      )
    }

    return jsonResponse(
      {
        count,
        counted,
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

async function handleAdminRequest(request, env) {
  const url = new URL(request.url)

  if (url.pathname === ADMIN_ROUTE_PATH) {
    return Response.redirect(`${url.origin}${ADMIN_ROUTE_PATH}/`, 308)
  }

  if (url.pathname !== `${ADMIN_ROUTE_PATH}/`) {
    return new Response("Not found", {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 404,
    })
  }

  const authState = authenticateAdminRequest(request, env)

  if (!authState.authorized) {
    return buildAdminHtmlUnauthorizedResponse(authState)
  }

  try {
    const dashboard = await buildAdminDashboard(env)

    return new Response(renderAdminHtml(dashboard), {
      headers: buildAdminPageHeaders(),
      status: 200,
    })
  } catch (error) {
    return new Response(
      renderAdminErrorHtml(
        error instanceof Error ? error.message : "Unknown admin error",
      ),
      {
        headers: buildAdminPageHeaders(),
        status: 500,
      },
    )
  }
}

async function buildAdminDashboard(env) {
  const timeZone = env.VISITOR_TIMEZONE || DEFAULT_VISITOR_TIMEZONE
  const history = await readVisitorHistory(env, ADMIN_DASHBOARD_HISTORY_DAYS, timeZone)
  const profile = await getAdminProfile(env)
  const contacts = await getAdminContacts(env)

  return {
    contacts,
    generatedAt: new Date().toISOString(),
    history,
    profile,
    timeZone,
    todayCount: history.at(-1)?.count ?? 0,
    totalCount: history.reduce((sum, entry) => sum + entry.count, 0),
  }
}

async function getAdminProfile(env) {
  try {
    const profileItems = await getCraftCollectionItemsByName(env, "Profile")
    const profileItem = profileItems[0]

    if (!profileItem) {
      return DEFAULT_PROFILE
    }

    const properties = profileItem.properties || {}

    return {
      bio: ensureString(properties.bio) || DEFAULT_PROFILE.bio,
      displayName:
        ensureString(properties.display_name) || DEFAULT_PROFILE.displayName,
      profileImage:
        ensureString(properties.profile_image) || DEFAULT_PROFILE.profileImage,
      role: ensureString(properties.role) || DEFAULT_PROFILE.role,
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

async function getAdminContacts(env) {
  try {
    const contactItems = await getCraftCollectionItemsByName(env, "Contacts")
    const normalized = contactItems
      .map((item) => {
        const properties = item.properties || {}
        const label =
          ensureString(properties.label) || ensureString(item.title) || "link"
        const normalizedUrl = normalizeContactUrl(
          ensureString(properties.url),
          ensureString(properties.icon),
        )

        return {
          enabled: properties.enabled === true,
          label,
          url: normalizedUrl,
        }
      })
      .filter((item) => item.enabled && item.url)

    return normalized.length > 0 ? normalized : DEFAULT_CONTACTS
  } catch {
    return DEFAULT_CONTACTS
  }
}

async function getCraftCollectionItemsByName(env, collectionName) {
  validateEnv(env)

  const apiUrl = trimTrailingSlash(env.CRAFT_API_URL)
  const collections = await fetchJson(`${apiUrl}/collections`)
  const collection = collections.items?.find((item) => item.name === collectionName)

  if (!collection) {
    throw new Error(`Craft collection not found: ${collectionName}`)
  }

  const itemsResponse = await fetchJson(
    `${apiUrl}/collections/${collection.id}/items?maxDepth=3`,
  )

  return itemsResponse.items || []
}

async function readVisitorHistory(env, days, timeZone) {
  return Promise.all(
    getRecentDateKeys(days, timeZone).map(async (historyDateKey) => ({
      count: toStoredCount(
        await env.CONTENT_STATE.get(
          getVisitorCountKey(historyDateKey, VISITOR_SCOPE_SITE),
        ),
      ),
      dateKey: historyDateKey,
    })),
  )
}

function isAdminRoutePath(pathname) {
  return pathname === ADMIN_ROUTE_PATH || pathname.startsWith(`${ADMIN_ROUTE_PATH}/`)
}

function authenticateAdminRequest(request, env) {
  const expectedUsername = ensureString(env.ADMIN_BASIC_AUTH_USERNAME)
  const expectedPassword = ensureString(env.ADMIN_BASIC_AUTH_PASSWORD)

  if (!expectedUsername || !expectedPassword) {
    return {
      authorized: false,
      reason: "missing-secret",
    }
  }

  const authorization = request.headers.get("Authorization") || ""

  if (!authorization.startsWith("Basic ")) {
    return {
      authorized: false,
      reason: "missing-auth",
    }
  }

  const encodedCredentials = authorization.slice("Basic ".length)
  let decodedCredentials = ""

  try {
    decodedCredentials = atob(encodedCredentials)
  } catch {
    return {
      authorized: false,
      reason: "invalid-auth",
    }
  }

  const separatorIndex = decodedCredentials.indexOf(":")

  if (separatorIndex < 0) {
    return {
      authorized: false,
      reason: "invalid-auth",
    }
  }

  const providedUsername = decodedCredentials.slice(0, separatorIndex)
  const providedPassword = decodedCredentials.slice(separatorIndex + 1)
  const authorized =
    constantTimeEqual(providedUsername, expectedUsername) &&
    constantTimeEqual(providedPassword, expectedPassword)

  return {
    authorized,
    reason: authorized ? "authorized" : "invalid-auth",
  }
}

function buildAdminHtmlUnauthorizedResponse(authState) {
  const headers = buildAdminPageHeaders()
  headers.set("WWW-Authenticate", `Basic realm="${ADMIN_BASIC_AUTH_REALM}"`)

  if (authState.reason === "missing-secret") {
    return new Response(renderAdminErrorHtml("Admin auth secrets are not configured."), {
      headers,
      status: 503,
    })
  }

  return new Response(renderAdminErrorHtml("Authentication required."), {
    headers,
    status: 401,
  })
}

function buildAdminJsonUnauthorizedResponse(authState, headers) {
  const nextHeaders = new Headers(headers)

  if (authState.reason !== "missing-secret") {
    nextHeaders.set("WWW-Authenticate", `Basic realm="${ADMIN_BASIC_AUTH_REALM}"`)
  }

  return new Response(
    JSON.stringify({
      error:
        authState.reason === "missing-secret"
          ? "Admin auth secrets are not configured"
          : "Authentication required",
      ok: false,
    }),
    {
      headers: nextHeaders,
      status: authState.reason === "missing-secret" ? 503 : 401,
    },
  )
}

function buildAdminPageHeaders() {
  return new Headers({
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'self'; img-src 'self' https: data:; style-src 'unsafe-inline'; font-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    "Content-Type": "text/html; charset=utf-8",
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  })
}

function renderAdminHtml(dashboard) {
  const maxCount = Math.max(1, ...dashboard.history.map((entry) => entry.count))
  const historyItems = dashboard.history
    .map((entry) => {
      const barHeight = Math.max(
        (entry.count / maxCount) * 100,
        entry.count > 0 ? 12 : 4,
      )

      return `
        <div class="chart-item">
          <div class="chart-count">${escapeHtml(String(entry.count))}</div>
          <div class="chart-track">
            <div class="chart-bar" style="height:${barHeight}%"></div>
          </div>
          <div class="chart-date">${escapeHtml(entry.dateKey.slice(5))}</div>
        </div>
      `
    })
    .join("")
  const contactItems = dashboard.contacts
    .map(
      (contact) => `
        <div class="contact-row">
          <span>${escapeHtml(contact.label)}</span>
          <a href="${escapeAttribute(contact.url)}" target="_blank" rel="noreferrer">${escapeHtml(contact.url)}</a>
        </div>
      `,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin | ${SITE_NAME}</title>
    <meta name="robots" content="noindex, nofollow" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b0b0d;
        --panel: rgba(22, 22, 26, 0.92);
        --panel-border: rgba(255, 255, 255, 0.08);
        --text: #f7f7fb;
        --muted: rgba(233, 234, 238, 0.68);
        --accent: #8bc4ff;
        --accent-strong: #5caeff;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(92, 174, 255, 0.16), transparent 34%),
          linear-gradient(180deg, #141418 0%, #09090b 100%);
        color: var(--text);
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      a {
        color: inherit;
      }

      .shell {
        width: min(1100px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 36px 0 56px;
      }

      .eyebrow {
        margin: 0 0 10px;
        color: var(--accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .lead {
        margin: 14px 0 0;
        color: var(--muted);
        max-width: 720px;
        line-height: 1.7;
      }

      .meta {
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 0.94rem;
      }

      .grid {
        display: grid;
        gap: 20px;
        margin-top: 28px;
        grid-template-columns: repeat(12, minmax(0, 1fr));
      }

      .panel {
        grid-column: span 12;
        background: var(--panel);
        border: 1px solid var(--panel-border);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 26px 50px rgba(0, 0, 0, 0.24);
        backdrop-filter: blur(16px);
      }

      .panel h2 {
        margin: 0 0 8px;
        font-size: 1.15rem;
      }

      .panel p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .profile {
        display: grid;
        gap: 18px;
        align-items: center;
        grid-template-columns: 108px minmax(0, 1fr);
      }

      .profile img {
        width: 108px;
        height: 108px;
        border-radius: 28px;
        object-fit: cover;
        border: 1px solid var(--panel-border);
        background: rgba(255, 255, 255, 0.04);
      }

      .profile-name {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
      }

      .profile-role {
        margin: 6px 0 0;
        color: var(--accent);
        font-size: 0.96rem;
      }

      .profile-bio {
        margin-top: 10px;
      }

      .summary {
        display: grid;
        gap: 14px;
        margin-top: 20px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .summary-card {
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 18px;
      }

      .summary-card span {
        display: block;
        color: var(--muted);
        font-size: 0.85rem;
      }

      .summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 1.8rem;
      }

      .chart {
        display: grid;
        gap: 10px;
        align-items: end;
        min-height: 260px;
        margin-top: 24px;
        grid-template-columns: repeat(${dashboard.history.length}, minmax(0, 1fr));
      }

      .chart-item {
        display: grid;
        gap: 10px;
        align-items: end;
      }

      .chart-count,
      .chart-date {
        text-align: center;
        font-size: 0.78rem;
        color: var(--muted);
      }

      .chart-track {
        position: relative;
        min-height: 150px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.035);
        border: 1px solid rgba(255, 255, 255, 0.06);
        overflow: hidden;
      }

      .chart-bar {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        border-radius: 14px 14px 0 0;
        background: linear-gradient(180deg, var(--accent) 0%, var(--accent-strong) 100%);
      }

      .contact-list {
        display: grid;
        gap: 12px;
        margin-top: 18px;
      }

      .contact-row {
        display: grid;
        gap: 8px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }

      .contact-row span {
        font-size: 0.84rem;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .contact-row a {
        word-break: break-all;
        text-decoration: none;
      }

      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-top: 26px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 18px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        text-decoration: none;
      }

      .button:hover {
        border-color: rgba(139, 196, 255, 0.42);
      }

      .small {
        margin-top: 16px;
        font-size: 0.83rem;
        color: var(--muted);
      }

      @media (min-width: 880px) {
        .panel--wide {
          grid-column: span 8;
        }

        .panel--side {
          grid-column: span 4;
        }
      }

      @media (max-width: 720px) {
        .shell {
          width: min(100vw - 20px, 100%);
          padding-top: 22px;
        }

        .panel {
          padding: 18px;
          border-radius: 20px;
        }

        .profile {
          grid-template-columns: 1fr;
        }

        .summary {
          grid-template-columns: 1fr;
        }

        .chart {
          grid-template-columns: repeat(7, minmax(0, 1fr));
          min-height: 220px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <p class="eyebrow">Private Admin</p>
      <h1>${SITE_NAME}</h1>
      <p class="lead">This page is protected by Cloudflare Worker basic authentication and keeps visitor analytics off the public site.</p>
      <p class="meta">Generated ${escapeHtml(formatDateTime(dashboard.generatedAt, dashboard.timeZone))} (${escapeHtml(dashboard.timeZone)})</p>

      <section class="grid">
        <article class="panel panel--wide">
          <h2>Profile</h2>
          <div class="profile">
            <img alt="${escapeAttribute(dashboard.profile.displayName)}" src="${escapeAttribute(dashboard.profile.profileImage)}" />
            <div>
              <p class="profile-name">${escapeHtml(dashboard.profile.displayName)}</p>
              <p class="profile-role">${escapeHtml(dashboard.profile.role)}</p>
              <p class="profile-bio">${escapeHtml(dashboard.profile.bio)}</p>
            </div>
          </div>
        </article>

        <article class="panel panel--side">
          <h2>Visitor Summary</h2>
          <div class="summary">
            <div class="summary-card">
              <span>Today</span>
              <strong>${escapeHtml(String(dashboard.todayCount))}</strong>
            </div>
            <div class="summary-card">
              <span>Last ${ADMIN_DASHBOARD_HISTORY_DAYS} days</span>
              <strong>${escapeHtml(String(dashboard.totalCount))}</strong>
            </div>
            <div class="summary-card">
              <span>Mode</span>
              <strong>Private</strong>
            </div>
          </div>
        </article>

        <article class="panel panel--wide">
          <h2>Daily Visitors</h2>
          <p>Only authenticated requests can read visitor counts or history now. Public traffic can only record visits.</p>
          <div class="chart">${historyItems}</div>
        </article>

        <article class="panel panel--side">
          <h2>Current Contacts</h2>
          <div class="contact-list">${contactItems}</div>
        </article>
      </section>

      <div class="actions">
        <a class="button" href="${SITE_ORIGIN}/">Open home</a>
        <a class="button" href="${SITE_ORIGIN}/about/">Open about</a>
        <a class="button" href="${SITE_ORIGIN}/archive/">Open archive</a>
      </div>
      <p class="small">To change the admin password later, rotate the Worker secrets <code>ADMIN_BASIC_AUTH_USERNAME</code> and <code>ADMIN_BASIC_AUTH_PASSWORD</code>.</p>
    </main>
  </body>
</html>`
}

function renderAdminErrorHtml(message) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Access | ${SITE_NAME}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0b0b0d;
        color: #f7f7fb;
        font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .card {
        width: min(520px, calc(100vw - 32px));
        padding: 28px;
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(22, 22, 26, 0.92);
      }

      p {
        margin: 0;
        color: rgba(233, 234, 238, 0.72);
        line-height: 1.7;
      }

      strong {
        display: block;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <strong>Admin access</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  </body>
</html>`
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

  return (itemsResponse.items || [])
    .filter((item) => item.properties?.published === true)
    .map((item) => ({
      content: item.content || [],
      id: item.id,
      properties: normalizeProperties(item.properties || {}),
      title: item.title || "",
    }))
    .sort((left, right) => {
      const leftKey = left.properties.slug || left.title || left.id
      const rightKey = right.properties.slug || right.title || right.id
      return String(leftKey).localeCompare(String(rightKey))
    })
}

function normalizeProperties(properties) {
  const normalized = {}

  for (const [key, value] of Object.entries(properties)) {
    normalized[key] = Array.isArray(value) ? [...value] : value
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
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
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

function clampHistoryDays(value) {
  const parsedValue = Number.parseInt(value || "14", 10)

  if (!Number.isFinite(parsedValue)) {
    return 14
  }

  return Math.min(Math.max(parsedValue, 1), VISITOR_HISTORY_MAX_DAYS)
}

function getDateKey(timestamp, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  })
  const parts = formatter.formatToParts(timestamp)
  const year = parts.find((part) => part.type === "year")?.value || "0000"
  const month = parts.find((part) => part.type === "month")?.value || "01"
  const day = parts.find((part) => part.type === "day")?.value || "01"

  return `${year}-${month}-${day}`
}

function getRecentDateKeys(days, timeZone) {
  const oneDay = 24 * 60 * 60 * 1000

  return Array.from({ length: days }, (_, index) => {
    const offset = days - index - 1
    return getDateKey(Date.now() - offset * oneDay, timeZone)
  })
}

function getVisitorCountKey(dateKey, scopeKey) {
  return `${VISITOR_COUNT_KEY_PREFIX}:${dateKey}:${scopeKey}`
}

function getVisitorMode(value) {
  if (value === "history") {
    return "history"
  }

  if (value === "read") {
    return "read"
  }

  return "track"
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

function toStoredCount(value) {
  if (!value) {
    return 0
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function ensureString(value) {
  return typeof value === "string" ? value.trim() : ""
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function hasProtocol(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value)
}

function isAllowedAbsoluteUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function normalizeContactUrl(url, icon) {
  const normalized = ensureString(url)

  if (!normalized) {
    return ""
  }

  if (ensureString(icon).toLowerCase() === "email" || looksLikeEmail(normalized)) {
    return normalized.toLowerCase().startsWith("mailto:")
      ? normalized
      : `mailto:${normalized}`
  }

  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized
  }

  if (normalized.startsWith("#")) {
    return normalized
  }

  if (hasProtocol(normalized)) {
    return isAllowedAbsoluteUrl(normalized) ? normalized : ""
  }

  const withHttps = `https://${normalized}`
  return isAllowedAbsoluteUrl(withHttps) ? withHttps : ""
}

function constantTimeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(left)
  const rightBytes = new TextEncoder().encode(right)
  const maxLength = Math.max(leftBytes.length, rightBytes.length)
  let mismatch = leftBytes.length === rightBytes.length ? 0 : 1

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0)
  }

  return mismatch === 0
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function escapeAttribute(value) {
  return escapeHtml(value)
}

function formatDateTime(value, timeZone) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value))
}
