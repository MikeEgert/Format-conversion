import { describe, expect, it } from 'vitest'
import {
  getLandingPage,
  getLandingPageByPath,
  landingPages,
} from './landingPages'
import {
  buildLandingPageHtml,
  extractAssetsFromIndexHtml,
} from './prerender'

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>FoldenLoom</title>
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-def456.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

describe('getLandingPageByPath', () => {
  it('matches the trailing-slash path', () => {
    expect(getLandingPageByPath('/heic-to-jpg/')?.id).toBe('heic-to-jpg')
  })

  it('matches without a trailing slash', () => {
    expect(getLandingPageByPath('/heic-to-jpg')?.id).toBe('heic-to-jpg')
  })

  it('returns undefined for unknown paths', () => {
    expect(getLandingPageByPath('/nope')).toBeUndefined()
  })
})

describe('getLandingPage', () => {
  it('finds the heic-to-jpg page', () => {
    expect(getLandingPage('heic-to-jpg')).toBe(landingPages[0])
  })

  it('returns undefined for an unknown id', () => {
    expect(getLandingPage('does-not-exist')).toBeUndefined()
  })
})

describe('extractAssetsFromIndexHtml', () => {
  it('extracts the built script and css tags', () => {
    const { scriptTag, cssTag } = extractAssetsFromIndexHtml(INDEX_HTML)
    expect(scriptTag).toContain('/assets/index-abc123.js')
    expect(cssTag).toContain('/assets/index-def456.css')
  })
})

describe('buildLandingPageHtml', () => {
  const page = landingPages[0]
  const { scriptTag, cssTag } = extractAssetsFromIndexHtml(INDEX_HTML)
  const html = buildLandingPageHtml({
    page,
    scriptTag,
    cssTag,
    origin: 'https://example.com',
  })

  it('sets the page title', () => {
    expect(html).toContain(`<title>${page.title}</title>`)
  })

  it('sets the meta description', () => {
    expect(html).toContain(`<meta name="description" content="${page.description}" />`)
  })

  it('sets a canonical URL', () => {
    expect(html).toContain('<link rel="canonical" href="https://example.com/heic-to-jpg/" />')
  })

  it('includes JSON-LD structured data', () => {
    expect(html).toContain('<script type="application/ld+json">')
    expect(html).toContain('"@type":"FAQPage"')
  })

  it('renders static content for crawlers', () => {
    expect(html).toContain(page.h1)
    expect(html).toContain(page.steps[0].title)
    expect(html).toContain(page.faq[0].question)
  })

  it('references the built assets', () => {
    expect(html).toContain(scriptTag)
    expect(html).toContain(cssTag)
  })
})
