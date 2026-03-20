# Rendering Contract

This document defines how Craft content must be interpreted and rendered in this project.

It separates:

- official Craft guarantees
- project-specific rendering rules
- regression checks that must stay green

## Official Craft Inputs

Craft's public API documents describe content as structured blocks and markdown, but they do not provide a complete browser rendering implementation.

Primary references:

- `https://connect.craft.do/api-docs/space`
- `https://connect.craft.do/api-docs/documents/`
- `https://support.craft.do/en/write-and-edit/formatting/markdown-shortcuts`
- `https://support.craft.do/en/write-and-edit/blocks-and-pages/indent-limits`

The parts we rely on:

- Text blocks expose `markdown`.
- Blocks may expose structural metadata such as `textStyle`, `listStyle`, `indentationLevel`, and `taskInfo`.
- Markdown output may include Craft-specific structural tags such as `<page>`, and in practice may also include tags like `<callout>`, `<highlight>`, and `<caption>`.
- Indentation depth is a Craft authoring concept with a 5-level limit. It is not a guarantee that every indented block should become markdown indentation in HTML output.

## What Craft Does Not Fully Specify

Craft does not give us a canonical web renderer for:

- mixed constructs like `1. ## Heading`
- how indented non-list paragraphs should map to HTML
- how indented images should map to HTML
- how Craft-only tags should be converted before markdown rendering
- how to prevent visual regressions when block data changes

Because of that, this repo treats rendering as an explicit contract owned by the app.

## Project Rendering Rules

These rules are the source of truth for app behavior.

### 1. Font Rule

- The entire site uses `Pretendard`.
- Root layout must apply both the font variable and the generated font class.
- Global styles must keep `html`, `body`, form controls, and buttons on the same font stack.

Relevant files:

- `src/app/layout.tsx`
- `src/app/globals.css`

### 2. Craft Tags Must Be Normalized Before Markdown Rendering

- `<highlight color="...">...</highlight>` becomes `<mark class="craft-highlight ...">...</mark>`.
- `<caption>...</caption>` becomes `<p class="craft-caption">...</p>`.
- `<callout>...</callout>` is unwrapped before markdown rendering.
- Raw Craft tags must never leak into final HTML.

Relevant files:

- `src/lib/craft-format.ts`
- `src/lib/craft.ts`
- `src/lib/markdown.ts`

### 3. Numbered Heading Blocks Are Headings, Not Lists

When Craft sends a block like:

```md
1. ## Section title
```

and the block metadata indicates a numbered heading, the app must render it as a real heading:

```md
## 1. Section title
```

Rules:

- numbering must be sequential within the same indentation level
- heading level must come from Craft heading metadata or heading markdown
- these blocks must not render as `<ol><li>...`

Relevant file:

- `src/lib/craft.ts`

### 4. Indentation Is Not Universal Markdown Indentation

`indentationLevel` must only create markdown indentation when the block is an actual nested list/task structure.

Rules:

- indented plain paragraphs stay paragraphs
- indented images stay images
- indented non-list content must not become `<pre><code>`
- we trim Craft's leading spaces, but do not blindly convert all indentation to markdown indentation

This rule exists because markdown interprets 4-space indentation as a code block.

Relevant file:

- `src/lib/craft.ts`

### 5. Sanitized HTML Is Required

- Markdown is converted to HTML, then sanitized.
- Dangerous raw HTML, event handlers, and unsafe URL schemes must be removed.
- Allowed Craft-specific classes used by the site may remain.

Relevant file:

- `src/lib/markdown.ts`

### 6. Known Problem Pages Must Stay Healthy

The following pages are explicit regression targets:

- `/posts/resource-ai_coding_tip`
- `/posts/review-chat_gpt`
- `/about`
- `/archive`

Expected guarantees:

- no raw Craft tags in built HTML
- no accidental markdown-like code blocks from block indentation
- numbered section headings render as real headings
- body images render as images, not code
- site font preload and font class remain intact

## Regression Gates

Any rendering-related change should keep all of these green.

### Unit Tests

Run:

```bash
npm run test:unit
```

Current coverage includes:

- numbered heading normalization
- indented image/paragraph protection against code-block rendering
- Craft tag normalization

Test file:

- `tests/craft-rendering.test.ts`

### Built HTML Smoke Checks

Run:

```bash
npm run test:rendering
```

This builds the site and verifies:

- Pretendard is still loaded in the built site
- a built post still contains sequential numbered headings
- the known broken post still renders blockquote and images correctly
- raw Craft tags do not leak into built post HTML
- suspicious markdown-like code blocks do not appear in built post HTML

Script:

- `scripts/verify-rendering.mjs`

### CI

Push and PR checks should run:

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:rendering` when `CRAFT_API_URL` is available

Workflow:

- `.github/workflows/quality.yml`

## Change Policy

If a future change touches any of these files, treat it as a rendering-risk change:

- `src/lib/craft.ts`
- `src/lib/craft-format.ts`
- `src/lib/markdown.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`

Before merging:

1. run `npm run test:unit`
2. run `npm run test:rendering`
3. inspect the built HTML for the known regression post if behavior changed

If a fix requires changing this contract, update this document in the same commit as the code and tests.
