# Cloudflare Worker Dispatch Bridge

This setup polls Craft, hashes the published `Posts` collection, and triggers GitHub Pages only when the public content changes.

## Flow

1. Cloudflare Cron Trigger runs the Worker on a schedule.
2. The Worker reads the Craft `Posts` collection from `CRAFT_API_URL`.
3. The Worker hashes the published items and compares the hash with the last value stored in Cloudflare KV.
4. If the hash changed, the Worker calls GitHub `repository_dispatch`.
5. The existing Pages workflow rebuilds and deploys the blog.
6. The same Worker can also respond to `/api/visits/today` for daily visitor counts.

## Files

- [deploy-pages.yml](/C:/Users/maste/Desktop/personal_blog_craft/.github/workflows/deploy-pages.yml)
- [wrangler.jsonc](/C:/Users/maste/Desktop/personal_blog_craft/cloudflare/craft-dispatch-worker/wrangler.jsonc)
- [index.js](/C:/Users/maste/Desktop/personal_blog_craft/cloudflare/craft-dispatch-worker/src/index.js)

## What You Need To Create

### 1. Cloudflare KV namespace

Create one KV namespace and copy its ID into:

- [wrangler.jsonc](/C:/Users/maste/Desktop/personal_blog_craft/cloudflare/craft-dispatch-worker/wrangler.jsonc)

Replace:

```json
"id": "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"
```

### 2. Cloudflare Worker variables and secret

In the Worker dashboard or via Wrangler, set:

- `CRAFT_API_URL`
  - `https://connect.craft.do/links/7e5COnRkC3c/api/v1`
- `CRAFT_COLLECTION_NAME`
  - `Posts`
- `CRAFT_ITEMS_MAX_DEPTH`
  - `-1`
- `GITHUB_OWNER`
  - `wilgon456`
- `GITHUB_REPO`
  - `personal_blog_craft`
- `GITHUB_EVENT_TYPE`
  - `craft_content_changed`
- `VISITOR_ALLOWED_ORIGINS`
  - `https://tuchizblog.today,http://localhost:3000,http://127.0.0.1:3000`
- `VISITOR_TIMEZONE`
  - `Asia/Seoul`
- `GITHUB_TOKEN`
  - store as a secret, not a plain variable

### 3. GitHub token

Create one GitHub token that can call `POST /repos/{owner}/{repo}/dispatches`.

Recommended option:

- Fine-grained PAT
- Repository access: `wilgon456/personal_blog_craft`
- Permission: `Contents` -> `Read and write`

Classic PAT also works with `repo`, but fine-grained is safer.

## Suggested Cron

The Worker config is currently set to run every minute:

```json
"crons": ["* * * * *"]
```

If you want to reduce calls, change it to one of these:

- every 5 minutes: `*/5 * * * *`
- every 15 minutes: `*/15 * * * *`

## Deploy Steps

From:

- [craft-dispatch-worker](/C:/Users/maste/Desktop/personal_blog_craft/cloudflare/craft-dispatch-worker)

Run:

```bash
npm install
npm run deploy
```

If the site should show the `TODAY` visitor count card, also set:

- `NEXT_PUBLIC_VISITOR_API_URL`
  - `/api/visits/today` when the Worker is routed through the same domain
  - or the full Worker URL if the API is hosted on a separate subdomain

## Local Test

Run:

```bash
npm install
npm run dev
```

Then trigger the scheduled handler locally:

```bash
curl "http://localhost:8787/cdn-cgi/handler/scheduled?cron=*+*+*+*+*"
```

## Notes

- The GitHub Pages workflow now relies on `push`, manual runs, and Cloudflare-triggered `repository_dispatch`.
- This Worker compares only published collection items. Draft-only changes do not trigger deployment.
- Visitor counting uses the same KV namespace and stores one daily unique visit per hashed IP and user agent pair.
