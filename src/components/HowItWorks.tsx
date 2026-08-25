const PIPELINE = [
  {
    title: 'Load into memory',
    text: 'Your file is read into a JavaScript Blob and held in your tab\u2019s memory. No bytes leave your device.',
  },
  {
    title: 'Parse locally',
    text: 'The converter decodes the format in-browser: HEIC via libheif compiled to WebAssembly, DOCX and EPUB unzipped in memory, CSV and JSON parsed by PapaParse, and PNG/JPG/WebP decoded by the browser\u2019s own image engine.',
  },
  {
    title: 'Encode locally',
    text: 'A new file \u2014 JPG, PNG, WebP, Markdown, CSV, JSON, or PDF \u2014 is built in memory. Encoding, like decoding, runs entirely inside your tab.',
  },
  {
    title: 'Download from memory',
    text: 'The download button uses URL.createObjectURL(): a blob: URL that points at your browser\u2019s own memory, not a server.',
  },
]

export function HowItWorksPage() {
  return (
    <main className="main legal">
      <div className="legal-header">
        <a className="btn btn-ghost" href="#/">
          &larr; Back
        </a>
        <h1>How it works &mdash; and why it&apos;s private</h1>
        <p className="legal-updated">
          Everything runs inside your browser tab. There is no upload step and no server-side
          processing.
        </p>
      </div>

      <div className="legal-body">
        <p>
          FoldenLoom converts files entirely on your device. Here is the actual, technical
          sequence, so you can see exactly where your data goes.
        </p>

        <h2>The conversion pipeline</h2>
        <div className="how-steps two">
          {PIPELINE.map((step, i) => (
            <div className="how-step" key={step.title}>
              <span className="how-step-num">{i + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>

        <h2>Which engine converts what</h2>
        <ul>
          <li>
            <strong>Image</strong> (PNG, JPG, WebP in any direction): your browser&apos;s built-in
            image engine, drawn onto a canvas. No external codec.
          </li>
          <li>
            <strong>HEIC &rarr; JPG</strong>: libheif, compiled to WebAssembly and run inside your
            tab.
          </li>
          <li>
            <strong>DOCX &rarr; Markdown</strong>: Mammoth + Turndown, after the document is
            unzipped in memory.
          </li>
          <li>
            <strong>EPUB &rarr; PDF</strong>: parsed in memory and re-laid-out into a text PDF.
            DRM-protected books are detected and refused, and embedded HTML is never rendered as
            a live page.
          </li>
          <li>
            <strong>CSV &rarr; JSON</strong> and <strong>JSON &rarr; CSV</strong>: PapaParse.
          </li>
        </ul>
        <p>All of these run locally. None of them has a network step.</p>

        <h2>What your browser actually downloads</h2>
        <ul>
          <li>
            The only network traffic is loading the app itself: the static HTML, CSS, and
            JavaScript (plus the WebAssembly codecs) served when you open the page.
          </li>
          <li>
            Heavy parsers &mdash; the HEIC codec and the DOCX-to-Markdown pipeline &mdash; are
            code-split and only fetched the first time you use them.
          </li>
          <li>
            There is no upload endpoint and no code path that sends file contents over the
            network. The app is built so files never leave the device.
          </li>
        </ul>

        <h2>What we never do</h2>
        <div className="privacy">
          <ul className="privacy-list">
            <li>No accounts, no sign-in, no cookies.</li>
            <li>No analytics, no tracking, no advertising.</li>
            <li>We never receive, see, or store your files.</li>
            <li>
              The only thing saved locally is a license-key flag in your browser&apos;s
              localStorage &mdash; and it never leaves your device.
            </li>
          </ul>
        </div>

        <h2>For sensitive documents (medical and legal)</h2>
        <p>
          Because your content never crosses the network boundary, it cannot be intercepted in
          transit or exposed by a server breach &mdash; there is no copy on any server to leak.
          This is why the tool is used for medical records, client-legal documents, and student
          work.
        </p>
        <ul>
          <li>
            <strong>No upload step exists.</strong> The application has no endpoint that accepts
            file contents, and no code path sends them over the network.
          </li>
          <li>
            <strong>Nothing is retained.</strong> Converted output exists only in your tab&apos;s
            memory until you download it or close the page. There is no server-side copy to retain
            or delete.
          </li>
          <li>
            <strong>The hosting provider sees request metadata only.</strong> Cloudflare serves the
            app&apos;s static files and may log technical data such as your IP address to do so
            &mdash; but never the contents of your files, which are not transmitted.
          </li>
        </ul>
        <p>Local processing does <em>not</em> remove your own responsibilities. You remain responsible for:</p>
        <ul>
          <li>
            Following your own confidentiality and compliance obligations (for example,
            professional duties or data-protection rules such as the GDPR). Running a conversion
            locally does not, on its own, make a processing activity compliant.
          </li>
          <li>
            Verifying the output. Some conversions are lossy &mdash; JPG drops detail, and
            DOCX-to-Markdown can drop layout &mdash; so a converted file may differ from the
            original. Review it before relying on it.
          </li>
          <li>
            Keeping your originals. Nothing is backed up, and a closed or crashed tab loses the
            result.
          </li>
        </ul>
        <h3>What we do to minimize risk</h3>
        <ul>
          <li>
            The site is served over HTTPS with strict security headers (HSTS, a restrictive
            Content-Security-Policy, and no referrer forwarding), so your internet provider can
            see only that you visited this domain &mdash; never which file or what you converted.
          </li>
          <li>
            Decoded image data is released from memory as soon as the new file is encoded, and
            preview object URLs are revoked when they are no longer needed, so converted content
            is not held any longer than necessary.
          </li>
          <li>
            Third-party parsing libraries run locally in your browser&apos;s sandbox, and a strict
            Content-Security-Policy blocks connections to any other origin.
          </li>
        </ul>
        <h3>What we cannot prevent</h3>
        <ul>
          <li>
            A compromised device, a malicious browser extension, or someone with access to your
            unlocked computer can read whatever your tab has in memory. No client-side tool can
            defend against a device that is already compromised.
          </li>
          <li>
            Your internet service provider (or network administrator) can still see that you
            visited this website and when, though not the files you convert.
          </li>
        </ul>

        <h2>Honest limitations</h2>
        <ul>
          <li>Files over 100&nbsp;MB are rejected up front to keep the tab responsive.</li>
          <li>Images are limited to 16,384 pixels on their longest side.</li>
          <li>
            DOCX documents are limited to 256&nbsp;MB of uncompressed content, measured from the
            file&apos;s archive directory before anything is extracted.
          </li>
          <li>
            EPUB&rarr;PDF embeds the Noto Serif font (Latin, Greek, and Cyrillic scripts; CJK and
            emoji are not covered), embeds only PNG and JPEG images, and flattens tables to plain
            text. Reflowable e-books never map perfectly onto fixed pages.
          </li>
          <li>Conversion runs on your own CPU, so speed depends on your device.</li>
          <li>
            Nothing is backed up: if your tab closes or crashes mid-conversion, the in-memory
            result is gone. Keep your originals.
          </li>
          <li>Always check the converted output before relying on it.</li>
        </ul>

        <div className="modal-actions">
          <a href="#/tool" className="btn btn-primary">
            Start converting
          </a>
        </div>
      </div>
    </main>
  )
}
