let fontBaseUrl: string | null = null

export function setFontBaseUrl(url: string): void {
  fontBaseUrl = url
}

export function getFontBaseUrl(): string {
  if (fontBaseUrl !== null) return fontBaseUrl
  const env = (import.meta as { env?: { BASE_URL?: string } }).env
  return env?.BASE_URL ?? ''
}
