import { parseDocument } from 'htmlparser2'
import * as DomUtils from 'domutils'
import { isTag, isText, type AnyNode, type Element } from 'domhandler'
import { unzipSync } from 'fflate'
import { isZipFile } from './helpers'
import { readImageDimensions } from './imageHeaders'
import { ConversionError } from './types'

export const MAX_EPUB_UNCOMPRESSED_BYTES = 256 * 1024 * 1024

export interface TextStyle {
  bold?: boolean
  italic?: boolean
  mono?: boolean
}

export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  mono?: boolean
  vertical?: 'sub' | 'sup'
}

export interface ResolvedImage {
  bytes: Uint8Array
  mime: string
  width: number
  height: number
}

export type Block =
  | { kind: 'paragraph'; runs: TextRun[] }
  | { kind: 'heading'; level: number; runs: TextRun[] }
  | { kind: 'blockquote'; runs: TextRun[] }
  | { kind: 'listItem'; ordered: boolean; index: number; runs: TextRun[] }
  | { kind: 'image'; image: ResolvedImage | null; src: string; alt?: string }
  | { kind: 'rule' }
  | { kind: 'pageBreak' }

export interface ManifestItem {
  id: string
  href: string
  mediaType: string
}

export interface EpubPackage {
  files: Record<string, Uint8Array>
  title?: string
  author?: string
  chapters: Array<{ href: string; path: string }>
  manifest: Map<string, ManifestItem>
  opfDir: string
}

export function assertEpubUncompressedSize(
  data: Uint8Array,
  maxBytes = MAX_EPUB_UNCOMPRESSED_BYTES,
): void {
  let total = 0
  try {
    unzipSync(data, {
      filter(file) {
        total += file.originalSize
        return false
      },
    })
  } catch {
    throw new ConversionError(
      'Could not read this EPUB file.',
      'The file may be corrupted. Try re-downloading or re-exporting it.',
    )
  }
  if (total > maxBytes) {
    const limit = Math.floor(maxBytes / (1024 * 1024))
    throw new ConversionError(
      `This EPUB expands to over ${limit} MB, which is too large to convert.`,
      'Try a smaller book.',
    )
  }
}

export function assertNotDrm(files: Record<string, Uint8Array>): void {
  const hasEncryption = Object.keys(files).some((name) => {
    const normalized = name.replace(/\\/g, '/').toLowerCase()
    return normalized === 'meta-inf/encryption.xml'
  })
  if (hasEncryption) {
    throw new ConversionError(
      'This EPUB is DRM-protected.',
      'FoldenLoom does not remove DRM. Use a DRM-free file, or obtain the book from a store that sells unlocked EPUBs.',
    )
  }
}

export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3))
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  }
  return new TextDecoder('utf-8').decode(bytes)
}

export function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  return i >= 0 ? path.slice(0, i) : ''
}

export function resolveHref(baseDir: string, href: string): string {
  const clean = decodeURIComponent(href).split('#')[0].split('?')[0]
  const segments = `${baseDir}/${clean}`.split('/')
  const out: string[] = []
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') out.pop()
    else out.push(seg)
  }
  return out.join('/')
}

function getFile(files: Record<string, Uint8Array>, path: string): Uint8Array | undefined {
  if (files[path]) return files[path]
  const lower = path.toLowerCase()
  const key = Object.keys(files).find((k) => k.toLowerCase() === lower)
  return key ? files[key] : undefined
}

function localNameOf(name: string): string {
  const i = name.lastIndexOf(':')
  return (i >= 0 ? name.slice(i + 1) : name).toLowerCase()
}

function descendants(root: AnyNode): Element[] {
  const out: Element[] = []
  const walk = (nodes: AnyNode[]) => {
    for (const n of nodes) {
      if (isTag(n)) {
        out.push(n)
        walk(DomUtils.getChildren(n))
      }
    }
  }
  walk(DomUtils.getChildren(root))
  return out
}

function findElements(root: AnyNode, localName: string): Element[] {
  return descendants(root).filter((el) => localNameOf(el.name) === localName)
}

function attr(el: Element, ...names: string[]): string {
  for (const name of names) {
    const value = DomUtils.getAttributeValue(el, name)
    if (value) return value
  }
  return ''
}

