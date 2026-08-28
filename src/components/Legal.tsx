import type { ReactNode } from 'react'

function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main className="main legal">
      <div className="legal-header">
        <a className="btn btn-ghost" href="#/">
          &larr; Back
        </a>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
      </div>
      <div className="legal-body">{children}</div>
    </main>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms &amp; Conditions" updated="22 August 2026">
      <h2>1. Service</h2>
      <p>
        FoldenLoom (&ldquo;the Service&rdquo;) is a web application that converts files
        (images, documents, and data) directly in your browser. The Service is operated by{' '}
        FoldenLoom (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
      </p>

      <h2>2. How your files are handled</h2>
      <p>
        All conversion happens locally on your device. Your files are never uploaded to, or
        processed by, any server we operate, and we never receive or store your files. You are
        solely responsible for having the rights to convert any file you use with the Service.
      </p>

      <h2>3. Use of the Service</h2>
      <p>
        Basic conversion is free for single files. Additional features (such as batch conversion
        and ZIP download) may require a license key. A license key grants access to those features
        and does not transfer any ownership of the Service or its software.
      </p>

      <h2>4. No warranty</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without
        warranties of any kind. We do not guarantee that conversions are error-free, complete, or
        fit for a particular purpose. You should verify the output of any conversion before
        relying on it.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for any damages arising from your use of
        the Service, including loss of data or losses resulting from an incorrect conversion. This
        does not affect liability that cannot be excluded under applicable law (such as liability
        for intent or gross negligence).
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        We may change, suspend, or discontinue the Service or its features at any time without
        notice. We may also update these terms; continued use of the Service after a change
        constitutes acceptance of the updated terms.
      </p>

      <h2>7. Governing law</h2>
      <p>
        These terms are governed by the laws of the Federal Republic of Germany. If you are a
        consumer, this does not affect any mandatory consumer-protection provisions of the country
        in which you habitually reside.
      </p>
    </LegalLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="22 August 2026">
      <h2>1. At a glance</h2>
      <p>
        FoldenLoom is built around a simple principle: your files never leave your device.
        All conversion is performed locally in your browser, and we do not operate a server that
        receives, stores, or processes your files.
      </p>

      <h2>2. Data controller</h2>
      <p>
        The controller responsible for this website is FoldenLoom,
        reachable at foldenloom@gmail.com.
      </p>

      <h2>3. What we do not process</h2>
      <ul>
        <li>We do not collect, upload, or see the files you convert.</li>
        <li>We do not require accounts, and we do not use cookies, analytics, tracking, or advertising.</li>
        <li>We do not currently process payments or payment data on this site.</li>
      </ul>

      <h2>4. Browser storage</h2>
      <p>
        If you activate a license key, it is stored locally in your browser&apos;s storage
        (localStorage) on your device. This is not a cookie and is never transmitted to us. You can
        remove it at any time by clearing your browser&apos;s site data.
      </p>

      <h2>5. Hosting</h2>
      <p>
        The website is delivered as static files via the Cloudflare network (Cloudflare, Inc.). As
        is standard for any website, the hosting provider&apos;s servers may log technical data
        necessary to deliver the page (such as your IP address). These logs are created and held by
        the hosting provider, not by us. Your files themselves are never transmitted to the hosting
        provider, because all conversion happens locally in your browser.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Because the Service processes essentially no personal data, most data-subject requests
        (such as access or erasure) will simply confirm that we hold no data about you. If you have
        any questions about privacy, please contact foldenloom@gmail.com. You
        also have the right to lodge a complaint with a supervisory authority.
      </p>
    </LegalLayout>
  )
}

export function LegalNoticePage() {
  return (
    <LegalLayout title="Legal Notice (Impressum)" updated="22 August 2026">
      <p className="legal-note">
        Information pursuant to Section 5 of the German Digital Services Act (DDG) and Section 18 of
        the German State Media Treaty (MStV).
      </p>

      <h2>Service provider</h2>
      <p>
        FoldenLoom
        <br />
        Pärnu Ruudu tn
        <br />
        80016 Pärnu, Estonia
      </p>

      <h2>Contact</h2>
      <p>
        Email: foldenloom@gmail.com
      </p>

      <h2>Responsible for content (§ 18 MStV)</h2>
      <p>
        Mikk Egert Maide
      </p>

      <h2>Liability for content</h2>
      <p>
        The content of this website has been prepared with care. However, we assume no liability for
        the accuracy, completeness, or timeliness of the content. The conversion features are
        provided &ldquo;as is&rdquo;.
      </p>
    </LegalLayout>
  )
}
