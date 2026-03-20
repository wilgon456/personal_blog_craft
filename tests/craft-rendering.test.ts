import { describe, expect, it } from "vitest"
import { flattenCraftBlocks, renderCraftBlocksToHtml } from "@/lib/craft"
import { markdownToHtml } from "@/lib/markdown"

type RenderableBlocks = NonNullable<Parameters<typeof flattenCraftBlocks>[0]>
type TestBlock = RenderableBlocks[number]

describe("Craft rendering guardrails", () => {
  it("renders numbered heading blocks as sequential headings", () => {
    const blocks: TestBlock[] = [
      {
        id: "heading-1",
        type: "text",
        textStyle: "h2",
        listStyle: "numbered",
        markdown: "1. ## First heading",
      },
      {
        id: "body-1",
        type: "text",
        indentationLevel: 1,
        markdown: "  Supporting paragraph.",
      },
      {
        id: "heading-2",
        type: "text",
        textStyle: "h2",
        listStyle: "numbered",
        markdown: "1. ## Second heading",
      },
    ]

    const html = markdownToHtml(flattenCraftBlocks(blocks))

    expect(html).toContain("<h2>1. First heading</h2>")
    expect(html).toContain("<h2>2. Second heading</h2>")
    expect(html).toContain("<p>Supporting paragraph.</p>")
    expect(html).not.toContain("<ol>")
  })

  it("keeps indented images and paragraphs out of code blocks", () => {
    const blocks: TestBlock[] = [
      {
        id: "callout-title",
        type: "text",
        markdown: "<callout>Callout title</callout>",
      },
      {
        id: "callout-bullet",
        type: "text",
        listStyle: "bullet",
        markdown: "<callout>- Bullet item</callout>",
      },
      {
        id: "section-heading",
        type: "text",
        textStyle: "h2",
        markdown: "## Section title",
      },
      {
        id: "section-image",
        type: "image",
        url: "https://example.com/resource.png",
        indentationLevel: 1,
        markdown: "  ![Image](https://example.com/resource.png)",
      },
      {
        id: "section-body",
        type: "text",
        indentationLevel: 1,
        markdown: "  Paragraph under the image.",
      },
    ]

    const html = markdownToHtml(flattenCraftBlocks(blocks))

    expect(html).toContain("<blockquote>")
    expect(html).toContain("<ul>")
    expect(html).toContain("<h2>Section title</h2>")
    expect(html).toContain('<img src="https://example.com/resource.png" alt="Image" />')
    expect(html).toContain("<p>Paragraph under the image.</p>")
    expect(html).not.toContain("<pre>")
    expect(html).not.toContain("<code>")
  })

  it("renders consecutive callout blocks as one callout container", () => {
    const blocks: TestBlock[] = [
      {
        id: "callout-title",
        type: "text",
        decorations: ["callout"],
        markdown: "<callout>Callout title</callout>",
      },
      {
        id: "callout-bullet-1",
        type: "text",
        decorations: ["callout"],
        listStyle: "bullet",
        markdown: "<callout>- First bullet</callout>",
      },
      {
        id: "callout-bullet-2",
        type: "text",
        decorations: ["callout"],
        listStyle: "bullet",
        markdown: "<callout>- Second bullet</callout>",
      },
    ]

    const html = renderCraftBlocksToHtml(blocks)

    expect(html).toContain('class="craft-callout"')
    expect(html).toContain("<p>Callout title</p>")
    expect(html).toContain("<ul>")
    expect(html).toContain("<li>First bullet</li>")
    expect(html).toContain("<li>Second bullet</li>")
    expect(html).not.toContain("<blockquote>")
  })

  it("preserves indentation groups in rendered html", () => {
    const blocks: TestBlock[] = [
      {
        id: "section-heading",
        type: "text",
        textStyle: "h2",
        listStyle: "numbered",
        markdown: "1. ## First section",
      },
      {
        id: "nested-heading",
        type: "text",
        textStyle: "h3",
        indentationLevel: 1,
        markdown: "  ### Nested heading",
      },
      {
        id: "nested-paragraph",
        type: "text",
        indentationLevel: 1,
        markdown: "  Nested paragraph",
      },
    ]

    const html = renderCraftBlocksToHtml(blocks)

    expect(html).toContain('class="craft-block-group craft-block-group--depth-1"')
    expect(html).toContain("<h2>1. First section</h2>")
    expect(html).toContain("<h3>Nested heading</h3>")
    expect(html).toContain("<p>Nested paragraph</p>")
    expect(html).not.toContain("<pre>")
  })

  it("removes raw Craft tags from the final HTML", () => {
    const blocks: TestBlock[] = [
      {
        id: "formatted",
        type: "text",
        markdown:
          '<caption>Small note</caption>\n\n<highlight color="gradient-red">Important</highlight>',
      },
    ]

    const html = markdownToHtml(flattenCraftBlocks(blocks))

    expect(html).toContain('class="craft-caption"')
    expect(html).toContain('class="craft-highlight craft-highlight--gradient-red"')
    expect(html).not.toContain("<caption>")
    expect(html).not.toContain("<highlight")
    expect(html).not.toContain("<callout>")
  })
})
