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
    <LegalLayout title="Privacy Policy" updated="5 September 2026">
      <h2>1. At a glance</h2>
      <p>
        FoldenLoom is built around a simple principle: your files never leave your device.
        All conversion is performed locally in your browser, and we do not operate a server that
        receives, stores, or processes your files.
      </p>

      <h2>2. Data controller</h2>
      <p>
        The controller responsible for this website is Mikk Egert Maide (FoldenLoom),
        Pärnu Ruudu tn, 80016 Pärnu, Estonia, reachable at foldenloom@gmail.com.
      </p>

      <h2>3. What we do not process</h2>
      <ul>
        <li>We do not collect, upload, or see the files you convert.</li>
        <li>We do not require accounts, and we do not use cookies, analytics, tracking, or advertising.</li>
        <li>We do not currently process payments or payment data on this site.</li>
        <li>We do not tie your license key to your conversion activity.</li>
      </ul>

      <h2>4. Browser storage and license validation</h2>
      <p>
        If you activate a license key, it is stored locally in your browser&apos;s storage
        (localStorage) on your device so that Pro features stay unlocked on future visits. This is
        not a cookie. To check whether the key is valid, the key itself is transmitted to our
        license-validation service (a Cloudflare Worker) and to the license provider Lemon Squeezy
        (Lemon Squeezy, LLC), solely for the purpose of validation. The key is not used for
        tracking, profiling, or advertising, and it is never linked to your conversion activity.
        You can remove it at any time by clearing your browser&apos;s site data or by locking Pro in
        the app.
      </p>

      <h2>5. Hosting and services we use</h2>
      <p>
        The website is delivered as static files via the Cloudflare network (Cloudflare, Inc.). As
        is standard for any website, the hosting provider&apos;s servers may log technical data
        necessary to deliver the page (such as your IP address). These logs are created and held by
        the hosting provider, not by us. Your files themselves are never transmitted to the hosting
        provider, because all conversion happens locally in your browser. License validation is
        handled by a Cloudflare Worker and by Lemon Squeezy&apos;s license API; when you enter or
        hold a license key, only the key (not your files) is sent to these services to confirm its
        validity.
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

interface Dependency {
  name: string
  version: string
  license: string
  copyright: string
}

const DEPENDENCIES: Dependency[] = [
  { name: 'react', version: '19.2.8', license: 'MIT', copyright: 'Meta Platforms, Inc. and affiliates' },
  { name: 'react-dom', version: '19.2.8', license: 'MIT', copyright: 'Meta Platforms, Inc. and affiliates' },
  { name: 'pdf-lib', version: '1.17.1', license: 'MIT', copyright: 'Andrew Dillon' },
  { name: '@pdf-lib/fontkit', version: '1.1.1', license: 'MIT', copyright: 'Andrew Dillon' },
  { name: 'pdfjs-dist', version: '6.3.289', license: 'Apache-2.0', copyright: 'Mozilla and contributors' },
  { name: 'xlsx', version: '0.18.5', license: 'Apache-2.0', copyright: 'SheetJS LLC' },
  { name: 'mammoth', version: '1.12.1', license: 'BSD-2-Clause', copyright: 'Michael Williamson' },
  { name: 'turndown', version: '7.2.4', license: 'MIT', copyright: 'Dom Christie' },
  { name: 'papaparse', version: '5.6.0', license: 'MIT', copyright: 'Matthew Holt' },
  { name: 'htmlparser2', version: '12.0.0', license: 'MIT', copyright: 'Chris Winberry' },
  { name: 'domhandler', version: '6.0.1', license: 'BSD-2-Clause', copyright: 'Felix Böhm' },
  { name: 'domutils', version: '4.0.2', license: 'BSD-2-Clause', copyright: 'Felix Böhm' },
  { name: 'libheif-js', version: '1.19.8', license: 'LGPL-3.0', copyright: 'libheif contributors' },
  { name: 'fflate', version: '0.8.3', license: 'MIT', copyright: 'Arjun Barrett' },
]

function LicenseText({ license }: { license: string }) {
  switch (license) {
    case 'MIT':
      return (
        <pre>{`MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.`}</pre>
      )
    case 'BSD-2-Clause':
      return (
        <pre>{`BSD 2-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.`}</pre>
      )
    case 'Apache-2.0':
      return (
        <pre>{`Apache License 2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`}</pre>
      )
    case 'LGPL-3.0':
      return (
        <pre>{`GNU Lesser General Public License v3.0

This library is free software; you can redistribute it and/or modify it
under the terms of the GNU Lesser General Public License as published by the
Free Software Foundation; either version 3 of the License, or (at your
option) any later version.

This library is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License
for more details.

You should have received a copy of the GNU Lesser General Public License
along with this library; if not, see https://www.gnu.org/licenses/.

The LGPL permits use of this library in a combined work provided that the
library can be replaced or relinked, and that its source is available. The
unmodified source of libheif-js is available at:
https://github.com/strukturag/libheif`}</pre>
      )
    default:
      return null
  }
}

export function OpenSourcePage() {
  return (
    <LegalLayout title="Open Source Licenses" updated="5 September 2026">
      <p>
        FoldenLoom is built with, and bundles, the open-source libraries listed below. Their
        copyright notices and license texts are reproduced here as required by their licenses.
      </p>

      {DEPENDENCIES.map((dep) => (
        <section key={dep.name}>
          <h2>
            {dep.name} <span className="legal-muted">v{dep.version}</span>
          </h2>
          <p>Copyright &copy; {dep.copyright}. Licensed under {dep.license}.</p>
          <LicenseText license={dep.license} />
        </section>
      ))}

      <section>
        <h2>Noto Serif fonts</h2>
        <p>
          The Noto Serif fonts bundled with FoldenLoom (&ldquo;Noto Serif Regular&rdquo;,
          &ldquo;Bold&rdquo;, &ldquo;Italic&rdquo;, &ldquo;Bold Italic&rdquo;) are copyright
          Google Inc. and are licensed under the SIL Open Font License, Version 1.1. The full
          license text is distributed alongside the fonts in the application bundle.
        </p>
      </section>
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
