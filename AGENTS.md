# Format Converter — project notes

Client-side file conversion web app ("Swiss Army knife"). Everything runs in the
browser — files never leave the device (privacy is the core selling point).

## Stack
- React 19 + Vite + TypeScript (`npm run dev` / `npm run build` / `npm run lint`)

## What's built
- **Converters**: HEIC→JPG (`heic2any`), DOCX→Markdown (`mammoth` + `turndown`),
  CSV→JSON (`papaparse`). Heavy libs are code-split via dynamic `import()`.
- **Freemium**: free = single file; Pro = batch convert + "Download as ZIP".
  Demo key `PRO-DEMO-2026` unlocks Pro (persisted in `localStorage`). This is a
  temporary stand-in — it should be removed/gated once real license validation
  (below) ships, not treated as permanent behavior to preserve.
- **Error reporting**: converters detect *why* a file fails and show an actionable
  hint (e.g. "old .doc, re-save as .docx").

## License validation (payment) — DEFERRED (do last)
Goal: real Pro key validation via Lemon Squeezy (they're merchant of record, issue
keys, handle sales tax). Plan was done in 3 pieces:

- **Piece 1 (DONE)**: `worker/` — a Cloudflare Worker relay that calls the Lemon
  Squeezy License API (`POST /v1/licenses/validate`, no API key needed — the License
  API is public; the worker exists only to get around CORS).
- **Piece 2 (DONE)**: `src/pro/license.ts` `verifyLicenseKey()` calls the worker via
  `VITE_LICENSE_URL` (see `.env.example`). Falls back to the demo key when unset.
  Shows specific reasons (`expired`/`disabled`) on failure.
- **Piece 3 (DEFERRED — do last)**: user creates free Cloudflare + Lemon Squeezy
  accounts, deploy the worker, create the "Pro" product, set `VITE_LICENSE_URL`,
  deploy the site.

## Key files
- `src/converters/` — converter registry (`types.ts` has `Converter` + `ConversionError`)
- `src/lib/batch.ts` — batch pipeline + ZIP (`mapWithConcurrency`, `zipResults`)
- `src/pro/` — Pro state (`ProProvider.tsx`, `usePro.ts`, `license.ts`)
- `worker/` — license relay (Cloudflare Worker, deploy with `wrangler`)

## Deployment
- Live at https://mikeegert.github.io/Format-conversion/ — GitHub Pages via
  `.github/workflows/deploy.yml` (rebuilds on every push to `main`).
- `vite.config.ts` sets `base: '/Format-conversion/'` so assets resolve under the
  Pages subpath. Don't remove it without also changing the deploy setup.

## Open decisions / next steps
- Add EPUB→PDF (next converter candidate).
- Privacy/"how it works" page for medical/legal audience.
- Payments (Lemon Squeezy) — do last, see above.
- Legal pages (`src/components/Legal.tsx`, routes `#/terms`, `#/privacy`, `#/legal-notice`)
  contain `[placeholder]` fields (name, address, contact, VAT ID) that must be filled in
  before launch. Content is a draft — have it reviewed by a lawyer, especially the
  Impressum (§ 5 TMG / § 18 MStV).
- Security follow-up: the image dimension cap (`MAX_IMAGE_DIMENSION` / `assertImageDimensions`)
  runs *after* decode, so it stops canvas/output blow-ups but not a true "decode bomb" that
  exhausts memory inside `createImageBitmap`. Pre-decode prevention needs per-format header
  sniffing (PNG/JPEG/WebP are easy; HEIC is complex).

## Tests
- Vitest (`npm test`) with unit tests in `src/converters/*.test.ts`. Pure logic is
  extracted (e.g. `parseCsv`, `toCsvRows`, `htmlToMarkdown`) and tested directly;
  browser-only code paths (canvas, createImageBitmap, heic2any) are covered via
  wrong-file guards or stubbed globals.

## Working conventions
- State your plan briefly before editing (files touched, why) for anything beyond a trivial fix.
- After changes: run `npm run lint` and `npm run build`; fix any errors before calling a task done.
- New converters: implement the `Converter` interface in `src/converters/`, register it,
  code-split any heavy parsing library via dynamic `import()` (see existing converters for pattern).
- Never add code that sends file contents over the network — this app's core promise is
  "files never leave the device." Flag it explicitly if a task seems to require it. !!!
- Never render converted file content as live HTML/JS. Text output goes through `<pre>`
  (auto-escaped); images via `<img>`/`createObjectURL`. If a future converter/preview
  (e.g. EPUB) needs to render HTML, sanitize it first — otherwise a malicious file could
  inject scripts (XSS) into the visitor's browser.
- Security hardening: a CSP `<meta>` tag is injected into the production build only
  (`vite.config.ts` `injectCsp`). `unsafe-eval` is required by heic2any. When the Lemon
  Squeezy worker ships (`VITE_LICENSE_URL`), the CSP's `connect-src` must be updated to
  allow that origin or license checks will be blocked.
- Files over 100 MB (`MAX_FILE_BYTES`) are rejected up front (`assertFileSize`) to avoid
  freezing the tab on a huge/malicious input. Raise it only deliberately.
- Don't commit secrets/env values, and don't run `wrangler deploy` or touch `worker/` deploy
  config without asking first.
- Prefer small, focused diffs. No unrelated refactors.
- No tests exist yet — if you add non-trivial logic, add a test alongside it rather than leaving it untested.