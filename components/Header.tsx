'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    try {
      // 1. クライアント側のセッション（LocalStorage）を破棄
      await supabase.auth.signOut()

      // 2. サーバー側のクッキーを削除するAPIを叩く
      await fetch('/auth/signout', {
        method: 'POST',
        credentials: 'include',
      })

      // 3. 画面を更新してログイン画面へ
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error during logout:', error)
      // フォールバック: クライアント側でログアウト
      await supabase.auth.signOut()
      window.location.href = '/login'
    }
  }

  if (isLoading) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || user.email || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
              unoptimized
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neon-blue flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
          )}
          <span className="text-gray-300 text-sm">
            {user.user_metadata?.full_name || user.email || 'User'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </header>
  )
}