export function parseEpub(data: Uint8Array): EpubPackage {
  if (!isZipFile(data.buffer)) {
    throw new ConversionError(
      "This isn't a valid EPUB.",
      'An EPUB is a ZIP archive. Make sure you picked a real .epub file.',
    )
  }

  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(data)
  } catch {
    throw new ConversionError(
      'Could not read this EPUB file.',
      'The file may be corrupted. Try re-downloading or re-exporting it.',
    )
  }

  assertNotDrm(files)

  const containerBytes = getFile(files, 'META-INF/container.xml')
  if (!containerBytes) {
    throw new ConversionError(
      "This isn't a valid EPUB.",
      'An EPUB must contain META-INF/container.xml. Try re-exporting the book.',
    )
  }

  const container = parseDocument(decodeText(containerBytes), { xmlMode: true, decodeEntities: true })
  const rootfile = findElements(container, 'rootfile')[0]
  const opfPath = rootfile ? attr(rootfile, 'full-path', 'fullpath') : ''
  if (!opfPath) {
    throw new ConversionError(
      "This isn't a valid EPUB.",
      'Could not find the book package definition (OPF).',
    )
  }

  const opfBytes = getFile(files, opfPath)
  if (!opfBytes) {
    throw new ConversionError(
      "This isn't a valid EPUB.",
      'The book package (OPF) is missing from the archive.',
    )
  }

  const opf = parseDocument(decodeText(opfBytes), { xmlMode: true, decodeEntities: true })
  const opfDir = dirOf(opfPath)

  const title = firstText(opf, 'title')
  const author = firstText(opf, 'creator')

  const manifest = new Map<string, ManifestItem>()
  for (const item of findElements(opf, 'item')) {
    const id = attr(item, 'id')
    const href = attr(item, 'href')
    if (id && href) {
      manifest.set(id, { id, href, mediaType: attr(item, 'media-type') })
    }
  }

  const chapters: Array<{ href: string; path: string }> = []
  for (const ref of findElements(opf, 'itemref')) {
    const idref = attr(ref, 'idref')
    const item = idref ? manifest.get(idref) : undefined
    if (item) chapters.push({ href: item.href, path: resolveHref(opfDir, item.href) })
  }

  if (chapters.length === 0) {
    throw new ConversionError(
      'This EPUB has no readable chapters.',
      'The book may be empty or use an unsupported structure.',
    )
  }

  return { files, title, author, chapters, manifest, opfDir }
}

function firstText(root: AnyNode, localName: string): string | undefined {
  for (const el of findElements(root, localName)) {
    const text = DomUtils.textContent(el).trim()
    if (text) return text
  }
  return undefined
}

const SKIP_TAGS = new Set([
  'script',
  'style',
  'head',
  'title',
  'meta',
  'link',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'noscript',
])

const HEADING_NAMES = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

const BLOCK_CONTAINERS = new Set([
  'div',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'main',
  'center',
  'figure',
])

export function htmlToBlocks(html: string): Block[] {
  const doc = parseDocument(html, { xmlMode: false, decodeEntities: true })
  const out: Block[] = []
  walkBlocks(DomUtils.getChildren(doc), out)
  return out
}

function walkBlocks(nodes: AnyNode[], out: Block[]): void {
  for (const node of nodes) {
    if (isText(node)) {
      const text = node.data.replace(/[\u00a0\t\r\n]/g, ' ')
      if (text.trim()) out.push({ kind: 'paragraph', runs: [{ text: text.trim() }] })
      continue
    }
    if (!isTag(node)) continue

    const name = localNameOf(node.name)
    if (SKIP_TAGS.has(name)) continue

    if (HEADING_NAMES.has(name)) {
      const runs = inlineRuns(DomUtils.getChildren(node))
      if (runs.length) out.push({ kind: 'heading', level: Number(name[1]), runs })
      continue
    }

    switch (name) {
      case 'p':
        pushParagraph(out, inlineRuns(DomUtils.getChildren(node)))
        break
      case 'blockquote': {
        const runs = inlineRuns(DomUtils.getChildren(node))
        if (runs.length) out.push({ kind: 'blockquote', runs })
        break
      }
      case 'ul':
      case 'ol': {
        const ordered = name === 'ol'
        let index = 1
        for (const child of DomUtils.getChildren(node)) {
          if (isTag(child) && localNameOf(child.name) === 'li') {
            const runs = inlineRuns(DomUtils.getChildren(child))
            if (runs.length) out.push({ kind: 'listItem', ordered, index, runs })
            index += 1
          } else if (isTag(child)) {
            walkBlocks(DomUtils.getChildren(child), out)
          }
        }
        break
      }
      case 'li': {
        const runs = inlineRuns(DomUtils.getChildren(node))
        if (runs.length) out.push({ kind: 'listItem', ordered: false, index: 0, runs })
        break
      }
      case 'img': {
        out.push({
          kind: 'image',
          image: null,
          src: attr(node, 'src'),
          alt: attr(node, 'alt') || undefined,
        })
        break
      }
      case 'hr':
        out.push({ kind: 'rule' })
        break
      case 'pre': {
        const text = DomUtils.textContent(node).replace(/\u00a0/g, ' ')
        if (text.trim()) out.push({ kind: 'paragraph', runs: [{ text: text.trim(), mono: true }] })
        break
      }
      case 'table': {
        const text = DomUtils.textContent(node).replace(/[\u00a0\t\r\n]+/g, ' ').trim()
        if (text) out.push({ kind: 'paragraph', runs: [{ text }] })
        break
      }
      default: {
        if (BLOCK_CONTAINERS.has(name)) walkBlocks(DomUtils.getChildren(node), out)
        else if (DomUtils.getChildren(node).length > 0) walkBlocks(DomUtils.getChildren(node), out)
        break
      }
    }
  }
}

