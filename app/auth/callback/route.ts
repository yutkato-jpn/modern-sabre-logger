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
    let htmlResponse: NextResponse | null = null
    
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
                // HTML Responseが既に作成されている場合は、そこにCookieを設定
                if (htmlResponse) {
                  htmlResponse.cookies.set(name, value, options)
                }
              })
            } catch {
              // ignore
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ★ここを変更: 自動リダイレクトせず、HTMLを返す
      // ユーザーに手動でクリックさせることで、クッキー設定を安定させる
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
      htmlResponse = new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
      
      // exchangeCodeForSession内でsetAllが呼ばれた後にCookieが設定されるため、再度Cookieを設定
      const allCookies = cookieStore.getAll()
      allCookies.forEach((cookie) => {
        htmlResponse!.cookies.set(cookie.name, cookie.value)
      })
      
      return htmlResponse
    } else {
      // エラー時
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  return NextResponse.json({ error: 'No code provided' }, { status: 400 })
}
