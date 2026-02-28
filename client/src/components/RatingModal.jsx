import React, { useState } from 'react'
import { Star, X } from 'lucide-react'

export default function RatingModal({ trade, onClose, onSubmit, isLoading }) {
    const [rating, setRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [comment, setComment] = useState('')

    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

    const handleSubmit = () => {
        if (rating === 0) return
        onSubmit(trade.id, rating, comment)
    }

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white font-heading">Rate This Trade</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="text-center mb-6">
                    <p className="text-sm text-gray-400 mb-4">
                        How was your experience with <span className="font-semibold text-white">{trade.other_party_name}</span>?
                    </p>

                    {/* Stars */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(0)}
                                className="transition-transform hover:scale-125 active:scale-95"
                            >
                                <Star
                                    size={36}
                                    className={`transition-colors duration-150 ${star <= (hoveredStar || rating)
                                        ? 'text-accent-400 fill-accent-400'
                                        : 'text-gray-700'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <p className={`text-sm font-semibold h-5 transition-all ${rating > 0 ? 'text-accent-400' : 'text-gray-600'}`}>
                        {labels[hoveredStar || rating] || 'Click to rate'}
                    </p>
                </div>

                {/* Comment */}
                <div className="mb-6">
                    <label className="form-label">Comment (optional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        rows={3}
                        className="form-input resize-none"
                        maxLength={500}
                    />
                    <p className="text-xs text-gray-600 mt-1 text-right">{comment.length}/500</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 btn-secondary" disabled={isLoading}>
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isLoading}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Submitting...' : `Submit ${rating > 0 ? labels[rating] : ''} Rating`}
                    </button>
                </div>
            </div>
        </div>
    )
}
