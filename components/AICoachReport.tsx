'use client'

import { useState, useEffect } from 'react'
import { Match } from '@/utils/supabase'
import { Brain, RefreshCw } from 'lucide-react'

interface AICoachReportProps {
  matches: Match[]
}

interface AnalysisResult {
  summary: string
  detail: string
  action_plan: string
}

const STORAGE_KEY = 'ai_coach_analysis'

export default function AICoachReport({ matches }: AICoachReportProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ローカルストレージから読み込み
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setAnalysis(parsed)
      } catch (e) {
        console.error('Failed to parse saved analysis:', e)
      }
    }
  }, [])

  const handleAnalyze = async () => {
    if (matches.length === 0) {
      setError('分析する試合データがありません。試合を記録してください。')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Content-Typeをチェック
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error('サーバーから予期しない形式のレスポンスが返されました。APIルートを確認してください。')
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '分析に失敗しました' }))
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(errorData.error || `分析に失敗しました (${response.status})`)
      }

      const data: AnalysisResult = await response.json()
      
      console.log('[AICoach] Received data:', {
        hasSummary: !!data.summary,
        hasDetail: !!data.detail,
        hasActionPlan: !!data.action_plan,
        allKeys: Object.keys(data)
      })
      
      // データの検証
      if (!data.summary || !data.detail || !data.action_plan) {
        console.error('[AICoach] Incomplete response:', data)
        throw new Error('AIからのレスポンスが不完全です。必要なフィールドが含まれていません。')
      }
      
      setAnalysis(data)
      
      // ローカルストレージに保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Error analyzing:', err)
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="panel-skeuomorphic rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-neon-blue" />
          <h2 className="text-2xl font-semibold">🤖 AI Coach Report</h2>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isLoading || matches.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? '分析中...' : '最新データを分析する'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="p-6 text-center">
          <p className="text-gray-300">試合データを解析中...</p>
          <p className="text-sm text-gray-500 mt-2">AIがあなたの試合パターンを分析しています</p>
        </div>
      )}

      {!isLoading && analysis && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-yellow-400">📊 最近の傾向</h3>
            <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">🔍 詳細な分析</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{analysis.detail}</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-green-400">💡 次回の練習で意識すること</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{analysis.action_plan}</p>
          </div>
        </div>
      )}

      {!isLoading && !analysis && !error && (
        <div className="p-6 text-center">
          <p className="text-gray-400">
            {matches.length > 0
              ? '「最新データを分析する」ボタンをクリックして、AIコーチからのアドバイスを受け取りましょう。'
              : '試合を記録して、AIコーチからのアドバイスを受け取りましょう。'}
          </p>
        </div>
      )}
    </div>
  )
}
