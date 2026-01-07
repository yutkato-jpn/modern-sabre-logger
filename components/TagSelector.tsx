'use client'

import { useState, useEffect } from 'react'
import { MATCH_TAGS, MatchTagCategory } from '@/constants/matchTags'
import { X, Plus } from 'lucide-react'

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customTagInput, setCustomTagInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim()
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed])
      setCustomTagInput('')
      setShowCustomInput(false)
    }
  }

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag))
  }

  // 標準タグ以外のカスタムタグを取得
  const allStandardTags = Object.values(MATCH_TAGS).flat()
  const customTags = selectedTags.filter(tag => !allStandardTags.includes(tag as any))

  return (
    <div className="space-y-4">
      {/* カテゴリごとにタグを表示 */}
      {Object.entries(MATCH_TAGS).map(([category, tags]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
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
      ))}

      {/* カスタムタグの表示 */}
      {customTags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">カスタムタグ</h3>
          <div className="flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <div
                key={tag}
                className="px-3 py-2 rounded-lg text-sm bg-blue-500/20 border-2 border-blue-500 text-blue-400 font-semibold flex items-center gap-2"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* カスタムタグ追加 */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCustomTag()
              } else if (e.key === 'Escape') {
                setShowCustomInput(false)
                setCustomTagInput('')
              }
            }}
            placeholder="タグ名を入力"
            className="flex-1 px-3 py-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={handleAddCustomTag}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
          >
            追加
          </button>
          <button
            onClick={() => {
              setShowCustomInput(false)
              setCustomTagInput('')
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>タグを追加</span>
        </button>
      )}
    </div>
  )
}

