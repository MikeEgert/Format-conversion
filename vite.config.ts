import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import { landingPages } from './src/seo/landingPages.ts'
import { buildLandingPageHtml, extractAssetsFromIndexHtml } from './src/seo/prerender.ts'

const DEFAULT_SITE_ORIGIN = 'https://format-conversion.maidemikkegert.workers.dev'

function prerenderLandingPages(siteOrigin: string): Plugin {
  let outDir = 'dist'

  return {
    name: 'prerender-landing-pages',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const indexHtml = readFileSync(join(outDir, 'index.html'), 'utf8')
      const { scriptTag, cssTag } = extractAssetsFromIndexHtml(indexHtml)

      for (const page of landingPages) {
        const html = buildLandingPageHtml({ page, scriptTag, cssTag, origin: siteOrigin })
        const relPath = page.path.replace(/^\//, '')
        const filePath = join(outDir, relPath, 'index.html')
        mkdirSync(dirname(filePath), { recursive: true })
        writeFileSync(filePath, html)
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteOrigin = env.VITE_SITE_ORIGIN || DEFAULT_SITE_ORIGIN

  return {
    plugins: [react(), prerenderLandingPages(siteOrigin)],
    base: '/',
  }
})
