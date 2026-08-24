const PIPELINE = [
  {
    title: 'Load into memory',
    text: 'Your file is read into a JavaScript Blob and held in your tab\u2019s memory. No bytes leave your device.',
  },
  {
    title: 'Parse locally',
    text: 'The converter decodes the format in-browser: HEIC via libheif compiled to WebAssembly, DOCX unzipped in memory and read by Mammoth, CSV parsed by PapaParse.',
  },
  {
    title: 'Encode locally',
    text: 'A new file \u2014 JPG, Markdown, or JSON \u2014 is built in memory. Encoding, like decoding, runs entirely inside your tab.',
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

        <h2>Why this matters for sensitive documents</h2>
        <p>
          Because your content never crosses the network boundary, it cannot be intercepted in
          transit or exposed by a server breach &mdash; there is simply no copy on any server to
          leak. That makes FoldenLoom suitable for medical records, client-legal documents, and
          student work. You should still follow your own confidentiality obligations and verify
          every output before relying on it.
        </p>

        <h2>Honest limitations</h2>
        <ul>
          <li>Files over 100&nbsp;MB are rejected up front to keep the tab responsive.</li>
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
