import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const { dependencies } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

const deps = Object.keys(dependencies).filter((d) => d !== 'pdfjs-dist')
const external = new RegExp(`^(?:${deps.map((d) => d.replace(/\./g, '\\.')).join('|')})(?:/|$)`)

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/converters/api.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: 'dist-lib',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external,
    },
  },
})