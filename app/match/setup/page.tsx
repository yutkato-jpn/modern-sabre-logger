'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMatch } from '@/utils/supabase'
import Header from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MatchSetupPage() {
  const router = useRouter()
  const [opponentName, setOpponentName] = useState('')
  const [myColor, setMyColor] = useState<'red' | 'green'>('red')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!opponentName.trim()) {
      alert('対戦相手の名前を入力してください')
      return
    }

    setIsLoading(true)
    try {
      const result = await createMatch(opponentName, myColor)
      
      if (result.error) {
        const errorMsg = `試合の作成に失敗しました: ${result.error.message}`
        console.error('Error creating match:', result.error)
        alert(errorMsg)
        setIsLoading(false)
        return
      }

      if (result.data && result.data.id) {
        console.log('Match created successfully:', result.data.id)
        router.push(`/match/${result.data.id}`)
      } else {
        const errorMsg = '試合の作成に失敗しました。データが返されませんでした。'
        console.error('No data returned from createMatch')
        alert(errorMsg)
        setIsLoading(false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Unexpected error creating match:', error)
      alert(`予期しないエラーが発生しました: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center space-x-2 mb-6 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </Link>

        <div className="panel-skeuomorphic rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-neon-blue">試合設定</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="opponent" className="block text-lg mb-2">
                対戦相手の名前
              </label>
              <input
                id="opponent"
                type="text"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                className="w-full bg-panel-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue"
                placeholder="相手の名前を入力"
                required
              />
            </div>

            <div>
              <label className="block text-lg mb-4">ポジション選択</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setMyColor('red')}
                  className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                    myColor === 'red'
                      ? 'border-led-red bg-red-900/20 shadow-neon-red'
                      : 'border-gray-700 bg-panel-bg'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-led-red mb-2">自分は赤（左）</div>
                    <div className="text-sm text-gray-400">左側のスコアをタップで自分の得点</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMyColor('green')}
                  className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                    myColor === 'green'
                      ? 'border-led-green bg-green-900/20 shadow-neon-green'
                      : 'border-gray-700 bg-panel-bg'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-led-green mb-2">自分は緑（右）</div>
                    <div className="text-sm text-gray-400">右側のスコアをタップで自分の得点</div>
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !opponentName.trim()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors shadow-neon-blue"
            >
              {isLoading ? '作成中...' : '試合を開始'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  )
}

