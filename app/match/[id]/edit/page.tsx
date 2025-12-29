'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// サーバー側のAPIルートを使用するため、utils/supabaseからのインポートは不要
import { Match, Point } from '@/utils/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { ArrowLeft, Edit2 } from 'lucide-react'
import Link from 'next/link'
import EditPointModal from '@/components/EditPointModal'
import Header from '@/components/Header'

interface EditMatchPageProps {
  params: {
    id: string
  }
}

export default function EditMatchPage({ params }: EditMatchPageProps) {
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [editingPoint, setEditingPoint] = useState<Point | null>(null)

  const loadData = useCallback(async () => {
    try {
      // サーバー側のAPIルートを使用
      const [matchResponse, pointsResponse] = await Promise.all([
        fetch(`/api/matches/${params.id}`),
        fetch(`/api/matches/${params.id}/points`),
      ])

      if (!matchResponse.ok) {
        const errorData = await matchResponse.json().catch(() => ({ error: '試合が見つかりません' }))
        console.error('Error fetching match:', errorData)
        router.push('/')
        return
      }

      const matchResult = await matchResponse.json()
      const matchData = matchResult.data

      if (matchData) {
        setMatch(matchData)
      }

      if (pointsResponse.ok) {
        const pointsResult = await pointsResponse.json()
        setPoints(pointsResult.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/')
    }
  }, [params.id, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEditPoint = (point: Point) => {
    setEditingPoint(point)
  }

  const handleUpdatePoint = async (
    pointId: string,
    situation: '4m' | '4m後の攻撃' | '4m後のディフェンス',
    phrase: string,
    note?: string
  ) => {
    try {
      // サーバー側のAPIルートを使用
      const response = await fetch(`/api/matches/${params.id}/points/${pointId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          situation,
          phrase,
          note,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error 
          ? `ポイントの更新に失敗しました: ${result.error}`
          : 'ポイントの更新に失敗しました'
        console.error('Error updating point:', result)
        alert(errorMsg)
        return
      }

      await loadData()
      setEditingPoint(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Unexpected error updating point:', error)
      alert(`予期しないエラーが発生しました: ${errorMessage}`)
    }
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center space-x-2 mb-6 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </Link>

        <div className="panel-skeuomorphic rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{match.opponent_name}</h1>
          <p className="text-gray-400">
            {match.created_at && format(new Date(match.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
          </p>
          <div className="mt-4 text-2xl">
            <span className="text-led-red">{match.final_score_me}</span>
            {' - '}
            <span className="text-led-green">{match.final_score_opponent}</span>
          </div>
        </div>

        <div className="panel-skeuomorphic rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">タイムライン</h2>
          
          {points.length === 0 ? (
            <p className="text-gray-400">ポイント記録がありません。</p>
          ) : (
            <div className="space-y-4">
              {points.map((point, index) => (
                <div
                  key={point.id}
                  className="bg-panel-bg rounded-lg p-4 border border-gray-800"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-400">#{index + 1}</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            point.scorer === 'me'
                              ? 'bg-red-900/30 text-led-red border border-red-700'
                              : 'bg-green-900/30 text-led-green border border-green-700'
                          }`}
                        >
                          {point.scorer === 'me' ? '自分の得点' : '相手の得点'}
                        </span>
                        {point.created_at && (
                          <span className="text-xs text-gray-500">
                            {format(new Date(point.created_at), 'HH:mm:ss', { locale: ja })}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-400">シチュエーション: </span>
                          <span className="font-semibold">{point.situation}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">フレーズ: </span>
                          <span className="font-semibold">{point.phrase}</span>
                        </div>
                        {point.note && (
                          <div>
                            <span className="text-gray-400">メモ: </span>
                            <span>{point.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditPoint(point)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors ml-4"
                    >
                      <Edit2 className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 編集モーダル */}
      {editingPoint && (
        <EditPointModal
          point={editingPoint}
          isOpen={!!editingPoint}
          onClose={() => setEditingPoint(null)}
          onSave={handleUpdatePoint}
        />
      )}
    </div>
  )
}

