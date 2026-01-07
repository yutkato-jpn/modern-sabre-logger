'use client'

import { useState } from 'react'
import { MATCH_TAGS } from '@/constants/matchTags'
import { Search, X, Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface MatchSearchFilterProps {
  onFilter: (filters: {
    selectedTags: string[]
    startDate: string | null
    endDate: string | null
  }) => void
  onReset: () => void
}

export default function MatchSearchFilter({ onFilter, onReset }: MatchSearchFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  // すべての標準タグを取得
  const allStandardTags = Object.values(MATCH_TAGS).flat()

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleApplyFilter = () => {
    onFilter({
      selectedTags,
      startDate: startDate || null,
      endDate: endDate || null,
    })
  }

  const handleReset = () => {
    setSelectedTags([])
    setStartDate('')
    setEndDate('')
    onReset()
  }

  const handleQuickDateRange = (days: number) => {
    const today = new Date()
    const start = subDays(today, days)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(today, 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-4">
      {/* 検索バー（折りたたみ可能） */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>検索・フィルター</span>
        </button>
        {(selectedTags.length > 0 || startDate || endDate) && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            <span>リセット</span>
          </button>
        )}
      </div>

      {/* 検索パネル */}
      {isExpanded && (
        <div className="bg-panel-bg rounded-lg p-4 border border-gray-800 space-y-4">
          {/* 日付範囲フィルター */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">日付範囲</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handleQuickDateRange(7)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                過去7日
              </button>
              <button
                onClick={() => handleQuickDateRange(30)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                過去30日
              </button>
              <button
                onClick={() => handleQuickDateRange(90)}
                className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                過去90日
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">開始日</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">終了日</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* タグフィルター */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">タグで絞り込み</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {allStandardTags.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-lg text-sm transition-all ${
                      isSelected
                        ? 'bg-yellow-500/20 border-2 border-yellow-500 text-yellow-400 font-semibold'
                        : 'bg-gray-800 border-2 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 適用ボタン */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
            >
              検索
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
            >
              クリア
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

