import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  console.log('[Auth Callback] Received magic link callback')
  console.log('[Auth Callback] Token hash:', token_hash ? 'present' : 'missing')
  console.log('[Auth Callback] Type:', type)

  if (token_hash && type) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify the magic link token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    })

    if (error) {
      console.error('[Auth Callback] Error verifying magic link:', error)
      return NextResponse.redirect(new URL('/auth?error=invalid_link', request.url))
    }

    console.log('[Auth Callback] Magic link verified successfully')
    console.log('[Auth Callback] User:', data.user?.email)

    // Set the session cookie
    const response = NextResponse.redirect(new URL('/welcome', request.url))

    if (data.session) {
      response.cookies.set('supabase-auth-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    return response
  }

  console.log('[Auth Callback] No token hash or type found')
  // Redirect to auth page if no token provided
  return NextResponse.redirect(new URL('/auth', request.url))
}
