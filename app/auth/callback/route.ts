import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log('[Auth Callback] === START ===')
    console.log('[Auth Callback] Code exists:', !!code)
    console.log('[Auth Callback] Next:', next)
    console.log('[Auth Callback] Origin:', origin)

    if (code) {
      const cookieStore = cookies()
      console.log('[Auth Callback] Cookie store initialized')
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              const allCookies = cookieStore.getAll()
              console.log('[Auth Callback] getAll() called, cookies count:', allCookies.length)
              return allCookies
            },
            setAll(cookiesToSet: any) {
              console.log('[Auth Callback] setAll() called, cookies to set:', cookiesToSet.length)
              try {
                cookiesToSet.forEach(({ name, value, options }: any) => {
                  console.log(`[Auth Callback] Setting cookie: ${name} (value length: ${value?.length || 0})`)
                  cookieStore.set(name, value, options)
                })
                console.log('[Auth Callback] All cookies set successfully')
              } catch (error) {
                console.error('[Auth Callback] Error setting cookies:', error)
                // Server Component context warning handling
              }
            },
          },
        }
      )
      
      console.log('[Auth Callback] Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('[Auth Callback] Session exchange successful!')
        console.log('[Auth Callback] User ID:', data.user?.id)
        console.log('[Auth Callback] Redirecting to:', `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('[Auth Callback] Exchange Error:', error)
        console.error('[Auth Callback] Error message:', error.message)
        console.error('[Auth Callback] Error status:', error.status)
      }
    } else {
      console.warn('[Auth Callback] No code provided in URL')
    }

    // エラー時
    console.log('[Auth Callback] Redirecting to login with error')
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
    
  } catch (err) {
    console.error('[Auth Callback] Unexpected Error:', err)
    console.error('[Auth Callback] Error stack:', err instanceof Error ? err.stack : 'No stack')
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=server_error`)
  }
}
