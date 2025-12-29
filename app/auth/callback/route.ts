import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = cookies()
    
    // Cookieを保存するための配列
    const cookiesToSet: Array<{ name: string; value: string; options?: any }> = []
    
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
                console.log(`[Auth Callback] Cookie saved to array: ${name}`)
              })
            } catch (error) {
              console.error('[Auth Callback] Error in setAll:', error)
            }
          },
        },
      }
    )
    
    // デバッグ: リクエスト時のCookieを確認
    const requestCookies = cookieStore.getAll()
    console.log('[Auth Callback] Request cookies:', requestCookies.map(c => c.name))
    const codeVerifierCookies = requestCookies.filter(c => c.name.includes('code-verifier') || c.name.includes('verifier'))
    console.log('[Auth Callback] Code verifier cookies:', codeVerifierCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Next.js 14では、exchangeCodeForSessionを呼ぶ前に明示的にcookies().getAll()を実行する必要がある
    // これにより、Next.jsがCookieを読み取り、code_verifierが利用可能になる
    const allCookiesBeforeExchange = cookieStore.getAll()
    console.log('[Auth Callback] Cookies before exchangeCodeForSession:', allCookiesBeforeExchange.map(c => c.name))
    
    // exchangeCodeForSessionを呼ぶ（この時、setAllが呼ばれ、tempResponseにCookieが設定される）
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // HTMLレスポンスを作成
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Login Success</title>
            <meta charset="utf-8">
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f9ff; }
              .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
              a { display: inline-block; margin-top: 1rem; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>✅ 認証成功</h1>
              <p>セッションを確立しました。</p>
              <p>以下のボタンを押してアプリへ進んでください。</p>
              <a href="${origin}${next}">アプリを開始する</a>
            </div>
          </body>
        </html>
      `
      
      const finalResponse = new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
      
      // デバッグ: Cookieの確認
      console.log('[Auth Callback] Cookies to set:', cookiesToSet.map(c => c.name))
      console.log('[Auth Callback] Cookie store cookies after exchange:', cookieStore.getAll().map(c => c.name))
      
      // 保存されたCookieをResponseに設定
      cookiesToSet.forEach(({ name, value, options }) => {
        console.log(`[Auth Callback] Setting cookie: ${name}`)
        finalResponse.cookies.set(name, value, {
          ...options,
          httpOnly: options?.httpOnly ?? true,
          secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
          sameSite: options?.sameSite ?? ('lax' as const),
          path: options?.path ?? '/',
        })
      })
      
      // cookieStoreからもすべてのCookieを取得して設定（念のため）
      cookieStore.getAll().forEach((cookie) => {
        if (!finalResponse.cookies.has(cookie.name)) {
          console.log(`[Auth Callback] Setting cookie from store: ${cookie.name}`)
          finalResponse.cookies.set(cookie.name, cookie.value)
        }
      })
      
      // デバッグ: 最終的なCookieの確認
      const finalCookies = finalResponse.cookies.getAll()
      console.log('[Auth Callback] Final response cookies:', finalCookies.map(c => c.name))
      
      return finalResponse
    } else {
      // エラー時
      console.error('[Auth Callback] Exchange error:', error.message)
      console.error('[Auth Callback] Error details:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'No code provided' }, { status: 400 })
}
