# Format Converter — project notes

Client-side file conversion web app ("Swiss Army knife"). Everything runs in the
browser — files never leave the device (privacy is the core selling point).

## Stack
- React 19 + Vite + TypeScript (`npm run dev` / `npm run build` / `npm run lint`)

## What's built
- **Converters**: HEIC→JPG (`heic2any`), DOCX→Markdown (`mammoth` + `turndown`),
  CSV→JSON (`papaparse`). Heavy libs are code-split via dynamic `import()`.
- **Freemium**: free = single file; Pro = batch convert + "Download as ZIP".
  Demo key `PRO-DEMO-2026` unlocks Pro (persisted in `localStorage`).
- **Error reporting**: converters detect *why* a file fails and show an actionable
  hint (e.g. "old .doc, re-save as .docx").

## License validation (payment) — IN PROGRESS
Goal: real Pro key validation via Lemon Squeezy (they're merchant of record, issue
keys, handle sales tax). Plan was done in 3 pieces:

- **Piece 1 (DONE)**: `worker/` — a Cloudflare Worker relay that calls the Lemon
  Squeezy License API (`POST /v1/licenses/validate`, no API key needed — the License
  API is public; the worker exists only to get around CORS).
- **Piece 2 (DONE)**: `src/pro/license.ts` `verifyLicenseKey()` calls the worker via
  `VITE_LICENSE_URL` (see `.env.example`). Falls back to the demo key when unset.
  Shows specific reasons (`expired`/`disabled`) on failure.
- **Piece 3 (TODO — next session)**: user creates free Cloudflare + Lemon Squeezy
  accounts, deploy the worker, create the "Pro" product, set `VITE_LICENSE_URL`,
  deploy the site.

## Key files
- `src/converters/` — converter registry (`types.ts` has `Converter` + `ConversionError`)
- `src/lib/batch.ts` — batch pipeline + ZIP (`mapWithConcurrency`, `zipResults`)
- `src/pro/` — Pro state (`ProProvider.tsx`, `usePro.ts`, `license.ts`)
- `worker/` — license relay (Cloudflare Worker, deploy with `wrangler`)

## Open decisions / next steps
- Deploy site (Netlify/Vercel/Cloudflare Pages) — still localhost only.
- Add EPUB→PDF (4th converter originally planned).
- Privacy/"how it works" page for medical/legal audience.
- Tests (none yet).
