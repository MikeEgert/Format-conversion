# Format Converter — project notes

Client-side file conversion web app ("Swiss Army knife"). Everything runs in the
browser — files never leave the device (privacy is the core selling point).

## Stack
- React 19 + Vite + TypeScript (`npm run dev` / `npm run build` / `npm run lint`)

## What's built
- **Converters**: Image (PNG/JPG/WebP ↔ any), HEIC→JPG (`libheif-js` WASM), DOCX→Markdown
  (`mammoth` + `turndown`), EPUB→PDF (`pdf-lib` + `@pdf-lib/fontkit`), CSV→JSON and
  JSON→CSV (`papaparse`). Heavy libs are code-split via dynamic `import()`.
- **Freemium**: free = single file; Pro = batch convert + "Download as ZIP".
  Pro is unlocked via a license key validated by the worker (`src/pro/license.ts`).
- **Error reporting**: converters detect *why* a file fails and show an actionable
  hint (e.g. "old .doc, re-save as .docx").

## License validation (payment) — NOT DEPLOYED YET
Real Pro key validation via Lemon Squeezy (merchant of record; they issue keys and
handle sales tax). Built in 3 pieces, two done + one still pending:

- **Piece 1 (DONE)**: `worker/` — a Cloudflare Worker relay that calls the Lemon
  Squeezy License API (`POST /v1/licenses/validate`, no API key needed — the License
  API is public; the worker exists only to get around CORS). Hardened: CORS is
  restricted to `ALLOWED_ORIGINS` (not `*`), license keys are length-capped, and a
  best-effort in-memory rate limit is applied per IP. The in-memory limiter is
  per-isolate and unreliable under load — for production, add a Cloudflare WAF rate
  limiting rule in the dashboard rather than relying on it.
- **Piece 2 (DONE)**: `src/pro/license.ts` `verifyLicenseKey()` calls the worker via
  `VITE_LICENSE_URL` (see `.env.example`). Shows specific reasons
  (`expired`/`disabled`) on failure.
- **Piece 3 (PENDING — the worker is NOT deployed)**: Cloudflare + Lemon Squeezy
  accounts exist and the site is live, but `wrangler deploy` was never run for
  `worker/`. Every request to `https://format-conversion-license.maidemikkegert.workers.dev`
  returns Cloudflare `error code: 1042` (no Worker bound), so `verifyLicenseKey()`
  always fails and Pro stays locked. Remaining steps: `wrangler login` (not yet
  authenticated) then `wrangler deploy` from `worker/`, into the account whose
  subdomain is `maidemikkegert`. `.env` already has `VITE_LICENSE_URL` set and the CSP
  `connect-src` already allows the worker origin, so nothing else needs wiring once it
  deploys.

## Key files
- `src/converters/` — converter registry (`types.ts` has `Converter` + `ConversionError`)
- `src/lib/batch.ts` — batch pipeline + ZIP (`mapWithConcurrency`, `zipResults`)
- `src/pro/` — Pro state (`ProProvider.tsx`, `usePro.ts`, `license.ts`)
- `worker/` — license relay (Cloudflare Worker, deploy with `wrangler`)

## Deployment
- Hosted on Cloudflare Workers (static assets), auto-deploys on every push to `main` via
  Workers Builds. `wrangler.jsonc` declares `assets.directory = "./dist"`. Live at
  https://format-conversion.maidemikkegert.workers.dev.
- Security headers are set as real HTTP headers in `public/_headers`.
- `vite.config.ts` sets `base: '/'` (serves at the domain root).

## Open decisions / next steps
- Legal pages (`src/components/Legal.tsx`, routes `#/terms`, `#/privacy`, `#/legal-notice`)
  contain `[placeholder]` fields (name, address, contact, VAT ID) that must be filled in
  before launch. Content is a draft — have it reviewed by a lawyer, especially the
  Impressum (§ 5 TMG / § 18 MStV).
- Security follow-up (HEIC only): PNG/JPEG/WebP sniff dimensions from the file header
  *before* decoding (`src/converters/imageHeaders.ts` `readImageDimensions`), rejecting decode
  bombs up front. HEIC now reads dimensions from the decoded handle (`get_width`/`get_height`,
  which come from the ISO-BMFF `ispe` metadata) *before* the pixel decode/`display` step, so
  oversized images are rejected before the expensive RGBA render.
