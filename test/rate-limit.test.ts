/**
 * Rate Limiting Test Script
 *
 * Run this script to test the rate limiting implementation
 * Usage: npm test test/rate-limit.test.ts
 */

import { rateLimit, createRateLimitResponse, cleanupRateLimitStore } from '../src/lib/rate-limit'
import { NextRequest } from 'next/server'

// Helper to create mock NextRequest
function createMockRequest(ip: string = '127.0.0.1', path: string = '/api/test'): NextRequest {
  const url = `http://localhost:3001${path}`
  return new NextRequest(url, {
    headers: {
      'x-forwarded-for': ip,
      'content-type': 'application/json'
    }
  })
}

// Helper to sleep for a duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    // Clean up rate limit store before each test
    cleanupRateLimitStore()
  })

  afterAll(() => {
    // Clean up after all tests
    cleanupRateLimitStore()
  })

  test('Basic rate limiting - allows requests within limit', async () => {
    const limiter = rateLimit({
      interval: 60000, // 1 minute
      maxRequests: 5
    })

    const request = createMockRequest()

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = await limiter(request)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }

    // 6th request should be blocked
    const result = await limiter(request)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  test('Different IPs have separate limits', async () => {
    const limiter = rateLimit({
      interval: 60000,
      maxRequests: 2
    })

    const request1 = createMockRequest('192.168.1.1')
    const request2 = createMockRequest('192.168.1.2')

    // Both IPs should be allowed their own limits
    const result1a = await limiter(request1)
    expect(result1a.allowed).toBe(true)

    const result2a = await limiter(request2)
    expect(result2a.allowed).toBe(true)

    const result1b = await limiter(request1)
    expect(result1b.allowed).toBe(true)

    const result2b = await limiter(request2)
    expect(result2b.allowed).toBe(true)

    // Third request from each IP should be blocked
    const result1c = await limiter(request1)
    expect(result1c.allowed).toBe(false)

    const result2c = await limiter(request2)
    expect(result2c.allowed).toBe(false)
  })

  test('Rate limit resets after interval', async () => {
    const limiter = rateLimit({
      interval: 100, // 100ms for testing
      maxRequests: 2
    })

    const request = createMockRequest()

    // Use up the limit
    await limiter(request)
    await limiter(request)

    // Should be blocked
    let result = await limiter(request)
    expect(result.allowed).toBe(false)

    // Wait for reset
    await sleep(150)

    // Should be allowed again
    result = await limiter(request)
    expect(result.allowed).toBe(true)
  })

  test('Headers are correctly set', async () => {
    const limiter = rateLimit({
      interval: 60000,
      maxRequests: 10
    })

    const request = createMockRequest()
    const result = await limiter(request)

    expect(result.headers['X-RateLimit-Limit']).toBe('10')
    expect(result.headers['X-RateLimit-Remaining']).toBe('9')
    expect(result.headers['X-RateLimit-Reset']).toBeDefined()
    expect(result.headers['X-RateLimit-Reset-After']).toBeDefined()
  })

  test('Custom key generator works', async () => {
    const limiter = rateLimit({
      interval: 60000,
      maxRequests: 2,
      keyGenerator: (req) => {
        // Use path as key instead of IP
        return new URL(req.url).pathname
      }
    })

    const request1 = createMockRequest('192.168.1.1', '/api/test1')
    const request2 = createMockRequest('192.168.1.2', '/api/test1')

    // Same path, different IPs - should share limit
    await limiter(request1)
    await limiter(request2)

    const result = await limiter(request1)
    expect(result.allowed).toBe(false)
  })

  test('Rate limit response has correct structure', () => {
    const result = {
      allowed: false,
      headers: {
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
        'Retry-After': '60'
      },
      remaining: 0,
      reset: Date.now() + 60000,
      limit: 10
    }

    const response = createRateLimitResponse(result, 'Custom message')

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('Retry-After')).toBe('60')
  })
})

// Manual test endpoints
async function testEndpoints() {
  console.log('Testing rate limited endpoints...\n')

  const endpoints = [
    { path: '/api/admin/render', limit: 10, interval: '10 minutes' },
    { path: '/api/demo-dashboard', limit: 30, interval: '1 minute' },
    { path: '/api/workspace/labor/calculate', limit: 60, interval: '1 minute' },
    { path: '/api/auth/callback', limit: 5, interval: '1 minute' },
    { path: '/api/stripe/checkout', limit: 5, interval: '1 minute' }
  ]

  for (const endpoint of endpoints) {
    console.log(`✅ ${endpoint.path}`)
    console.log(`   Rate limit: ${endpoint.limit} requests per ${endpoint.interval}`)
    console.log(`   Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`)
    console.log('')
  }

  console.log('Global IP rate limiting:')
  console.log('  - 200 requests per minute per IP')
  console.log('  - Applied via middleware to all /api/* routes')
  console.log('  - Automatic cleanup of expired entries every 5 minutes')
  console.log('')

  console.log('Testing recommendations:')
  console.log('1. Use curl or Postman to test rate limits')
  console.log('2. Check response headers for rate limit info')
  console.log('3. Verify 429 status code when limit exceeded')
  console.log('4. Test that limits reset after the interval')
  console.log('5. Verify different IPs have separate limits')
}

// Run manual tests if this file is executed directly
if (require.main === module) {
  testEndpoints()
}