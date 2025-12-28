import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach((cookie: any) => request.cookies.set(cookie.name, cookie.value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach((cookie: any) =>
            supabaseResponse.cookies.set(cookie.name, cookie.value, cookie.options)
          )
        },
      },
    }
  )

  // セッションを更新（重要: これにより認証状態が確実に反映される）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname.startsWith('/login')
  const isAuthCallback = pathname.startsWith('/auth')

  // 免除条件: 認証関連のパス（/login や /auth）へのアクセス
  if (isLoginPage || isAuthCallback) {
    // ログイン済みで /login に来た場合のみホームへリダイレクト
    if (user && isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // 未ログインで /login や /auth に来た場合は、そのまま処理を続行（リダイレクトしない）
    return supabaseResponse
  }

  // それ以外の保護されたページで未ログインの場合、ログインページにリダイレクト
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

