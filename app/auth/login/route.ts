import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  let redirectResponse: NextResponse | null = null
  
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
              // リダイレクトResponseが既に作成されている場合は、そこにCookieを設定
              if (redirectResponse) {
                redirectResponse.cookies.set(name, value, options)
              }
            })
          } catch (error) {
            // Server Action/Route Handler context
          }
        },
      },
    }
  )

  const { searchParams, origin } = new URL(request.url)
  const provider = searchParams.get('provider') as 'google' | null

  if (!provider) {
    return NextResponse.redirect(new URL('/login?error=no_provider', request.url))
  }

  // 2. Google認証の開始URLを発行
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
  // 先にResponseオブジェクトを作成して、setAll内でCookieを設定できるようにする
  redirectResponse = NextResponse.redirect(data.url)
  
  // setAllが呼ばれた後にCookieが設定されるため、再度Cookieを設定
  // これは、signInWithOAuth内でsetAllが呼ばれる前にResponseを作成する必要があるため
  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie) => {
    redirectResponse!.cookies.set(cookie.name, cookie.value)
  })
  
  return redirectResponse
}

