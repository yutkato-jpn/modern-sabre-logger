import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()

  // 1. 通常のSupabaseクライアント作成とサインアウト試行
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // ignore
          }
        },
      },
    }
  )

  // サーバー側のセッション削除を試みる
  await supabase.auth.signOut()

  // 2. 【重要】強制クリーンアップ
  // Supabaseのクッキー（sb-から始まるもの）を明示的に全て削除する
  // これにより分割クッキー(chunked cookies)の残留を防ぐ
  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie) => {
    // プロジェクト固有のプレフィックス、または一般的なSupabaseクッキーを判定
    if (cookie.name.startsWith('sb-') || cookie.name.includes('auth-token')) {
      cookieStore.delete(cookie.name)
    }
  })

  // 3. ログアウト後はログインページへリダイレクト
  // キャッシュを防ぐために302ステータスを使用
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}
