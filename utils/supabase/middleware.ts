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

  // セッションを更新する（これは必須）
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // ログインページと認証関連のパスは常に許可
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/auth')) {
    // 既にログインしている場合はホームにリダイレクト
    if (user && url.pathname.startsWith('/login')) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return response
  }

  // その他のパスで、ログインしていない場合はログインページにリダイレクト
  if (!user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  return response
}
