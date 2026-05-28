"use client"
import { useEffect, useState } from "react"
import { formatCompact, formatRupiah } from "@/lib/utils"

interface Props {
  value: number
  duration?: number // duration in ms
  formatter?: "compact" | "rupiah" | "percent" | "none" | ((val: number) => string)
}

export function AnimatedCounter({ value, duration = 1000, formatter }: Props) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startVal = 0
    const endVal = Number(value) || 0

    if (endVal === 0) {
      setCount(0)
      return
    }

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Ease-out quad function: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress)
      const currentVal = startVal + (endVal - startVal) * easeProgress
      
      setCount(currentVal)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      } else {
        setCount(endVal)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [value, duration])

  // Hydration safety: render final value on server, animate on client after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(false) // Reset on remount if needed
    setMounted(true)
  }, [value])

  const formatValue = (val: number): string => {
    if (!formatter) return Math.floor(val).toString()
    if (typeof formatter === "function") {
      return formatter(val)
    }
    switch (formatter) {
      case "compact":
        return formatCompact(val)
      case "rupiah":
        return formatRupiah(val)
      case "percent":
        return `${val.toFixed(1)}%`
      case "none":
      default:
        return Math.floor(val).toString()
    }
  }

  if (!mounted) {
    return <>{formatValue(value)}</>
  }

  return <>{formatValue(count)}</>
}
