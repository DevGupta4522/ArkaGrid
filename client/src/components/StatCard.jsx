import React from 'react'

export default function StatCard({ icon, label, value, subtext, trend, className = '' }) {
  return (
    <div className={`card-hover flex items-center gap-4 p-5 ${className}`}>
      <div className="stat-icon bg-gradient-to-br from-green-50 to-emerald-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
        )}
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
  )
}