- Pro is locked for everyone (see License validation above): the worker isn't deployed
  yet, so "Unlock Pro" fails. Note: anyone who unlocked via the old demo key (before it
  was removed) keeps a stale `localStorage` flag and stays "Pro" until they clear site
  data.

## Tests
- Vitest (`npm test`) with unit tests in `src/converters/*.test.ts`. Pure logic is
  extracted (e.g. `parseCsv`, `toCsvRows`, `htmlToMarkdown`) and tested directly;
  browser-only code paths (canvas, createImageBitmap, libheif-js) are covered via
  wrong-file guards or stubbed globals.

## Working conventions
- State your plan briefly before editing (files touched, why) for anything beyond a trivial fix.
- After changes: run `npm run lint` and `npm run build`; fix any errors before calling a task done.
- New converters: implement the `Converter` interface in `src/converters/`, register it,
  code-split any heavy parsing library via dynamic `import()` (see existing converters for pattern).
- Never add code that sends file contents over the network — this app's core promise is
  "files never leave the device." Flag it explicitly if a task seems to require it. !!!
- Never render converted file content as live HTML/JS. Text output goes through `<pre>`
  (auto-escaped); images via `<img>`/`createObjectURL`. The EPUB→PDF converter never renders
  HTML at all — it extracts a text model via `htmlparser2` (scripts/iframes/styles are dropped),
  and it refuses DRM-protected books (`META-INF/encryption.xml`). If a future converter/preview
  needs to render HTML, sanitize it first — otherwise a malicious file could inject scripts
  (XSS) into the visitor's browser.
- Security hardening: CSP, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`,
  and `Permissions-Policy` are set as real HTTP headers via `public/_headers` (Cloudflare
  Workers). The header CSP includes `frame-ancestors 'none'` for clickjacking protection.
  `script-src` uses `'wasm-unsafe-eval'` (not `'unsafe-eval'`): the HEIC decoder is
  `libheif-js/wasm-bundle` (a WebAssembly build) and needs to instantiate WASM, but it never
  calls `eval()`/`new Function()`. `'wasm-unsafe-eval'` only permits WebAssembly compilation
  and can't run arbitrary injected JS, so it's a far smaller CSP risk than `'unsafe-eval'`.
  (The previous `heic2any` decoder was an asm.js build that called `new Function`, which forced
  `'unsafe-eval'`; it was swapped out for `libheif-js` to drop that keyword.) Residual risk is
  contained: the app has no XSS sink (output is auto-escaped `<pre>` or `blob:` images).
  The license worker origin is allowed in the CSP's `connect-src` in `public/_headers`
  (keep it in sync with the `ALLOWED_ORIGINS` in `worker/src/index.js` if it changes).
  The JS frame-busting guard in `src/main.tsx` is kept as redundant defense-in-depth.
- Files over 100 MB (`MAX_FILE_BYTES`) are rejected up front (`assertFileSize`) to avoid
  freezing the tab on a huge/malicious input. Raise it only deliberately.
- DOCX files are also capped by total uncompressed size (`MAX_DOCX_UNCOMPRESSED_BYTES`, 256 MB,
  read from the ZIP central directory without decompressing) to stop zip bombs. Images are
  capped by pixel dimensions (`MAX_IMAGE_DIMENSION`) plus pre-decode header sniffing.
- EPUB files are capped the same way (`MAX_EPUB_UNCOMPRESSED_BYTES`, 256 MB). EPUB→PDF embeds
  Noto Serif (Latin/Greek/Cyrillic) from `public/fonts/` (lazy-loaded via `@pdf-lib/fontkit`);
  if it can't load, it falls back to WinAnsi standard fonts with a character-normalization pass
  (`sanitizeForFont`). CJK/emoji are not covered.
- Don't commit secrets/env values, and don't run `wrangler deploy` or touch `worker/` deploy
  config without asking first.
- Prefer small, focused diffs. No unrelated refactors.
- No tests exist yet — if you add non-trivial logic, add a test alongside it rather than leaving it untested.