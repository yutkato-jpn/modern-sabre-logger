'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Match } from '@/utils/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { Trash2 } from 'lucide-react'

interface MatchHistoryProps {
  matches: Match[]
  onDelete?: (matchId: string) => void
}

export default function MatchHistory({ matches, onDelete }: MatchHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, matchId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('この対戦記録を削除しますか？復元できません。')) {
      return
    }

    setDeletingId(matchId)

    if (onDelete) {
      onDelete(matchId)
    }
  }

  if (matches.length === 0) {
    return <p className="text-gray-400">まだ試合記録がありません。</p>
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div key={match.id} className="relative bg-panel-bg rounded-lg p-4 border border-gray-800">
          <Link href={`/match/${match.id}/edit`}>
            <div className="hover:bg-opacity-80 transition-colors cursor-pointer">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {match.created_at && (
                      <p className="text-sm text-gray-400">
                        {format(new Date(match.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                      </p>
                    )}
                    <span className="text-gray-500">vs</span>
                    <p className="font-semibold text-lg">{match.opponent_name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {/* 自分の色アイコン */}
                    <div className={`w-3 h-3 rounded-full ${
                      match.my_color === 'red' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs text-gray-400">自分: {match.my_color === 'red' ? '赤' : '緑'}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">自分</p>
                      <p className="text-2xl font-bold text-white">
                        {match.final_score_me}
                      </p>
                    </div>
                    <span className="text-gray-500 text-xl">-</span>
                    <div className="text-left">
                      <p className="text-xs text-gray-400 mb-1">相手</p>
                      <p className="text-2xl font-bold text-gray-400">
                        {match.final_score_opponent}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          {/* 削除ボタン */}
          <button
            onClick={(e) => handleDelete(e, match.id)}
            disabled={deletingId === match.id}
            className="absolute top-4 right-4 p-2 text-red-500 hover:text-red-600 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="削除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}

