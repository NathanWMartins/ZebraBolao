import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In-memory rate limit store (resets on cold start / redeployment)
// Key: IP, Value: { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // max 10 join attempts per IP per minute

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }

  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) {
    return true
  }
  return false
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Rate limit only POST requests to the join page (Server Action submissions)
  if (
    request.method === 'POST' &&
    pathname.startsWith('/dashboard/groups/join')
  ) {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
        { status: 429 }
      )
    }
  }

  // Injeta o pathname atual como header para server components usarem como next param
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', `${pathname}${search}`)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
