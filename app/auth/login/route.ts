import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
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
  // Cookieが確実に設定されるように、NextResponse.redirectを使用
  const response = NextResponse.redirect(data.url)
  
  // 保存されたCookieをResponseに設定
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })
  
  return response
}

