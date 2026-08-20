# Format Converter

Convert files right in your browser — nothing gets uploaded.

No ads, no watermarks, no "enter your email" step. The file stays on your computer the whole
time, so it's safe even for private documents like medical or legal records.

## What it can do

| Convert | To | Why you'd use it |
| --- | --- | --- |
| HEIC / HEIF | JPG | iPhone photos that won't open on Windows or older apps |
| DOCX | Markdown | Turn a Word document into clean text for notes, blogs, or wikis |
| CSV | JSON | Get spreadsheet data into a format developers and tools can use |

The heavy lifting is done by open-source libraries —
[heic2any](https://github.com/alexcorvi/heic2any),
[mammoth](https://github.com/mwilliamson/mammoth.js),
[papaparse](https://github.com/mholt/PapaParse),
[fflate](https://github.com/101arrowz/fflate) —
but you don't need to know any of that to use the site.

## Free vs Pro

- **Free** — convert one file at a time.
- **Pro** — batch convert many files at once and download them all as a single ZIP.

## Your data stays on your device

- Files are read and converted locally in your browser.
- Nothing is sent to a server.
- There are no analytics or trackers.

## Try it

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173/).

To preview the Pro features without paying, enter the demo key in the upgrade dialog:
`PRO-DEMO-2026`.

## For developers

Pro is gated by a license key. Because everything runs in the browser, the check is just a stub
in [`src/pro/license.ts`](src/pro/license.ts) — connect it to a payment provider (Lemon Squeezy,
Stripe, Paddle) or your own server before charging real money.

## Roadmap

- Connect the license check to a real payment provider
- More conversions (EPUB → PDF, and others)
