import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get('provider') as 'google' | null

  if (!provider) {
    return NextResponse.redirect(new URL('/login?error=no_provider', request.url))
  }

  // Cookieを保存するための配列
  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = []
  
  // 1. サーバーサイドクライアントの作成（Cookie操作機能付き）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSetArray: any) {
          try {
            cookiesToSetArray.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options)
              // Cookieを配列に保存（後でResponseに設定）
              cookiesToSet.push({ name, value, options })
              console.log(`[Auth Login] Cookie saved to array: ${name}`)
            })
          } catch (error) {
            console.error('[Auth Login] Error in setAll:', error)
          }
        },
      },
    }
  )

  // 2. Google認証の開始URLを発行
  // この時、setAllが呼ばれ、tempResponseにCookieが設定される
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // 認証後の戻り先を指定
      redirectTo: `${origin}/auth/callback`,
      // 既存のログインフローに合わせて必要なスコープがあれば追加
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
  }

  // 3. Googleの認証画面へリダイレクト
  // 実際のリダイレクトURLで新しいResponseを作成し、保存されたCookieを設定
  const redirectResponse = NextResponse.redirect(data.url)
  
  // デバッグ: Cookieの確認
  console.log('[Auth Login] Cookies to set:', cookiesToSet.map(c => c.name))
  console.log('[Auth Login] Cookie store cookies:', cookieStore.getAll().map(c => c.name))
  
  // 保存されたCookieをResponseに設定
  cookiesToSet.forEach(({ name, value, options }) => {
    console.log(`[Auth Login] Setting cookie: ${name}`)
    redirectResponse.cookies.set(name, value, {
      ...options,
      httpOnly: options?.httpOnly ?? true,
      secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
      sameSite: options?.sameSite ?? ('lax' as const),
      path: options?.path ?? '/',
    })
  })
  
  // cookieStoreからもすべてのCookieを取得して設定（念のため）
  cookieStore.getAll().forEach((cookie) => {
    if (!redirectResponse.cookies.has(cookie.name)) {
      console.log(`[Auth Login] Setting cookie from store: ${cookie.name}`)
      redirectResponse.cookies.set(cookie.name, cookie.value)
    }
  })
  
  // デバッグ: 最終的なCookieの確認
  const finalCookies = redirectResponse.cookies.getAll()
  console.log('[Auth Login] Final response cookies:', finalCookies.map(c => c.name))
  
  return redirectResponse
}

