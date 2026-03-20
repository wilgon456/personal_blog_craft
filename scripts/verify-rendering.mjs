import fs from "node:fs"
import path from "node:path"
import { renderingBaselines } from "./rendering-baselines.mjs"

const rootDir = process.cwd()
const outDir = path.join(rootDir, "out")
const postsDir = path.join(outDir, "posts")

function fail(message) {
  throw new Error(message)
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

function decodeHtmlEntities(input) {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function getPostHtmlPaths() {
  if (!fs.existsSync(postsDir)) {
    fail("Missing build output for posts. Run `npm run build` first.")
  }

  return fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(postsDir, entry.name, "index.html"))
    .filter((filePath) => fs.existsSync(filePath))
}

function assertNoRawCraftTokens(filePath, html) {
  const rawTokens = [
    "<callout",
    "</callout>",
    "<highlight",
    "</highlight>",
    "<caption>",
    "</caption>",
  ]

  for (const token of rawTokens) {
    if (html.includes(token)) {
      fail(`Raw Craft token "${token}" leaked into ${path.relative(rootDir, filePath)}`)
    }
  }
}

function assertNoSuspiciousMarkdownCodeBlocks(filePath, html) {
  const codeBlockMatches = html.matchAll(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi)

  for (const match of codeBlockMatches) {
    const content = decodeHtmlEntities(match[1])

    if (/(^|\n)\s*(#{1,6}\s|!\[[^\]]*\]\(|\d+\.\s+#{1,6}\s|[-*]\s|\d+\.\s)/m.test(content)) {
      fail(
        `Suspicious markdown-like code block found in ${path.relative(rootDir, filePath)}`,
      )
    }
  }
}

function assertPretendardIsLoaded() {
  const homePath = path.join(outDir, "index.html")

  if (!fs.existsSync(homePath)) {
    fail("Missing build output for the home page.")
  }

  const homeHtml = readFile(homePath)

  if (!homeHtml.includes("PretendardVariable")) {
    fail("Pretendard font preload is missing from the built home page.")
  }
}

function assertNumberedHeadingsExist(postHtmlPaths) {
  const hasSequentialNumberedHeadings = postHtmlPaths.some((filePath) => {
    const html = readFile(filePath)
    return /<h[1-6]>1\.\s+[^<]+<\/h[1-6]>/i.test(html) && /<h[1-6]>2\.\s+[^<]+<\/h[1-6]>/i.test(html)
  })

  if (!hasSequentialNumberedHeadings) {
    fail("Could not find a built post with sequential numbered headings.")
  }
}

function assertKnownProblemPostLooksHealthy() {
  const knownProblemPath = path.join(postsDir, "resource-ai_coding_tip", "index.html")

  if (!fs.existsSync(knownProblemPath)) {
    return
  }

  const html = readFile(knownProblemPath)

  if (!html.includes('class="craft-callout"')) {
    fail("The known problem post no longer renders its callout container.")
  }

  if (!html.includes('<img src="https://r.craft.do/')) {
    fail("The known problem post no longer renders Craft body images correctly.")
  }

  if (html.includes("<pre><code")) {
    fail("The known problem post regressed back into code block rendering.")
  }
}

function assertOutlineGroupingLooksHealthy() {
  const outlinePostPath = path.join(postsDir, "review-chat_gpt", "index.html")

  if (!fs.existsSync(outlinePostPath)) {
    return
  }

  const html = readFile(outlinePostPath)

  if (!html.includes("craft-block-group craft-block-group--depth-1")) {
    fail("The outline-style post no longer preserves depth-1 block grouping.")
  }
}

function assertRecordedBaselines() {
  for (const [baselineName, baseline] of Object.entries(renderingBaselines.pages)) {
    const filePath = path.join(postsDir, baseline.path, "index.html")

    if (!fs.existsSync(filePath)) {
      fail(`Missing built HTML for recorded baseline ${baselineName}.`)
    }

    const html = readFile(filePath)

    for (const expected of baseline.mustContain) {
      if (!html.includes(expected)) {
        fail(
          `Recorded baseline ${baselineName} is missing expected HTML: ${expected}`,
        )
      }
    }

    for (const forbidden of baseline.mustNotContain) {
      if (html.includes(forbidden)) {
        fail(
          `Recorded baseline ${baselineName} contains forbidden HTML: ${forbidden}`,
        )
      }
    }
  }
}

function main() {
  const postHtmlPaths = getPostHtmlPaths()

  if (!postHtmlPaths.length) {
    fail("No built post HTML files were found in out/posts.")
  }

  assertPretendardIsLoaded()
  assertNumberedHeadingsExist(postHtmlPaths)
  assertKnownProblemPostLooksHealthy()
  assertOutlineGroupingLooksHealthy()
  assertRecordedBaselines()

  for (const filePath of postHtmlPaths) {
    const html = readFile(filePath)
    assertNoRawCraftTokens(filePath, html)
    assertNoSuspiciousMarkdownCodeBlocks(filePath, html)
  }

  console.log(`Rendering checks passed for ${postHtmlPaths.length} built post pages.`)
}

main()
