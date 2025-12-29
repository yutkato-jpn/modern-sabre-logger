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

  // 一時的なResponseオブジェクトを作成（signInWithOAuth内でsetAllが呼ばれる前に必要）
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
            cookiesToSetArray.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options)
              // 一時的なResponseオブジェクトにCookieを設定
              tempResponse.cookies.set(name, value, options)
            })
          } catch (error) {
            // Server Action/Route Handler context
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
  // 実際のリダイレクトURLで新しいResponseを作成し、tempResponseからすべてのCookieをコピー
  const redirectResponse = NextResponse.redirect(data.url)
  
  // tempResponseからすべてのCookieをコピー
  tempResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    })
  })
  
  // cookieStoreからもすべてのCookieを取得して設定（念のため）
  cookieStore.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value)
  })
  
  return redirectResponse
}

