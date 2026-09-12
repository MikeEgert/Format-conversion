export interface LandingStep {
  title: string
  text: string
}

export interface LandingFaq {
  question: string
  answer: string
}

export interface LandingPageData {
  id: string
  path: string
  title: string
  description: string
  h1: string
  subtitle: string
  steps: LandingStep[]
  useCases: string[]
  faq: LandingFaq[]
}

export const landingPages: LandingPageData[] = [
  {
    id: 'heic-to-jpg',
    path: '/heic-to-jpg/',
    title: 'HEIC to JPG — Free, No-Upload Converter',
    description:
      'Convert HEIC to JPG for free, right in your browser. No upload, no signup — your iPhone photos never leave your device.',
    h1: 'HEIC to JPG converter',
    subtitle:
      'Convert iPhone HEIC photos to JPG right in your browser — free, private, and nothing is uploaded.',
    steps: [
      {
        title: 'Add your HEIC',
        text: 'Drop or choose a .heic or .heif file from your iPhone or camera.',
      },
      {
        title: 'Convert in your browser',
        text: 'The file is decoded locally with a WebAssembly codec — no bytes leave your device.',
      },
      {
        title: 'Download the JPG',
        text: 'Save the JPEG and open it anywhere, on any app or device.',
      },
    ],
    useCases: [
      'Open iPhone photos on Windows or older apps that do not support HEIC',
      'Upload HEIC files to sites and forms that only accept JPG',
      'Resize large HEIC photos down for faster sharing',
    ],
    faq: [
      {
        question: 'How do I convert HEIC to JPG for free?',
        answer:
          'Open the tool, drop your .heic or .heif file, and download the JPG. It runs entirely in your browser — no account and no payment required.',
      },
      {
        question: 'Is my photo uploaded to a server?',
        answer:
          'No. The conversion happens locally in your browser tab using WebAssembly. Your photo never leaves your device.',
      },
      {
        question: 'Why does my iPhone save photos as HEIC?',
        answer:
          'HEIC stores higher quality in about half the file size of JPEG. iPhones default to it, but not every app or website can open it — which is why JPG is often needed.',
      },
      {
        question: 'Is JPG lower quality than HEIC?',
        answer:
          'JPEG is lossy, so some detail is lost. You can pick a higher quality setting before downloading to keep more detail.',
      },
      {
        question: 'Can I convert HEIC to JPG on Windows?',
        answer:
          'Yes — the tool runs in any modern browser on Windows, macOS, or Linux, so you can convert without installing anything.',
      },
    ],
  },
]

export function getLandingPage(id: string): LandingPageData | undefined {
  return landingPages.find((page) => page.id === id)
}

export function getLandingPageByPath(path: string): LandingPageData | undefined {
  const normalized = path.replace(/\/+$/, '')
  return landingPages.find((page) => page.path.replace(/\/+$/, '') === normalized)
}
