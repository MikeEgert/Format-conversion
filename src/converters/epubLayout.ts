import type { Block, ResolvedImage, TextRun, TextStyle } from './epubContent'

export interface PageConfig {
  pageWidth: number
  pageHeight: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  baseSize: number
  lineHeight: number
  paragraphGap: number
  headingGap: number
  indent: number
}

export interface FontMetrics {
  width: (text: string, size: number, style: TextStyle) => number
}

export type PlacedItem =
  | {
      kind: 'text'
      text: string
      x: number
      yTop: number
      size: number
      style: TextStyle
      vertical?: 'sub' | 'sup'
    }
  | { kind: 'image'; x: number; yTop: number; width: number; height: number; image: ResolvedImage }
  | { kind: 'rule'; x: number; yTop: number; width: number }

export interface Page {
  items: PlacedItem[]
}

export const DEFAULT_PAGE_CONFIG: PageConfig = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginLeft: 64,
  marginRight: 64,
  marginTop: 72,
  marginBottom: 72,
  baseSize: 12,
  lineHeight: 1.35,
  paragraphGap: 8,
  headingGap: 12,
  indent: 24,
}

const HEADING_SCALE: Record<number, number> = {
  1: 2,
  2: 1.6,
  3: 1.35,
  4: 1.15,
  5: 1,
  6: 0.9,
}

interface Token {
  word: string
  style: TextStyle
  vertical?: 'sub' | 'sup'
}

export function layoutBlocks(blocks: Block[], config: PageConfig, measure: FontMetrics): Page[] {
  const pages: Page[] = []
  let page: Page = { items: [] }
  pages.push(page)
  let yTop = config.marginTop

  const contentWidth = config.pageWidth - config.marginLeft - config.marginRight
  const contentHeight = config.pageHeight - config.marginTop - config.marginBottom
  const contentBottom = config.pageHeight - config.marginBottom

  const newPage = () => {
    page = { items: [] }
    pages.push(page)
    yTop = config.marginTop
  }

  const ensure = (needed: number) => {
    if (yTop + needed > contentBottom) newPage()
  }

  const gap = (amount: number) => {
    if (yTop > config.marginTop) yTop += amount
  }

  for (const block of blocks) {
    switch (block.kind) {
      case 'pageBreak':
        newPage()
        break
      case 'paragraph':
      case 'blockquote':
      case 'listItem':
      case 'heading': {
        const isHeading = block.kind === 'heading'
        const size = isHeading ? config.baseSize * HEADING_SCALE[block.level] : config.baseSize
        const baseStyle: TextStyle = {
          bold: isHeading ? true : block.kind === 'listItem' ? false : undefined,
          italic: block.kind === 'blockquote' ? true : undefined,
        }
        const indent =
          block.kind === 'listItem' || block.kind === 'blockquote' ? config.indent : 0

        const marker =
          block.kind === 'listItem'
            ? block.ordered
              ? `${block.index}. `
              : '\u2022 '
            : null

        if (isHeading) {
          ensure(config.lineHeight * size * 2 + config.headingGap)
        } else {
          ensure(config.lineHeight * size)
        }
        gap(isHeading ? config.headingGap : config.paragraphGap)

        if (marker) {
          const markerWidth = measure.width(marker, size, baseStyle)
          page.items.push({
            kind: 'text',
            text: marker,
            x: config.marginLeft + indent - markerWidth - 4,
            yTop,
            size,
            style: baseStyle,
          })
        }

        const contentX = config.marginLeft + indent
        const segLines = tokenizeLines(block.runs)
        for (const segment of segLines) {
          const lines = wrap(segment, contentWidth - indent, size, measure)
          for (const line of lines) {
            ensure(config.lineHeight * size)
            let x = contentX
            for (const token of line) {
              const ts = token.vertical ? size * 0.7 : size
              const wordWidth = measure.width(token.word, ts, token.style)
              const spaceWidth = measure.width(' ', ts, token.style)
              page.items.push({
                kind: 'text',
                text: token.word,
                x,
                yTop,
                size: ts,
                style: token.style,
                vertical: token.vertical,
              })
              x += wordWidth + spaceWidth
            }
            yTop += config.lineHeight * size
          }
        }
        if (isHeading) gap(config.headingGap)
        break
      }
      case 'image': {
        if (!block.image) break
        const img = block.image
        if (img.width <= 0 || img.height <= 0) break
        let width = contentWidth
        let height = (img.height / img.width) * width
        if (height > contentHeight) {
          height = contentHeight
          width = (img.width / img.height) * height
        }
        if (width > contentWidth) {
          width = contentWidth
          height = (img.height / img.width) * width
        }
        gap(config.paragraphGap)
        ensure(height + 4)
        page.items.push({
          kind: 'image',
          x: config.marginLeft,
          yTop,
          width,
          height,
          image: img,
        })
        yTop += height + 4
        break
      }
      case 'rule':
        gap(config.paragraphGap)
        ensure(14)
        page.items.push({
          kind: 'rule',
          x: config.marginLeft,
          yTop: yTop + 6,
          width: contentWidth,
        })
        yTop += 14
        break
    }
  }

  return pages.filter((p) => p.items.length > 0)
}

function tokenizeLines(runs: TextRun[]): Token[][] {
  const lines: Token[][] = [[]]
  for (const run of runs) {
    const parts = run.text.split('\n')
    parts.forEach((part, idx) => {
      if (idx > 0) lines.push([])
      const words = part.split(/\s+/).filter((w) => w.length > 0)
      for (const word of words) {
        lines[lines.length - 1].push({
          word,
          style: { bold: run.bold, italic: run.italic, mono: run.mono },
          vertical: run.vertical,
        })
      }
    })
  }
  return lines.filter((line) => line.length > 0)
}

function wrap(tokens: Token[], maxWidth: number, size: number, measure: FontMetrics): Token[][] {
  const lines: Token[][] = []
  let current: Token[] = []
  let lineWidth = 0

  for (const token of tokens) {
    const ts = token.vertical ? size * 0.7 : size
    const wordWidth = measure.width(token.word, ts, token.style)
    const spaceWidth = measure.width(' ', ts, token.style)

    if (current.length === 0) {
      if (wordWidth > maxWidth) {
        for (const chunk of breakLongWord(token.word, ts, token.style, maxWidth, measure)) {
          lines.push([{ ...token, word: chunk }])
        }
        continue
      }
      current.push(token)
      lineWidth = wordWidth
      continue
    }

    if (lineWidth + spaceWidth + wordWidth > maxWidth) {
      lines.push(current)
      current = [token]
      lineWidth = wordWidth
    } else {
      current.push(token)
      lineWidth += spaceWidth + wordWidth
    }
  }

  if (current.length) lines.push(current)
  return lines
}

function breakLongWord(
  word: string,
  size: number,
  style: TextStyle,
  maxWidth: number,
  measure: FontMetrics,
): string[] {
  const chunks: string[] = []
  let current = ''
  for (const ch of word) {
    if (current && measure.width(current + ch, size, style) > maxWidth) {
      chunks.push(current)
      current = ch
    } else {
      current += ch
    }
  }
  if (current) chunks.push(current)
  return chunks
}
