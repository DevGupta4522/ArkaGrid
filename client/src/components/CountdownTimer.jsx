import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

export default function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(deadline))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline))
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline])

  const isExpired = timeLeft.total <= 0
  const isUrgent = timeLeft.total > 0 && timeLeft.total <= 10 * 60 * 1000 // < 10 min

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
        <AlertTriangle size={16} className="animate-pulse" />
        <span>Deadline expired</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-700'
      }`}>
      <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
      <span className={`tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
      {isUrgent && (
        <span className="text-xs font-sans font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          URGENT
        </span>
      )}
    </div>
  )
}

function getTimeLeft(deadline) {
  const total = new Date(deadline) - new Date()
  if (total <= 0) return { total: 0, hours: 0, minutes: 0, seconds: 0 }

  return {
    total,
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}
