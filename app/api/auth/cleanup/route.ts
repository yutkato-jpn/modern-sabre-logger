import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  // すべてのクッキーを削除（有効期限を過去にする）
  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name)
  })

  return NextResponse.json({ message: 'Cleanup complete' })
}

