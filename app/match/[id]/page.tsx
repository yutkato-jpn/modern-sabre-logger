'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// サーバー側のAPIルートを使用するため、utils/supabaseからのインポートは不要
import { Match, Point } from '@/utils/supabase'
import PointModal from '@/components/PointModal'
import Header from '@/components/Header'
import { Flag, RotateCcw, Play, Pause, X, ArrowLeft } from 'lucide-react'

interface MatchPageProps {
  params: {
    id: string
  }
}

export default function MatchPage({ params }: MatchPageProps) {
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [scoreMe, setScoreMe] = useState(0)
  const [scoreOpponent, setScoreOpponent] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedScorer, setSelectedScorer] = useState<'me' | 'opponent' | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const [lastScoredColor, setLastScoredColor] = useState<'red' | 'green' | null>(null)
  const [isUndoing, setIsUndoing] = useState(false)
  const [time, setTime] = useState(180)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ランプを3秒後に消灯
  useEffect(() => {
    if (lastScoredColor) {
      const timer = setTimeout(() => {
        setLastScoredColor(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastScoredColor])

  // タイマーの処理
  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, time])

  const loadMatch = useCallback(async () => {
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

        if (pointsResponse.ok) {
          const pointsResult = await pointsResponse.json()
          const pointsData = pointsResult.data || []
          setPoints(pointsData)
          
          // スコアを計算
          const meScore = pointsData.filter((p: Point) => p.scorer === 'me').length
          const opponentScore = pointsData.filter((p: Point) => p.scorer === 'opponent').length
          setScoreMe(meScore)
          setScoreOpponent(opponentScore)
        }
      }
    } catch (error) {
      console.error('Error loading match:', error)
      router.push('/')
    }
  }, [params.id, router])

  useEffect(() => {
    loadMatch()
  }, [loadMatch])

  const handleScoreTap = (color: 'red' | 'green') => {
    if (!match) return
    
    // 自分の色に応じて、どちらが自分の得点かを判定
    const isMyScore = (match.my_color === 'red' && color === 'red') || 
                      (match.my_color === 'green' && color === 'green')
    
    setSelectedScorer(isMyScore ? 'me' : 'opponent')
    setLastScoredColor(color)
    setIsModalOpen(true)
  }

  const handlePointSave = async (
    situation: '4m' | '4m後の攻撃' | '4m後のディフェンス',
    phrase: string,
    note?: string
  ) => {
    if (!match || !match.id || !selectedScorer) {
      alert('試合情報が不正です。')
      return
    }

    if (!situation || !phrase || phrase.trim() === '') {
      alert('必須項目が入力されていません。')
      return
    }

    try {
      const currentScoreMe = scoreMe
      const currentScoreOpponent = scoreOpponent

      // サーバー側のAPIルートを使用
      const response = await fetch(`/api/matches/${match.id}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scorer: selectedScorer,
          situation,
          phrase,
          scoreMeAtTime: currentScoreMe,
          scoreOpponentAtTime: currentScoreOpponent,
          note,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`ポイントの保存に失敗しました: ${result.error || 'Unknown error'}`)
        return
      }

      if (result.data) {
        if (selectedScorer === 'me') {
          setScoreMe(prev => prev + 1)
        } else {
          setScoreOpponent(prev => prev + 1)
        }
        setPoints(prev => [...prev, result.data])
        setIsModalOpen(false)
        setSelectedScorer(null)
        setLastScoredColor(null)
      }
    } catch (error) {
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUndo = async () => {
    if (!match || !match.id || points.length === 0) return

    if (!confirm('最新の1本を削除しますか？')) return

    setIsUndoing(true)
    try {
      // サーバー側のAPIルートを使用
      const response = await fetch(`/api/matches/${match.id}/points/latest`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`削除に失敗しました: ${result.error || 'Unknown error'}`)
        setIsUndoing(false)
        return
      }

      if (result.data) {
        if (result.data.scorer === 'me') {
          setScoreMe(prev => Math.max(0, prev - 1))
        } else {
          setScoreOpponent(prev => Math.max(0, prev - 1))
        }
        setPoints(prev => prev.filter((p: Point) => p.id !== result.data.id))
        setLastScoredColor(null)
      }
      setIsUndoing(false)
    } catch (error) {
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsUndoing(false)
    }
  }

  const handleEndMatch = async () => {
    if (!match || !match.id) return
    
    if (confirm('試合を終了しますか？')) {
      setIsEnding(true)
      try {
        // サーバー側のAPIルートを使用
        const response = await fetch(`/api/matches/${match.id}/score`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            finalScoreMe: scoreMe,
            finalScoreOpponent: scoreOpponent,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          alert(`試合終了の保存に失敗しました: ${result.error || 'Unknown error'}`)
          setIsEnding(false)
          return
        }

        router.push('/')
      } catch (error) {
        alert(`エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsEnding(false)
      }
    }
  }

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(180)
  }

  const handleCancelMatch = () => {
    if (confirm('試合を中断してホームに戻りますか？記録は保存されません。')) {
      router.push('/')
    }
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    )
  }

  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  const displayTime = `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`

  const scoreRed = match.my_color === 'red' ? scoreMe : scoreOpponent
  const scoreGreen = match.my_color === 'green' ? scoreMe : scoreOpponent

  // 強制横向き回転のスタイル定義
  const landscapeStyle = `
    @media screen and (orientation: portrait) {
      .force-landscape-container {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        width: 100dvh !important; /* 画面の高さを幅として使う */
        height: 100vw !important; /* 画面の幅を高さとして使う */
        transform: translate(-50%, -50%) rotate(90deg) !important;
        z-index: 9999;
        background: #111111 !important;
        border: 8px solid #1f2937 !important;
        border-radius: 0.5rem !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: row !important; /* 横並びレイアウト */
        justify-content: space-between !important;
        align-items: center !important;
        overflow: hidden !important;
        padding: 2vmin !important;
        margin: 0 !important;
      }
    }
    @media screen and (orientation: landscape) {
      .force-landscape-container {
        width: 100%;
        height: 100dvh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #000000;
        border: none;
        border-radius: 0;
        padding: 0;
      }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landscapeStyle }} />
      <div className="force-landscape-container">
        {/* デスクトップ用のレイアウト（縦積み） */}
        <div className="hidden md:flex force-landscape-content flex-1 flex flex-col min-h-0 w-full">
          <Header />
          <div className="p-4 flex-1 flex flex-col min-h-0 w-full">
            <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0">
              <button
                onClick={handleCancelMatch}
                className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>ホームへ</span>
              </button>
              <div className="text-center mb-4">
                <h1 className="text-lg text-gray-300 mb-1">{match.opponent_name}</h1>
                <p className="text-sm text-gray-500">
                  {match.my_color === 'red' ? '自分: 赤（左）' : '自分: 緑（右）'}
                </p>
              </div>
              <div className="favero-frame p-8 flex-1 flex flex-col min-h-0 w-full">
                <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
                  <div className={`led-dot-bar transition-all duration-300 ${
                    lastScoredColor === 'red' ? 'led-array-red' : 'led-array-off'
                  }`} />
                  <div className={`led-dot-bar transition-all duration-300 ${
                    lastScoredColor === 'green' ? 'led-array-green' : 'led-array-off'
                  }`} />
                </div>
                <div className="flex items-center justify-center gap-8 w-full flex-1 min-h-0">
                  <button
                    onClick={() => handleScoreTap('red')}
                    className="flex-1 text-center hover:opacity-90 transition-opacity min-w-0"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">RED</div>
                      {match.my_color === 'red' && (
                        <span className="text-sm font-bold text-yellow-400">YOU</span>
                      )}
                    </div>
                    <div 
                      className="text-neon-red leading-none font-digital"
                      style={{ fontSize: '12rem', lineHeight: '1' }}
                    >
                      {String(scoreRed).padStart(2, '0')}
                    </div>
                  </button>
                  <div className="flex-shrink-0 flex flex-col items-center gap-4 min-w-0">
                    <div className="text-center">
                      <div 
                        className="text-neon-yellow leading-none mb-2 font-digital"
                        style={{ fontSize: '4rem', lineHeight: '1' }}
                      >
                        {displayTime}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePlayPause}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleReset}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScoreTap('green')}
                    className="flex-1 text-center hover:opacity-90 transition-opacity min-w-0"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">GREEN</div>
                      {match.my_color === 'green' && (
                        <span className="text-sm font-bold text-yellow-400">YOU</span>
                      )}
                    </div>
                    <div 
                      className="text-neon-green leading-none font-digital"
                      style={{ fontSize: '12rem', lineHeight: '1' }}
                    >
                      {String(scoreGreen).padStart(2, '0')}
                    </div>
                  </button>
                </div>
              </div>
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={handleUndo}
                  disabled={isUndoing || points.length === 0}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 rounded text-sm text-gray-300 flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>1本戻す</span>
                </button>
                <button
                  onClick={handleEndMatch}
                  disabled={isEnding}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50 rounded text-sm text-gray-300 flex items-center gap-2 transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  <span>試合終了</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* スマホ用のレイアウト（強制横並び） */}
        <div className="md:hidden flex flex-row w-full h-full items-center justify-between gap-0">
          {/* 左：赤チーム */}
          <button
            onClick={() => handleScoreTap('red')}
            className="flex-1 h-full flex flex-col justify-center items-center border-r-2 border-gray-700 hover:opacity-90 transition-opacity min-w-0 w-full"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="text-[4vmin] text-gray-500 uppercase tracking-wider">RED</div>
              {match.my_color === 'red' && (
                <span className="text-[4vmin] font-bold text-yellow-400">YOU</span>
              )}
            </div>
            <div 
              className="text-neon-red leading-none font-digital"
              style={{ 
                fontSize: '30vmin',
                lineHeight: '1'
              }}
            >
              {String(scoreRed).padStart(2, '0')}
            </div>
          </button>

          {/* 中央：タイマーとボタン */}
          <div className="flex flex-col items-center justify-center flex-shrink-0 z-10 border-x-2 border-gray-700 px-[1.5vmin]">
            <div className="text-center">
              <div 
                className="text-neon-yellow leading-none mb-1 font-digital"
                style={{ 
                  fontSize: '12vmin',
                  lineHeight: '1'
                }}
              >
                {displayTime}
              </div>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={handlePlayPause}
                  className="w-[8vmin] h-[8vmin] bg-gray-700 hover:bg-gray-600 rounded text-[3vmin] transition-colors flex items-center justify-center"
                >
                  {isRunning ? <Pause className="w-[4vmin] h-[4vmin]" /> : <Play className="w-[4vmin] h-[4vmin]" />}
                </button>
                <button
                  onClick={handleReset}
                  className="w-[8vmin] h-[8vmin] bg-gray-700 hover:bg-gray-600 rounded text-[3vmin] transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-[4vmin] h-[4vmin]" />
                </button>
              </div>
            </div>
          </div>

          {/* 右：緑チーム */}
          <button
            onClick={() => handleScoreTap('green')}
            className="flex-1 h-full flex flex-col justify-center items-center border-l-2 border-gray-700 hover:opacity-90 transition-opacity min-w-0 w-full"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="text-[4vmin] text-gray-500 uppercase tracking-wider">GREEN</div>
              {match.my_color === 'green' && (
                <span className="text-[4vmin] font-bold text-yellow-400">YOU</span>
              )}
            </div>
            <div 
              className="text-neon-green leading-none font-digital"
              style={{ 
                fontSize: '30vmin',
                lineHeight: '1'
              }}
            >
              {String(scoreGreen).padStart(2, '0')}
            </div>
          </button>
        </div>

        {/* ポイント記録モーダル */}
        {isModalOpen && selectedScorer && (
          <PointModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedScorer(null)
            }}
            onSave={handlePointSave}
          />
        )}
      </div>
    </>
  )
}
