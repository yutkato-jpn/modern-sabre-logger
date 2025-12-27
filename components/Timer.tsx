'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function Timer() {
  const [time, setTime] = useState(180) // 3:00 = 180秒
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  const displayTime = `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`

  const handlePlayPause = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTime(180)
  }

  return (
    <div className="favero-frame p-6">
      <div className="text-center">
        <div className="score-panel-inset rounded-xl p-4 mb-4 inline-block">
          <div className="text-5xl font-digital text-neon-yellow leading-none">
            {displayTime}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isRunning ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

