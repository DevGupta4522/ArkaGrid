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
  const isWarning = timeLeft.total > 0 && timeLeft.total <= 30 * 60 * 1000 // < 30 min

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-danger-400 font-bold text-sm">
        <AlertTriangle size={16} className="animate-pulse" />
        <span>Deadline expired</span>
      </div>
    )
  }

  const colorClass = isUrgent ? 'text-danger-400' : isWarning ? 'text-accent-400' : 'text-volt-green'

  return (
    <div className={`flex items-center gap-3 ${colorClass}`}>
      <Clock size={16} className={isUrgent ? 'animate-pulse' : ''} />
      <div className={`flex items-center gap-1 font-mono text-2xl font-bold tabular-nums ${isUrgent ? 'animate-pulse' : ''}`}>
        <span className="bg-volt-dark/80 px-2 py-1 rounded-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-gray-600">:</span>
        <span className="bg-volt-dark/80 px-2 py-1 rounded-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-gray-600">:</span>
        <span className="bg-volt-dark/80 px-2 py-1 rounded-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      {isUrgent && (
        <span className="text-xs font-sans font-bold bg-danger-400/10 text-danger-400 px-2 py-0.5 rounded-full ring-1 ring-danger-400/30">
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
