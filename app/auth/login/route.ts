import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  
  // 1. サーバーサイドクライアントの作成（Cookie操作機能付き）
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
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            )
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
    return redirect('/login?error=no_provider')
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
    return redirect(`/login?error=${error.message}`)
  }

  // 3. Googleの認証画面へリダイレクト
  // この時点で supabase が自動的に Verifier を Cookie に保存してくれる
  return redirect(data.url)
}

