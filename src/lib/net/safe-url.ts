import { lookup } from 'dns/promises'
import { isIP } from 'net'

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip)
  const v6 = ip.toLowerCase()
  if (v6.startsWith('::ffff:')) return isPrivateIPv4(v6.slice(7))
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80')
}

// Blocks non-HTTPS URLs and hosts that resolve to private/internal addresses (SSRF guard)
export async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Please enter a valid URL')
  }
  if (url.protocol !== 'https:') throw new Error('URL must start with https://')
  if (url.username || url.password) throw new Error('URL must not contain credentials')

  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error('Internal addresses are not allowed')
  }

  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (addresses.length === 0) throw new Error('Could not resolve that host')
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error('Internal addresses are not allowed')
  }
  return url
}
