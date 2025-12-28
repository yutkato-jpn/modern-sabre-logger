import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ここが重要：分割されたクッキーをまとめて取得する
        getAll() {
          return request.cookies.getAll()
        },
        // ここが重要：分割して保存する
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }: any) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ユーザー情報を取得
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 1. ログインしていない場合
  if (!user) {
    // ログインページや認証用API、静的ファイルへのアクセスは許可（リダイレクトしない）
    if (
      !url.pathname.startsWith('/login') && 
      !url.pathname.startsWith('/auth') &&
      !url.pathname.startsWith('/_next')
    ) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } 
  
  // 2. ログイン済みの場合
  else {
    // ログインページに行こうとしたらトップページへ転送
    if (url.pathname.startsWith('/login')) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}
