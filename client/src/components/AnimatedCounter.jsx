import React, { useState, useEffect, useRef } from 'react'

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1500, decimals = 0, className = '' }) {
    const [displayValue, setDisplayValue] = useState(0)
    const startTime = useRef(null)
    const animFrame = useRef(null)
    const prevValue = useRef(0)

    useEffect(() => {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        const startVal = prevValue.current

        startTime.current = performance.now()

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime.current
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = startVal + (numValue - startVal) * eased

            setDisplayValue(current)

            if (progress < 1) {
                animFrame.current = requestAnimationFrame(animate)
            } else {
                prevValue.current = numValue
            }
        }

        animFrame.current = requestAnimationFrame(animate)

        return () => {
            if (animFrame.current) cancelAnimationFrame(animFrame.current)
        }
    }, [value, duration])

    const formatted = displayValue.toFixed(decimals)

    return (
        <span className={`mono-value ${className}`}>
            {prefix}{formatted}{suffix}
        </span>
    )
}
