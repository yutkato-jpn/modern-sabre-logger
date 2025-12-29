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

  // 重要な修正: signInWithOAuthを呼ぶ前に、一時的なResponseオブジェクトを作成
  // これにより、setAllが呼ばれた時にCookieを設定できる
  // 実際のリダイレクトURLは後で設定するため、一時的に'/'を使用
  let tempResponse = NextResponse.redirect(new URL('/', request.url))
  
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
            console.log(`[Auth Login] setAll called with ${cookiesToSetArray.length} cookies`)
            cookiesToSetArray.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options)
              console.log(`[Auth Login] Cookie set in store: ${name} (value length: ${value?.length || 0})`)
              
              // 一時的なResponseオブジェクトにCookieを設定
              tempResponse.cookies.set(name, value, options)
              console.log(`[Auth Login] Cookie set in tempResponse: ${name}`)
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
    console.error('[Auth Login] OAuth error:', error)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
  }

  // 3. 実際のリダイレクトURLでResponseオブジェクトを作成
  // tempResponseからすべてのCookieをコピー
  const redirectResponse = NextResponse.redirect(data.url)
  
  // デバッグ: Cookieの確認
  const tempCookies = tempResponse.cookies.getAll()
  const storeCookies = cookieStore.getAll()
  console.log('[Auth Login] Temp response cookies:', tempCookies.map(c => c.name))
  console.log('[Auth Login] Cookie store cookies after signInWithOAuth:', storeCookies.map(c => c.name))
  
  // tempResponseからすべてのCookieをコピー
  tempCookies.forEach((cookie) => {
    console.log(`[Auth Login] Copying cookie from tempResponse: ${cookie.name}`)
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    })
  })
  
  // cookieStoreからもすべてのCookieを取得して設定（念のため）
  storeCookies.forEach((cookie) => {
    if (!redirectResponse.cookies.has(cookie.name)) {
      console.log(`[Auth Login] Setting cookie from store: ${cookie.name}`)
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      })
    }
  })
  
  // デバッグ: 最終的なCookieの確認
  const finalCookies = redirectResponse.cookies.getAll()
  console.log('[Auth Login] Final response cookies:', finalCookies.map(c => c.name))
  console.log('[Auth Login] Redirecting to:', data.url)
  
  return redirectResponse
}

