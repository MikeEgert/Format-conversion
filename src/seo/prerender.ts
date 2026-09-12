import type { LandingPageData } from './landingPages.ts'

export interface LandingPageAssets {
  scriptTag: string
  cssTag: string
}

export interface BuildLandingPageHtmlOptions {
  page: LandingPageData
  scriptTag: string
  cssTag: string
  origin: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function jsonLd(page: LandingPageData, origin: string): string {
  const graph = [
    {
      '@type': 'WebApplication',
      name: `FoldenLoom — ${page.h1}`,
      url: origin + page.path,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      description: page.description,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'HowTo',
      name: `How to convert with ${page.h1}`,
      description: page.subtitle,
      step: page.steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.title,
        text: step.text,
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: page.faq.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ]

  const payload = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
  return `<script type="application/ld+json">${payload.replace(/</g, '\\u003c')}</script>`
}

export function extractAssetsFromIndexHtml(indexHtml: string): LandingPageAssets {
  const scriptMatch = indexHtml.match(/<script\b[^>]*\bsrc="[^"]*"[^>]*><\/script>/)
  const cssMatch = indexHtml.match(/<link\b[^>]*\brel="stylesheet"[^>]*>/)
  if (!scriptMatch || !cssMatch) {
    throw new Error('Could not locate built JS/CSS tags in dist/index.html')
  }
  return { scriptTag: scriptMatch[0], cssTag: cssMatch[0] }
}

function heroMarkup(page: LandingPageData): string {
  return [
    '<section class="landing-hero">',
    '<div class="hero-pills">',
    '<span class="hero-pill">100% free</span>',
    '<span class="hero-pill">No upload</span>',
    '<span class="hero-pill">No signup</span>',
    '</div>',
    `<h1>${escapeHtml(page.h1)}</h1>`,
    `<p class="hero-sub">${escapeHtml(page.subtitle)}</p>`,
    '<div class="hero-actions">',
    `<a class="btn btn-primary" href="#/tool?converter=${escapeHtml(page.id)}">Start converting</a>`,
    '</div>',
    '</section>',
  ].join('\n')
}

function stepsMarkup(page: LandingPageData): string {
  const steps = page.steps
    .map(
      (step, i) =>
        [
          '<div class="how-step">',
          `<span class="how-step-num">${i + 1}</span>`,
          `<h3>${escapeHtml(step.title)}</h3>`,
          `<p>${escapeHtml(step.text)}</p>`,
          '</div>',
        ].join('\n'),
    )
    .join('\n')
  return [
    '<section class="landing-section">',
    '<h2 class="section-title">How to convert</h2>',
    '<p class="section-sub">Three steps. No account, no uploads.</p>',
    '<div class="how-steps">',
    steps,
    '</div>',
    '</section>',
  ].join('\n')
}

function benefitsMarkup(page: LandingPageData): string {
  if (page.useCases.length === 0) return ''
  const items = page.useCases.map((useCase) => `<li>${escapeHtml(useCase)}</li>`).join('\n')
  return [
    '<section class="landing-section">',
    '<h2 class="section-title">Why use it</h2>',
    '<ul class="landing-usecases">',
    items,
    '</ul>',
    '</section>',
  ].join('\n')
}

function faqMarkup(page: LandingPageData): string {
  if (page.faq.length === 0) return ''
  const items = page.faq
    .map(
      (faq) =>
        [
          '<div class="landing-faq-item">',
          `<h3>${escapeHtml(faq.question)}</h3>`,
          `<p>${escapeHtml(faq.answer)}</p>`,
          '</div>',
        ].join('\n'),
    )
    .join('\n')
  return [
    '<section class="landing-section">',
    '<h2 class="section-title">Frequently asked questions</h2>',
    '<div class="landing-faq">',
    items,
    '</div>',
    '</section>',
  ].join('\n')
}

export function buildLandingPageHtml({
  page,
  scriptTag,
  cssTag,
  origin,
}: BuildLandingPageHtmlOptions): string {
  const url = origin + page.path
  const head = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<link rel="icon" type="image/png" href="/favicon.png?v=2" />',
    '<link rel="apple-touch-icon" href="/favicon.png?v=2" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />',
    '<meta name="theme-color" content="#f3f8f9" />',
    '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f172a" />',
    '<meta name="color-scheme" content="dark light" />',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="FoldenLoom" />',
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    jsonLd(page, origin),
    cssTag,
    scriptTag,
    '</head>',
  ].join('\n')

  const body = [
    '<body>',
    '<div id="root">',
    heroMarkup(page),
    stepsMarkup(page),
    benefitsMarkup(page),
    faqMarkup(page),
    '</div>',
    '</body>',
    '</html>',
  ].join('\n')

  return head + '\n' + body
}
