'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Match } from '@/utils/supabase'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { Trash2, Tag, X } from 'lucide-react'
import TagSelector from '@/components/TagSelector'

interface MatchHistoryProps {
  matches: Match[]
  onDelete?: (matchId: string) => void
}

export default function MatchHistory({ matches, onDelete }: MatchHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [isSavingTags, setIsSavingTags] = useState(false)

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

  const handleEditTags = (match: Match) => {
    setEditingTagsId(match.id)
    setEditingTags(match.tags || [])
  }

  const handleSaveTags = async (matchId: string) => {
    setIsSavingTags(true)
    try {
      const response = await fetch(`/api/matches/${matchId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: editingTags,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`タグの保存に失敗しました: ${result.error || 'Unknown error'}`)
        setIsSavingTags(false)
        return
      }

      setEditingTagsId(null)
      setEditingTags([])
      // ページをリロードして最新のデータを取得
      window.location.reload()
    } catch (error) {
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsSavingTags(false)
    }
  }

  if (matches.length === 0) {
    return <p className="text-gray-400">まだ試合記録がありません。</p>
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <div key={match.id} className="bg-panel-bg rounded-lg p-4 border border-gray-800">
          <div className="flex justify-between items-center">
            <Link href={`/match/${match.id}/edit`} className="flex-1 hover:bg-opacity-80 transition-colors cursor-pointer">
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
                  {/* タグ表示 */}
                  {match.tags && match.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
            </Link>
            {/* アクションボタン */}
            <div className="ml-6 flex gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleEditTags(match)
                }}
                className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-900/20 rounded-lg transition-colors"
                title="タグ編集"
              >
                <Tag className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => handleDelete(e, match.id)}
                disabled={deletingId === match.id}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* タグ編集モーダル */}
      {editingTagsId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="panel-skeuomorphic rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">タグを編集</h2>
              <button
                onClick={() => {
                  setEditingTagsId(null)
                  setEditingTags([])
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <TagSelector
                selectedTags={editingTags}
                onChange={setEditingTags}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingTagsId(null)
                  setEditingTags([])
                }}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleSaveTags(editingTagsId)}
                disabled={isSavingTags}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
              >
                {isSavingTags ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

