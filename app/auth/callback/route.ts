import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
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
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignore
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 成功時のみリダイレクト
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // ★エラー時はJSONを表示して止める（デバッグ用）
      return NextResponse.json({ 
        error: error.message, 
        code: error.code,
        details: 'Exchange Error occurred in callback'
      }, { status: 400 })
    }
  }

  // コードがない場合
  return NextResponse.json({ error: 'No code provided' }, { status: 400 })
}
