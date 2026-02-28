import React from 'react'

const statusConfig = {
  // Trade statuses
  pending: { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200', dot: 'bg-gray-400' },
  delivering: { label: 'Delivering', bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200', dot: 'bg-amber-500', pulse: true },
  completing: { label: 'Completing', bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-200', dot: 'bg-blue-500', pulse: true },
  completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-200', dot: 'bg-green-500' },
  failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-200', dot: 'bg-red-500' },
  disputed: { label: 'Disputed', bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-200', dot: 'bg-orange-500', pulse: true },

  // Escrow statuses
  locked: { label: 'Locked', bg: 'bg-amber-100', text: 'text-amber-800', ring: 'ring-amber-200', dot: 'bg-amber-500', pulse: true },
  released: { label: 'Released', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-200', dot: 'bg-green-500' },
  refunded: { label: 'Refunded', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-200', dot: 'bg-red-500' },
  partial: { label: 'Partial', bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-200', dot: 'bg-blue-500' },

  // Listing statuses
  active: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800', ring: 'ring-green-200', dot: 'bg-green-500' },
  sold: { label: 'Sold', bg: 'bg-blue-100', text: 'text-blue-800', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  expired: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800', ring: 'ring-red-200', dot: 'bg-red-500' },
}

export default function StatusBadge({ status, label }) {
  const config = statusConfig[status] || statusConfig.pending
  const displayLabel = label ? `${label}: ${config.label}` : config.label

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase
      ${config.bg} ${config.text} ring-1 ${config.ring}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      {displayLabel}
    </span>
  )
}
