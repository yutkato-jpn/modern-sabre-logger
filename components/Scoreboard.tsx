'use client'

interface ScoreboardProps {
  scoreRed: number
  scoreGreen: number
  onScoreTap: (color: 'red' | 'green') => void
}

export default function Scoreboard({ scoreRed, scoreGreen, onScoreTap }: ScoreboardProps) {
  return (
    <div className="favero-frame p-6">
      <div className="grid grid-cols-2 gap-4">
        {/* 赤（左）スコア */}
        <button
          onClick={() => onScoreTap('red')}
          className="score-panel-inset rounded-xl p-6 hover:opacity-90 transition-opacity"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">RED</div>
            <div className="text-7xl font-digital text-neon-red leading-none">
              {String(scoreRed).padStart(2, '0')}
            </div>
          </div>
        </button>

        {/* 緑（右）スコア */}
        <button
          onClick={() => onScoreTap('green')}
          className="score-panel-inset rounded-xl p-6 hover:opacity-90 transition-opacity"
        >
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider">GREEN</div>
            <div className="text-7xl font-digital text-neon-green leading-none">
              {String(scoreGreen).padStart(2, '0')}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

