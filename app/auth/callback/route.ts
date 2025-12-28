import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // "next" パラメータがあればそこへ、なければトップページへリダイレクト
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )
    
    // コードをセッション（クッキー）に交換
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 成功したら、指定されたページ（またはトップ）へ戻る
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // エラーがあった場合はログインページへ（エラーページが存在しない場合のフォールバック）
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
