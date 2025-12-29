'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, History } from 'lucide-react'
import { getMatches, deleteMatch, Match } from '@/utils/supabase'
import MatchHistory from '@/components/MatchHistory'
import AICoachReport from '@/components/AICoachReport'
import Header from '@/components/Header'

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching matches from API...')
        
        // サーバー側のAPIルートを使用
        const response = await fetch('/api/matches', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: '試合データの取得に失敗しました' }))
          console.error('Error fetching matches:', errorData)
          setMatches([])
          return
        }

        const result = await response.json()
        const data = result.data || []
        
        console.log('Fetched matches:', data)
        console.log('Number of matches:', data.length)
        if (data.length > 0) {
          console.log('First match:', data[0])
        }
        setMatches(data)
      } catch (error) {
        console.error('Error fetching matches:', error)
        setMatches([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const handleDeleteMatch = async (matchId: string) => {
    try {
      const result = await deleteMatch(matchId)
      
      if (result.error) {
        alert(`試合の削除に失敗しました: ${result.error.message}`)
        return
      }

      if (result.success) {
        // UIから即座に削除
        setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId))
      }
    } catch (error) {
      console.error('Error deleting match:', error)
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-center mb-8 text-neon-blue">
            Modern Sabre AI Logger
          </h1>

        {/* AIコーチからのレポート */}
        <AICoachReport matches={matches} />

        {/* 新しい試合を記録する */}
        <Link href="/match/setup">
          <div className="panel-skeuomorphic rounded-lg p-6 cursor-pointer hover:opacity-90 transition-opacity">
            <div className="flex items-center justify-center space-x-3">
              <Plus className="w-6 h-6 text-neon-blue" />
              <span className="text-xl">新しい試合を記録する</span>
            </div>
          </div>
        </Link>

        {/* 過去の記録 */}
        <div className="panel-skeuomorphic rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5" />
            <h2 className="text-2xl font-semibold">過去の記録</h2>
          </div>
          {isLoading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : (
            <MatchHistory matches={matches} onDelete={handleDeleteMatch} />
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

