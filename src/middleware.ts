/**
 * Next.js Middleware for Global Rate Limiting
 *
 * Applies IP-based rate limiting to all API routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit'
import { ipRateLimits } from '@/lib/rate-limit-config'

// Create IP-based rate limiter
const ipRateLimiter = rateLimit({
  ...ipRateLimits,
  keyGenerator: (request: NextRequest) => {
    // Get IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')

    const ip = forwardedFor?.split(',')[0]?.trim() ||
               realIp ||
               cfConnectingIp ||
               'unknown'

    return `ip:${ip}`
  }
})

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Skip rate limiting for health checks
    if (request.nextUrl.pathname === '/api/health') {
      return NextResponse.next()
    }

    // Apply IP-based rate limiting
    const rateLimitResult = await ipRateLimiter(request)

    if (!rateLimitResult.allowed) {
      // Log rate limit violation for monitoring
      console.warn('[Rate Limit] IP rate limit exceeded:', {
        path: request.nextUrl.pathname,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        remaining: rateLimitResult.remaining,
        reset: new Date(rateLimitResult.reset).toISOString()
      })

      return createRateLimitResponse(rateLimitResult, ipRateLimits.message)
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Exclude static files and images
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}