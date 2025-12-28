import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    console.log(`[Auth Callback] Hit! Code exists: ${!!code}, Next: ${next}`)

    if (code) {
      const cookieStore = cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              console.log(`[Auth Callback] Setting cookie: ${name}`)
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
              console.log(`[Auth Callback] Removing cookie: ${name}`)
              cookieStore.delete({ name, ...options })
            },
          },
        }
      )
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('[Auth Callback] Session exchange successful!')
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('[Auth Callback] Exchange Error:', error)
      }
    } else {
      console.warn('[Auth Callback] No code provided')
    }

    // エラー時はエラー画面ではなく、ログイン画面にエラーパラメータ付きで戻す
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    
  } catch (err) {
    console.error('[Auth Callback] Unexpected Error:', err)
    return NextResponse.redirect(`${new URL(request.url).origin}/login?error=server_error`)
  }
}
