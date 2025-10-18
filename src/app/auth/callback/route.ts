import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/setup-password'

  console.log('[Auth Callback] Received request:', {
    type,
    has_token: !!token_hash,
    origin,
    full_url: request.url
  })

  if (token_hash && type) {
    const cookieStore = cookies()

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

    console.log('[Auth Callback] Verifying token with type:', type)

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (error) {
      console.error('[Auth Callback] Error verifying token:', error)
      return NextResponse.redirect(`${origin}/auth?error=verification_failed&message=${encodeURIComponent(error.message)}`)
    }

    console.log('[Auth Callback] Token verified successfully, user:', data.user?.email)

    // Handle both magic link and invite flows
    if (type === 'invite') {
      console.log('[Auth Callback] Invite token verified, redirecting to password setup')
      return NextResponse.redirect(`${origin}/setup-password`)
    } else if (type === 'magiclink') {
      console.log('[Auth Callback] Magic link verified, redirecting to password setup')
      return NextResponse.redirect(`${origin}/setup-password`)
    } else {
      console.log('[Auth Callback] Unknown type, redirecting to password setup')
      return NextResponse.redirect(`${origin}/setup-password`)
    }
  }

  console.error('[Auth Callback] Missing token_hash or type')
  return NextResponse.redirect(`${origin}/auth?error=missing_token`)
}
