import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()

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
            // Server Componentからの呼び出しエラーは無視
          }
        },
      },
    }
  )

  // サーバー側でセッションを破棄（これによりsetAllでクッキー削除が走る）
  await supabase.auth.signOut()

  // ログアウト後はログインページへリダイレクト
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}

