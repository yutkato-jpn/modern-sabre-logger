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
        getAll() {
          return request.cookies.getAll()
        },
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

  // ★診断モード: リダイレクトを一切行わず、ログだけ出力して通す
  if (user) {
    console.log('[Middleware] User is logged in:', user.email)
  } else {
    console.log('[Middleware] No user found')
  }

  // リダイレクトロジックを削除し、そのままページを表示させる
  return response
}
