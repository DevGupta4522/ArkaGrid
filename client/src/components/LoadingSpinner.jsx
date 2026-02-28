import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-volt-border" />
        <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-transparent border-t-volt-green animate-spin" />
      </div>
      <p className="text-gray-500 text-sm font-medium">{message}</p>
    </div>
  )
}
