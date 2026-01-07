'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, History } from 'lucide-react'
import { Match } from '@/utils/supabase'
import MatchHistory from '@/components/MatchHistory'
import AICoachReport from '@/components/AICoachReport'
import Header from '@/components/Header'
import MatchSearchFilter from '@/components/MatchSearchFilter'

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null)
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null)

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
      // サーバー側のAPIルートを使用
      const response = await fetch(`/api/matches/${matchId}/delete`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`試合の削除に失敗しました: ${result.error || 'Unknown error'}`)
        return
      }

      // UIから即座に削除
      setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId))
    } catch (error) {
      console.error('Error deleting match:', error)
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFilter = (filters: {
    selectedTags: string[]
    startDate: string | null
    endDate: string | null
  }) => {
    setFilterTags(filters.selectedTags)
    setFilterStartDate(filters.startDate)
    setFilterEndDate(filters.endDate)
  }

  const handleResetFilter = () => {
    setFilterTags([])
    setFilterStartDate(null)
    setFilterEndDate(null)
  }

  // フィルタリングされた試合一覧
  const filteredMatches = useMemo(() => {
    let filtered = [...matches]

    // タグでフィルタリング
    if (filterTags.length > 0) {
      filtered = filtered.filter(match => {
        if (!match.tags || match.tags.length === 0) return false
        // 選択されたタグのいずれかが含まれているか
        return filterTags.some(tag => match.tags?.includes(tag))
      })
    }

    // 日付範囲でフィルタリング
    if (filterStartDate) {
      const start = new Date(filterStartDate)
      start.setHours(0, 0, 0, 0)
      filtered = filtered.filter(match => {
        if (!match.created_at && !match.match_date) return false
        const matchDate = match.match_date 
          ? new Date(match.match_date)
          : new Date(match.created_at!)
        matchDate.setHours(0, 0, 0, 0)
        return matchDate >= start
      })
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(match => {
        if (!match.created_at && !match.match_date) return false
        const matchDate = match.match_date 
          ? new Date(match.match_date)
          : new Date(match.created_at!)
        return matchDate <= end
      })
    }

    return filtered
  }, [matches, filterTags, filterStartDate, filterEndDate])

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
          
          {/* 検索・フィルター */}
          {!isLoading && (
            <div className="mb-4">
              <MatchSearchFilter
                onFilter={handleFilter}
                onReset={handleResetFilter}
              />
            </div>
          )}

          {/* 検索結果の件数表示 */}
          {!isLoading && (filterTags.length > 0 || filterStartDate || filterEndDate) && (
            <div className="mb-4 text-sm text-gray-400">
              検索結果: {filteredMatches.length}件
              {matches.length !== filteredMatches.length && (
                <span> (全{matches.length}件中)</span>
              )}
            </div>
          )}

          {isLoading ? (
            <p className="text-gray-400">読み込み中...</p>
          ) : filteredMatches.length === 0 ? (
            <p className="text-gray-400">
              {(filterTags.length > 0 || filterStartDate || filterEndDate)
                ? '検索条件に一致する試合記録がありません。'
                : 'まだ試合記録がありません。'}
            </p>
          ) : (
            <MatchHistory matches={filteredMatches} onDelete={handleDeleteMatch} />
          )}
        </div>
        </div>
      </div>
    </div>
  )
}

