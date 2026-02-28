import React from 'react'

const statusConfig = {
  // Trade statuses
  pending: { label: 'Pending', bg: 'bg-gray-700/50', text: 'text-gray-400', ring: 'ring-gray-600', dot: 'bg-gray-400' },
  delivering: { label: 'Delivering', bg: 'bg-accent-500/10', text: 'text-accent-400', ring: 'ring-accent-500/30', dot: 'bg-accent-400', pulse: true },
  completing: { label: 'Completing', bg: 'bg-vblue-400/10', text: 'text-vblue-400', ring: 'ring-vblue-400/30', dot: 'bg-vblue-400', pulse: true },
  completed: { label: 'Completed', bg: 'bg-volt-green/10', text: 'text-volt-green', ring: 'ring-volt-green/30', dot: 'bg-volt-green' },
  failed: { label: 'Failed', bg: 'bg-danger-400/10', text: 'text-danger-400', ring: 'ring-danger-400/30', dot: 'bg-danger-400' },
  disputed: { label: 'Disputed', bg: 'bg-orange-500/10', text: 'text-orange-400', ring: 'ring-orange-500/30', dot: 'bg-orange-400', pulse: true },

  // Escrow statuses
  locked: { label: 'Locked', bg: 'bg-accent-500/10', text: 'text-accent-400', ring: 'ring-accent-500/30', dot: 'bg-accent-400', pulse: true },
  released: { label: 'Released', bg: 'bg-volt-green/10', text: 'text-volt-green', ring: 'ring-volt-green/30', dot: 'bg-volt-green' },
  refunded: { label: 'Refunded', bg: 'bg-danger-400/10', text: 'text-danger-400', ring: 'ring-danger-400/30', dot: 'bg-danger-400' },
  partial: { label: 'Partial', bg: 'bg-vblue-400/10', text: 'text-vblue-400', ring: 'ring-vblue-400/30', dot: 'bg-vblue-400' },

  // Listing statuses
  active: { label: 'Active', bg: 'bg-volt-green/10', text: 'text-volt-green', ring: 'ring-volt-green/30', dot: 'bg-volt-green', pulse: true },
  sold: { label: 'Sold', bg: 'bg-accent-500/10', text: 'text-accent-400', ring: 'ring-accent-500/30', dot: 'bg-accent-400' },
  expired: { label: 'Expired', bg: 'bg-gray-700/50', text: 'text-gray-500', ring: 'ring-gray-600', dot: 'bg-gray-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-danger-400/10', text: 'text-danger-400', ring: 'ring-danger-400/30', dot: 'bg-danger-400' },
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
