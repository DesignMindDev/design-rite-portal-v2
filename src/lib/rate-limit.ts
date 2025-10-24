/**
 * Rate Limiting Middleware for Portal V2
 *
 * Provides configurable rate limiting to protect against DoS attacks
 * Uses in-memory store with automatic cleanup of expired entries
 */

import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the interval
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Only count failed requests
  skipFailedRequests?: boolean // Only count successful requests
  message?: string // Custom error message
}

export interface RateLimitResult {
  allowed: boolean
  headers: Record<string, string>
  remaining: number
  reset: number
  limit: number
}

interface TokenBucket {
  count: number
  resetAt: number
}

// Global in-memory store for rate limiting
const tokenStore = new Map<string, TokenBucket>()

// Cleanup expired entries every 5 minutes
let cleanupInterval: NodeJS.Timeout | null = null

/**
 * Start cleanup interval if not already running
 */
function startCleanupInterval() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, bucket] of tokenStore.entries()) {
        if (bucket.resetAt <= now) {
          tokenStore.delete(key)
        }
      }
    }, 5 * 60 * 1000) // 5 minutes
  }
}

/**
 * Default key generator - uses IP address or fallback to user agent
 */
function defaultKeyGenerator(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  // Use the first available IP
  const ip = forwardedFor?.split(',')[0]?.trim() ||
             realIp ||
             cfConnectingIp ||
             'unknown'

  // For authenticated requests, also include user ID if available
  const authHeader = request.headers.get('authorization')
  const userId = authHeader ? `user:${authHeader.slice(0, 10)}` : ''

  // Combine IP and user ID (if available) for the key
  return userId ? `${ip}:${userId}` : ip
}

/**
 * Create a rate limiter with the specified configuration
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    interval,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Too many requests. Please try again later.'
  } = config

  // Start cleanup interval on first rate limiter creation
  startCleanupInterval()

  return async function rateLimitMiddleware(request: NextRequest): Promise<RateLimitResult> {
    const identifier = keyGenerator(request)
    const now = Date.now()
    const resetAt = now + interval

    // Get or create token bucket for this identifier
    let bucket = tokenStore.get(identifier)

    // If bucket doesn't exist or has expired, create a new one
    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: resetAt
      }
      tokenStore.set(identifier, bucket)
    }

    // Calculate remaining requests
    const remaining = Math.max(0, maxRequests - bucket.count - 1)

    // Check if rate limit exceeded
    const allowed = bucket.count < maxRequests

    // Increment count if allowed
    if (allowed) {
      bucket.count++
    }

    // Prepare rate limit headers
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(bucket.resetAt).toISOString(),
      'X-RateLimit-Reset-After': Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)).toString()
    }

    // Add Retry-After header if rate limited
    if (!allowed) {
      headers['Retry-After'] = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000)).toString()
    }

    return {
      allowed,
      headers,
      remaining,
      reset: bucket.resetAt,
      limit: maxRequests
    }
  }
}

/**
 * Create a rate limit response with appropriate headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const message = customMessage || 'Too many requests. Please try again later.'

  return NextResponse.json(
    {
      error: message,
      retryAfter: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
      limit: result.limit,
      remaining: result.remaining
    },
    {
      status: 429,
      headers: result.headers
    }
  )
}

/**
 * Utility to create a rate limiter for specific endpoints
 */
export function createEndpointRateLimiter(config: RateLimitConfig) {
  const limiter = rateLimit(config)

  return async function checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
    const result = await limiter(request)

    if (!result.allowed) {
      return createRateLimitResponse(result, config.message)
    }

    return null // Request is allowed
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiting for admin operations
  adminStrict: createEndpointRateLimiter({
    interval: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
    message: 'Too many admin requests. Please wait before trying again.'
  }),

  // Moderate rate limiting for demo dashboard
  demoDashboard: createEndpointRateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many dashboard requests. Please slow down.'
  }),

  // Standard rate limiting for workspace operations
  workspace: createEndpointRateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many workspace requests. Please wait a moment.'
  }),

  // Strict rate limiting for authentication
  auth: createEndpointRateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many authentication attempts. Please wait before trying again.'
  }),

  // Very strict rate limiting for password reset
  passwordReset: createEndpointRateLimiter({
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please wait an hour before trying again.'
  }),

  // Standard API rate limiting
  api: createEndpointRateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded. Please slow down your requests.'
  })
}

/**
 * Clean up function for testing or shutdown
 */
export function cleanupRateLimitStore() {
  tokenStore.clear()
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}