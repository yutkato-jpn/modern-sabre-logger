'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TAGS, Situation, Phrase } from '@/constants/tags'
import { Point } from '@/utils/supabase'

interface EditPointModalProps {
  point: Point
  isOpen: boolean
  onClose: () => void
  onSave: (
    pointId: string,
    situation: Situation,
    phrase: Phrase,
    note?: string
  ) => void
}

export default function EditPointModal({ point, isOpen, onClose, onSave }: EditPointModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedSituation, setSelectedSituation] = useState<Situation>(point.situation)
  const [selectedPhrase, setSelectedPhrase] = useState<Phrase>(point.phrase as Phrase)
  const [note, setNote] = useState(point.note || '')

  useEffect(() => {
    if (isOpen) {
      setSelectedSituation(point.situation)
      setSelectedPhrase(point.phrase as Phrase)
      setNote(point.note || '')
      setStep(1)
    }
  }, [isOpen, point])

  const handleSituationSelect = (situation: Situation) => {
    setSelectedSituation(situation)
    // フレーズが新しいシチュエーションに存在しない場合はリセット
    if (!(TAGS[situation] as readonly string[]).includes(selectedPhrase)) {
      setSelectedPhrase(TAGS[situation][0] as Phrase)
    }
    setStep(2)
  }

  const handlePhraseSelect = (phrase: Phrase) => {
    setSelectedPhrase(phrase)
    setStep(3)
  }

  const handleSave = () => {
    if (selectedSituation && selectedPhrase) {
      onSave(point.id, selectedSituation, selectedPhrase, note.trim() || undefined)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="panel-skeuomorphic rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">ポイント編集</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: シチュエーション選択 */}
        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 1: シチュエーション</h3>
            <div className="space-y-2">
              {(Object.keys(TAGS) as Situation[]).map((situation) => (
                <button
                  key={situation}
                  onClick={() => handleSituationSelect(situation)}
                  className={`w-full p-4 rounded-lg text-left transition-colors border ${
                    selectedSituation === situation
                      ? 'bg-blue-900/30 border-blue-600'
                      : 'bg-panel-bg border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {situation}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: フレーズ選択 */}
        {step === 2 && selectedSituation && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-blue-400 hover:text-blue-300 mb-4 text-sm"
            >
              ← 戻る
            </button>
            <h3 className="text-lg font-semibold mb-4">Step 2: フレーズ</h3>
            <div className="space-y-2">
              {TAGS[selectedSituation].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handlePhraseSelect(phrase as Phrase)}
                  className={`w-full p-4 rounded-lg text-left transition-colors border ${
                    selectedPhrase === phrase
                      ? 'bg-blue-900/30 border-blue-600'
                      : 'bg-panel-bg border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: メモ入力 */}
        {step === 3 && selectedSituation && selectedPhrase && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="text-blue-400 hover:text-blue-300 mb-4 text-sm"
            >
              ← 戻る
            </button>
            <h3 className="text-lg font-semibold mb-4">Step 3: メモ（任意）</h3>
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">
                シチュエーション: {selectedSituation}
              </div>
              <div className="text-sm text-gray-400 mb-4">
                フレーズ: {selectedPhrase}
              </div>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモを入力（任意）"
              className="w-full bg-panel-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neon-blue min-h-[100px]"
            />
            <button
              onClick={handleSave}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              保存
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

