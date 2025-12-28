import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // セッション更新処理（ここでリダイレクト判定も行う）
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Next.jsの内部ファイル、画像、静的ファイルを除外
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