function pushParagraph(out: Block[], runs: TextRun[]): void {
  const trimmed = trimRuns(runs)
  if (trimmed.length) out.push({ kind: 'paragraph', runs: trimmed })
}

function trimRuns(runs: TextRun[]): TextRun[] {
  const copy = runs.map((r) => ({ ...r }))
  while (copy.length) {
    const first = copy[0]
    const stripped = first.text.replace(/^\s+/, '')
    if (stripped) {
      copy[0] = { ...first, text: stripped }
      break
    }
    copy.shift()
  }
  while (copy.length) {
    const last = copy[copy.length - 1]
    const stripped = last.text.replace(/\s+$/, '')
    if (stripped) {
      copy[copy.length - 1] = { ...last, text: stripped }
      break
    }
    copy.pop()
  }
  return copy
}

function inlineRuns(nodes: AnyNode[]): TextRun[] {
  const runs: TextRun[] = []
  const visit = (node: AnyNode, style: TextStyle, vertical: 'sub' | 'sup' | null): void => {
    if (isText(node)) {
      const text = node.data.replace(/[\u00a0\t\r\n]/g, ' ')
      if (text.length) {
        runs.push({
          text,
          ...style,
          ...(vertical ? { vertical } : {}),
        })
      }
      return
    }
    if (!isTag(node)) return

    const name = localNameOf(node.name)
    if (SKIP_TAGS.has(name)) return
    if (name === 'br') {
      runs.push({ text: '\n', ...style })
      return
    }
    if (name === 'img') {
      const alt = attr(node, 'alt')
      if (alt) runs.push({ text: alt, ...style })
      return
    }

    const childStyle: TextStyle = { ...style }
    if (name === 'b' || name === 'strong') childStyle.bold = true
    if (name === 'i' || name === 'em') childStyle.italic = true
    if (name === 'code' || name === 'tt') childStyle.mono = true
    const childVertical = name === 'sub' ? 'sub' : name === 'sup' ? 'sup' : vertical

    for (const child of DomUtils.getChildren(node)) visit(child, childStyle, childVertical)
  }

  for (const node of nodes) visit(node, {}, null)
  return mergeRuns(runs)
}

function mergeRuns(runs: TextRun[]): TextRun[] {
  const out: TextRun[] = []
  for (const run of runs) {
    const last = out[out.length - 1]
    if (last && sameStyle(last, run)) {
      last.text += run.text
    } else {
      out.push({ ...run })
    }
  }
  return out
}

function sameStyle(a: TextRun, b: TextRun): boolean {
  return (
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.mono === !!b.mono &&
    (a.vertical ?? null) === (b.vertical ?? null)
  )
}

const WINANSI_EXTRA = new Set<number>([
  0x152, 0x153, 0x160, 0x161, 0x178, 0x17d, 0x17e, 0x192, 0x2c6, 0x2dc, 0x2013, 0x2014, 0x2018,
  0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2039, 0x203a,
  0x20ac, 0x2122,
])

const WINANSI_FALLBACK: Record<number, string> = {
  0x2010: '-',
  0x2011: '-',
  0x2012: '-',
  0x2015: '\u2014',
  0x2043: '-',
  0x2212: '-',
  0x2000: ' ',
  0x2001: ' ',
  0x2002: ' ',
  0x2003: ' ',
  0x2007: ' ',
  0x2008: ' ',
  0x2009: ' ',
  0x200a: ' ',
  0x202f: ' ',
  0x205f: ' ',
  0x3000: ' ',
}

export function sanitizeForFont(text: string, winAnsiOnly: boolean): string {
  let out = ''
  for (const ch of text) {
    const code = ch.codePointAt(0) as number
    if (code === 0x00a0) {
      out += ' '
      continue
    }
    if (code === 0x00ad) continue
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) continue
    if (!winAnsiOnly) {
      out += ch
      continue
    }
    if (code <= 0x7e || (code >= 0xa0 && code <= 0xff) || WINANSI_EXTRA.has(code)) {
      out += ch
      continue
    }
    out += WINANSI_FALLBACK[code] ?? '?'
  }
  return out
}

export function resolveImage(
  files: Record<string, Uint8Array>,
  baseDir: string,
  src: string,
): ResolvedImage | null {
  if (!src) return null
  const path = resolveHref(baseDir, src)
  const bytes = getFile(files, path)
  if (!bytes) return null

  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : null
  if (!mime) return null

  const head = bytes.slice(0, 64 * 1024)
  const dims = readImageDimensions(head.buffer as ArrayBuffer)
  if (!dims) return null

  return { bytes, mime, width: dims.width, height: dims.height }
}
