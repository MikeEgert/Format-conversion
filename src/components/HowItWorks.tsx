const SECTIONS = [
  { id: 'conversion-steps', label: 'The conversion steps' },
  { id: 'formats-and-engines', label: 'Formats and engines' },
  { id: 'network-and-privacy', label: 'Network and privacy' },
  { id: 'sensitive-documents', label: 'Sensitive documents' },
  { id: 'limits-and-accuracy', label: 'Limits and accuracy' },
]

const PIPELINE = [
  {
    title: 'Load into your browser',
    text: 'When you choose a file, your browser gives this tab access to it as a File/Blob. Its contents are read locally; they are not uploaded.',
  },
  {
    title: 'Parse locally',
    text: 'The converter decodes the format in your tab. Depending on the file, it uses the browser image engine, WebAssembly, or a JavaScript parser. DOCX and EPUB archives are unpacked in memory.',
  },
  {
    title: 'Build the new file',
    text: 'The output file is encoded in your tab. The conversion runs on your device, using your own CPU and memory.',
  },
  {
    title: 'Download from memory',
    text: 'The download button uses URL.createObjectURL(): a blob: URL pointing to data in your browser, not a server. Your original file is left untouched.',
  },
]

export function HowItWorksPage() {
  return (
    <main className="main legal how-page">
      <div className="legal-header how-header">
        <span className="how-eyebrow">Inside your browser</span>
        <h1>How it works &mdash; and why it&apos;s private</h1>
        <p className="how-intro">
          FoldenLoom converts files on your device. This page explains the steps, the software
          involved, what does use the network, and the limits you should know about.
        </p>
      </div>

      <div className="how-layout">
        <nav className="how-toc" aria-label="On this page">
          <span className="how-toc-title">On this page</span>
          {SECTIONS.map((section) => (
            <button
              type="button"
              key={section.id}
              onClick={() => document.getElementById(section.id)?.scrollIntoView()}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <div className="how-content">
          <section className="how-section" id="conversion-steps" aria-labelledby="conversion-steps-title">
            <div className="how-section-heading">
              <span className="how-section-label">01 / The process</span>
              <h2 id="conversion-steps-title">From file to download</h2>
              <p>The entire conversion takes place in your browser tab, in this order.</p>
            </div>
            <ol className="how-steps two how-page-steps">
              {PIPELINE.map((step, i) => (
                <li className="how-step" key={step.title}>
                  <span className="how-step-num" aria-hidden="true">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="how-section" id="formats-and-engines" aria-labelledby="formats-and-engines-title">
            <div className="how-section-heading">
              <span className="how-section-label">02 / Under the hood</span>
              <h2 id="formats-and-engines-title">Which engine converts what</h2>
              <p>These libraries run in your tab. Heavy parsers are downloaded only when needed.</p>
            </div>
            <div className="how-engine-list">
              <div><h3>Images</h3><p>PNG, JPG, and WebP use your browser&apos;s image engine and canvas. HEIC &rarr; JPG uses libheif compiled to WebAssembly.</p></div>
              <div><h3>Documents</h3><p>DOCX &rarr; Markdown uses Mammoth and Turndown after unpacking the document in memory. PDF &rarr; DOCX uses pdf.js to extract selectable text and builds a new Word file; it does not perform OCR.</p></div>
              <div><h3>E-books</h3><p>EPUB &rarr; PDF parses the book in memory and lays its text out again with pdf-lib. DRM-protected books are refused, and embedded HTML is never rendered as a live page.</p></div>
              <div><h3>Data</h3><p>CSV &harr; JSON uses PapaParse. XLSX/XLS &rarr; CSV, XLSX &rarr; JSON, CSV &rarr; XLSX, and JSON &rarr; XLSX use SheetJS for spreadsheets.</p></div>
            </div>
          </section>

          <section className="how-section" id="network-and-privacy" aria-labelledby="network-and-privacy-title">
            <div className="how-section-heading">
              <span className="how-section-label">03 / Your data</span>
              <h2 id="network-and-privacy-title">What uses the network</h2>
              <p>Conversion has no upload step. Other parts of the website still make ordinary network requests:</p>
            </div>
            <ul className="how-detail-list">
              <li>The browser downloads the app&apos;s HTML, CSS, JavaScript, fonts, and any converter code or WebAssembly codec needed for the format you choose.</li>
              <li>Cloudflare serves those files and may log request metadata such as your IP address. Cookieless, aggregate page-view analytics can also run; they do not track file contents or conversion activity.</li>
              <li>If you enter a Pro license key, that key is sent to the license-validation worker. Your files are not sent with it.</li>
              <li>Your theme preference, optional analytics opt-out flag, and any saved Pro key are stored in your browser&apos;s localStorage. The key is sent again when it is re-verified.</li>
            </ul>
            <div className="how-callout">
              <strong>What never crosses the network</strong>
              <p>Neither the selected file nor its converted output is sent to a conversion server. We cannot receive, inspect, or retain either file.</p>
            </div>
            <p>No account or sign-in is required. The site uses no cookies, cross-site tracking, or advertising.</p>
          </section>

          <section className="how-section" id="sensitive-documents" aria-labelledby="sensitive-documents-title">
            <div className="how-section-heading">
              <span className="how-section-label">04 / Trust and responsibility</span>
              <h2 id="sensitive-documents-title">For sensitive documents</h2>
              <p>Your content is not uploaded, so there is no server-side copy of the file to retain or leak. Local processing still has practical limits.</p>
            </div>
            <h3>What we do to reduce risk</h3>
            <ul className="how-detail-list">
              <li>The site is served over HTTPS with security headers, including a restrictive Content-Security-Policy and no referrer forwarding. The policy limits connections to the app, the license worker, and Cloudflare analytics.</li>
              <li>Decoded image data is released after encoding, and preview object URLs are revoked when they are no longer needed.</li>
              <li>Third-party parsing libraries run locally inside your browser&apos;s sandbox.</li>
            </ul>
            <h3>What you remain responsible for</h3>
            <ul className="how-detail-list">
              <li>Follow your own confidentiality and compliance obligations, including professional duties or data-protection rules. Local conversion alone does not make an activity compliant.</li>
              <li>Check the converted file before relying on it. JPG can lose image detail, and document conversions can lose layout or reorder content.</li>
              <li>Keep your original. Results are not backed up; closing or crashing the tab can lose an in-memory result.</li>
            </ul>
            <h3>What local processing cannot prevent</h3>
            <ul className="how-detail-list">
              <li>A compromised device, malicious browser extension, or someone using your unlocked computer can access data in the tab&apos;s memory.</li>
              <li>Your internet provider or network administrator may see that you visited this website and when, though the files you convert are not transmitted.</li>
            </ul>
          </section>

          <section className="how-section" id="limits-and-accuracy" aria-labelledby="limits-and-accuracy-title">
            <div className="how-section-heading">
              <span className="how-section-label">05 / Before you start</span>
              <h2 id="limits-and-accuracy-title">Limits and accuracy</h2>
            </div>
            <ul className="how-detail-list">
              <li>Use a current version of Chrome, Edge, Firefox, or Safari on desktop or mobile. HEIC conversion requires WebAssembly.</li>
              <li>Files over 100&nbsp;MB are rejected to keep the tab responsive. DOCX, EPUB, and XLSX archives are also capped at 256&nbsp;MB of uncompressed content.</li>
              <li>Images are limited to 16,384 pixels per side and 50 megapixels in total.</li>
              <li>EPUB &rarr; PDF embeds Noto Serif for Latin, Greek, and Cyrillic text; CJK and emoji are not covered. It embeds PNG and JPEG images, flattens tables to text, and cannot perfectly map reflowable books to fixed pages.</li>
              <li>PDF &rarr; DOCX extracts text from digital PDFs. Scanned or image-only PDFs need OCR elsewhere. Styling and images are not rebuilt, and merged or multi-line table cells may be reordered.</li>
              <li>Conversion speed depends on your device&apos;s CPU and available memory.</li>
            </ul>
            <p className="how-final-note">Always review the downloaded file before using it as a replacement for the original.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
