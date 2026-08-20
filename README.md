# Format Converter

A client-side Swiss Army knife for file conversions. Convert files right in your browser — nothing is uploaded, so there are no ads, watermarks, or privacy worries.

## Conversions

| From | To | Notes |
| --- | --- | --- |
| HEIC/HEIF | JPG | Uses `heic2any` (libheif) in-browser |
| DOCX | Markdown | Uses `mammoth` + `turndown` |
| CSV | JSON | Uses `papaparse` |

## Pricing model (freemium)

- **Free** — convert one file at a time.
- **Pro** — batch conversion + one-click ZIP download.

Pro is gated by a license key. Since everything is client-side, the check is a stub in
[`src/pro/license.ts`](src/pro/license.ts) — wire it to Lemon Squeezy, Stripe, Paddle, or your own
backend. For local testing, use the demo key: `PRO-DEMO-2026`.

## How it works

- **100% client-side** — files are read and converted locally in your browser and never leave your device.
- **Lazy-loaded converters** — heavy conversion libraries (`heic2any`, `mammoth`) are code-split and only downloaded when you actually use them.
- **Batch pipeline** — `mapWithConcurrency` + `zipResults` in [`src/lib/batch.ts`](src/lib/batch.ts) power the Pro tier.

## Development

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

## Roadmap

- Wire the license check to a real payment provider
- More conversions (EPUB → PDF, and others)
