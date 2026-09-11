import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`
const OUT_DIR = new URL('../docs/screenshots/', import.meta.url)

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server did not become ready at ${url}`)
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: 'inherit',
})
let failed = false

try {
  await waitForServer(BASE_URL)
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.screenshot({ path: new URL('landing.png', OUT_DIR).pathname, fullPage: true })

  await page.goto(`${BASE_URL}/#/tool`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: new URL('tool.png', OUT_DIR).pathname, fullPage: true })

  await browser.close()
} catch (err) {
  failed = true
  console.error(err)
} finally {
  preview.kill()
}

if (failed) process.exit(1)
console.log(`Screenshots saved to ${OUT_DIR.pathname}`)