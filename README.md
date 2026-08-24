# Format Converter

Convert files right in your browser — nothing gets uploaded.

No ads, no watermarks, no "enter your email" step. The file stays on your computer the whole
time, so it's safe even for private documents like medical or legal records.

## What it can do

| Convert | To | Why you'd use it |
| --- | --- | --- |
| Image (PNG / JPG / WebP) | JPG / PNG / WebP | Convert, resize, and compress images between formats |
| HEIC / HEIF | JPG | iPhone photos that won't open on Windows or older apps |
| DOCX | Markdown | Turn a Word document into clean text for notes, blogs, or wikis |
| CSV | JSON | Get spreadsheet data into a format developers and tools can use |
| JSON | CSV | Open API responses and structured data in Excel or Google Sheets |

The heavy lifting is done by open-source libraries —
[libheif-js](https://github.com/catdad-experiments/libheif-js),
[mammoth](https://github.com/mwilliamson/mammoth.js),
[papaparse](https://github.com/mholt/PapaParse),
[fflate](https://github.com/101arrowz/fflate) —
but you don't need to know any of that to use the site.

## Your data stays on your device

- Files are read and converted locally in your browser.
- Nothing is sent to a server.
- There are no analytics or trackers.

## Try it

The site is live at https://format-conversion.maidemikkegert.workers.dev.

To run it locally:

```bash
npm install
npm run dev
```

Then open the URL it prints (usually http://localhost:5173/).

## For developers

The site is deployed to Cloudflare Workers (static assets) via Workers Builds — every push to
`main` rebuilds and redeploys automatically. Build output is configured in `wrangler.jsonc`,
and security headers live in `public/_headers`.

## Roadmap

- More conversions (EPUB → PDF, and others)
