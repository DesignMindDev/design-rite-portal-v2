import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { rateLimiters } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Apply rate limiting - 5 requests per minute for auth operations
  const rateLimitResponse = await rateLimiters.auth(request)
  if (rateLimitResponse) return rateLimitResponse

  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/setup-password'

  // ✅ FIX: Use environment variable or host header, not URL origin
  // In production, Render might show internal localhost:10000 in request.url
  const origin = process.env.NEXT_PUBLIC_APP_URL ||
                 (request.headers.get('host')?.startsWith('localhost')
                   ? 'http://localhost:3001'
                   : `https://${request.headers.get('host')}`)

  console.log('[Auth Callback] Received request:', {
    type,
    has_token: !!token_hash,
    origin,
    host: request.headers.get('host'),
    full_url: request.url
  })

  if (token_hash && type) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // ✅ FIX: Check if user is already authenticated (token already used)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      console.log('[Auth Callback] Found existing session for:', session.user.email)

      // IMPORTANT: Verify the token to get the correct user for THIS invite
      // Even if there's a session, we need to verify the token matches
      // Otherwise user A's session could interfere with user B's invite
      console.log('[Auth Callback] Verifying token to ensure correct user session')

      const { data: tokenData, error: tokenError } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!tokenError && tokenData.user && tokenData.session) {
        console.log('[Auth Callback] Token verified for:', tokenData.user.email)

        // If token user doesn't match session user, use the token session (new user)
        if (tokenData.user.email !== session.user.email) {
          console.log('[Auth Callback] Token user differs from session user - using token session')
          await supabase.auth.signOut()
        }

        // Pass session via URL hash
        const sessionData = encodeURIComponent(JSON.stringify({
          access_token: tokenData.session.access_token,
          refresh_token: tokenData.session.refresh_token,
          expires_at: tokenData.session.expires_at,
          user: {
            id: tokenData.user.id,
            email: tokenData.user.email
          }
        }))

        // Redirect to password setup with session in URL hash
        if (type === 'invite' || type === 'magiclink') {
          return NextResponse.redirect(`${origin}/setup-password#session=${sessionData}`)
        }
        return NextResponse.redirect(`${origin}/dashboard#session=${sessionData}`)
      }

      // Token expired or invalid, but session exists - redirect anyway
      if (tokenError?.code === 'otp_expired') {
        console.log('[Auth Callback] Token expired (likely duplicate request)')

        // Check if we now have a valid session (might have been set by first request)
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession?.user?.email) {
          console.log('[Auth Callback] Session exists for:', currentSession.user.email, '- proceeding to setup')
          if (type === 'invite' || type === 'magiclink') {
            return NextResponse.redirect(`${origin}/setup-password`)
          }
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        console.log('[Auth Callback] Token expired and no session found - showing error')
      }
    }

    console.log('[Auth Callback] No existing session, verifying token with type:', type)

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (error) {
      console.error('[Auth Callback] Error verifying token:', error)

      // ✅ FIX: If token expired but user might be authenticated, check again
      if (error.message?.includes('expired') || error.code === 'otp_expired') {
        console.log('[Auth Callback] Token expired (likely duplicate request) - checking for existing session')
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession?.user?.email) {
          console.log('[Auth Callback] Session exists for:', retrySession.user.email, '- proceeding to setup')
          if (type === 'invite' || type === 'magiclink') {
            return NextResponse.redirect(`${origin}/setup-password`)
          }
          return NextResponse.redirect(`${origin}/dashboard`)
        }
        console.log('[Auth Callback] Token expired and no session found - showing error')
      }

      return NextResponse.redirect(`${origin}/auth?error=verification_failed&message=${encodeURIComponent(error.message)}`)
    }

    console.log('[Auth Callback] Token verified successfully, user:', data.user?.email)

    if (!data.session) {
      console.error('[Auth Callback] ⚠️ Token verified but no session returned!')
      return NextResponse.redirect(`${origin}/auth?error=no_session&message=Token+verified+but+no+session+created`)
    }

    // ✅ CRITICAL FIX: Pass session tokens via URL hash (client-side only, not logged)
    // The setup-password page will read these and set the session client-side
    console.log('[Auth Callback] Creating redirect with session tokens in URL hash')

    const sessionData = encodeURIComponent(JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    }))

    // Handle both magic link and invite flows
    if (type === 'invite' || type === 'magiclink') {
      console.log('[Auth Callback] Invite token verified, redirecting to password setup with session')
      return NextResponse.redirect(`${origin}/setup-password#session=${sessionData}`)
    } else {
      console.log('[Auth Callback] Unknown type, redirecting to password setup with session')
      return NextResponse.redirect(`${origin}/setup-password#session=${sessionData}`)
    }
  }

  console.error('[Auth Callback] Missing token_hash or type')
  return NextResponse.redirect(`${origin}/auth?error=missing_token`)
}
