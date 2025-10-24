# Rate Limiting Implementation for Portal V2

## Overview

Rate limiting has been implemented to protect the Portal V2 API against DoS attacks and ensure fair usage of resources. The implementation uses an in-memory token bucket algorithm with automatic cleanup of expired entries.

## Implementation Details

### Core Files

1. **`src/lib/rate-limit.ts`**
   - Main rate limiting logic with token bucket algorithm
   - In-memory store with automatic cleanup
   - Configurable rate limiters for different use cases

2. **`src/lib/rate-limit-config.ts`**
   - Centralized configuration for all rate limits
   - Pre-configured limiters for common scenarios
   - Easy to update and maintain

3. **`src/middleware.ts`**
   - Global IP-based rate limiting for all API routes
   - 200 requests per minute per IP address
   - Automatic header injection

## Rate Limit Configurations

### Critical Endpoints

| Endpoint | Limit | Interval | Purpose |
|----------|-------|----------|---------|
| `/api/admin/render` | 10 requests | 10 minutes | Render.com API (expensive) |
| `/api/demo-dashboard` | 30 requests | 1 minute | Demo booking dashboard |
| `/api/workspace/labor/calculate` | 60 requests | 1 minute | Labor calculations |
| `/api/auth/callback` | 5 requests | 1 minute | Authentication callbacks |
| `/api/stripe/checkout` | 5 requests | 1 minute | Payment operations |
| `/api/admin/create-employee` | 10 requests | 10 minutes | User creation (admin only) |

### Global Rate Limiting

- **IP-based limit**: 200 requests per minute per IP
- **Applied to**: All `/api/*` routes
- **Excluded**: `/api/health` endpoint
- **Cleanup**: Automatic cleanup every 5 minutes

## Response Headers

All rate-limited endpoints return the following headers:

```
X-RateLimit-Limit: 30              # Maximum requests allowed
X-RateLimit-Remaining: 25          # Requests remaining
X-RateLimit-Reset: 2025-01-15T...  # When the limit resets
X-RateLimit-Reset-After: 45        # Seconds until reset
Retry-After: 45                    # (Only on 429 responses)
```

## Error Response Format

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 45,
  "limit": 30,
  "remaining": 0
}
```

## Usage in API Routes

### Basic Usage

```typescript
import { rateLimiters } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimiters.demoDashboard(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Continue with normal processing
  // ...
}
```

### Custom Rate Limiter

```typescript
import { rateLimit, createEndpointRateLimiter } from '@/lib/rate-limit';

// Create custom limiter
const customLimiter = createEndpointRateLimiter({
  interval: 60 * 1000,  // 1 minute
  maxRequests: 10,
  message: 'Custom rate limit message'
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await customLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Continue...
}
```

## Testing

### Manual Testing with curl

```bash
# Test rate limiting on an endpoint
for i in {1..10}; do
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       -H "Content-Type: application/json" \
       http://localhost:3001/api/demo-dashboard \
       -w "\nStatus: %{http_code}\n"
  sleep 1
done
```

### Check Headers

```bash
curl -I http://localhost:3001/api/demo-dashboard
```

### Test Script

```bash
# Run the test script
npm test test/rate-limit.test.ts
```

## Monitoring

### Log Analysis

Rate limit violations are logged with:
- Path of the endpoint
- HTTP method
- IP address
- Remaining requests
- Reset time

Example log:
```
[Rate Limit] IP rate limit exceeded: {
  path: '/api/admin/render',
  method: 'GET',
  ip: '192.168.1.100',
  remaining: 0,
  reset: '2025-01-15T12:34:56.789Z'
}
```

## Customization

### Adjusting Rate Limits

Edit `src/lib/rate-limit-config.ts`:

```typescript
export const rateLimitConfigs = {
  'demo.dashboard': {
    interval: 60 * 1000,      // Change interval (ms)
    maxRequests: 50,          // Change max requests
    message: 'Custom message' // Change error message
  }
}
```

### Custom Key Generation

For user-based rate limiting instead of IP-based:

```typescript
const userLimiter = rateLimit({
  interval: 60000,
  maxRequests: 100,
  keyGenerator: (request) => {
    const userId = getUserIdFromRequest(request);
    return `user:${userId}`;
  }
});
```

## Best Practices

1. **Start Conservative**: Begin with stricter limits and relax as needed
2. **Monitor Logs**: Watch for legitimate users hitting limits
3. **Different Limits**: Use different limits for different operation costs
4. **User Feedback**: Provide clear error messages with retry information
5. **Gradual Backoff**: Consider implementing exponential backoff for repeated violations

## Troubleshooting

### Common Issues

1. **"Too many requests" for legitimate users**
   - Check if limits are too strict
   - Consider increasing limits in `rate-limit-config.ts`

2. **Memory usage increasing**
   - Verify cleanup interval is running
   - Check for memory leaks in token store

3. **Rate limits not applying**
   - Ensure middleware is configured correctly
   - Verify endpoints are importing and using rate limiters

4. **Different behavior in production**
   - Check for proxy/load balancer headers
   - Ensure IP extraction is working correctly

## Security Considerations

1. **IP Spoofing**: Be aware that X-Forwarded-For can be spoofed
2. **Distributed Attacks**: IP-based limiting may not stop distributed attacks
3. **User-Based Limiting**: Consider adding authenticated user-based limits
4. **Gradual Rollout**: Test thoroughly before production deployment

## Future Enhancements

- [ ] Redis-based storage for distributed systems
- [ ] User-based rate limiting in addition to IP-based
- [ ] Exponential backoff for repeated violations
- [ ] Rate limit bypass for trusted IPs/users
- [ ] Dynamic rate limiting based on server load
- [ ] WebSocket rate limiting
- [ ] GraphQL query complexity limiting

## Support

For questions or issues with rate limiting:
1. Check this documentation
2. Review logs for rate limit violations
3. Test with the provided test script
4. Adjust configurations as needed