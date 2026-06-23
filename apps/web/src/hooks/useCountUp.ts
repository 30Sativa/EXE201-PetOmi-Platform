import { useEffect, useRef, useState } from "react"

interface UseCountUpOptions {
  /** Giá trị đích cần đếm tới */
  end: number
  /** Có bắt đầu đếm hay không (thường gắn với inView) */
  start?: boolean
  /** Thời lượng animation (ms) */
  duration?: number
  /** Số chữ số thập phân giữ lại */
  decimals?: number
}

/**
 * Đếm số từ 0 -> end khi `start` chuyển thành true.
 * Tôn trọng prefers-reduced-motion: hiển thị thẳng giá trị đích.
 */
export const useCountUp = ({ end, start = true, duration = 1400, decimals = 0 }: UseCountUpOptions) => {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!start || startedRef.current) return
    startedRef.current = true

    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Bỏ qua animation: nhảy thẳng tới giá trị đích ở frame kế tiếp
    // (tránh setState đồng bộ trong thân effect).
    if (prefersReduced || duration <= 0) {
      frameRef.current = requestAnimationFrame(() => setValue(end))
      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      }
    }

    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      // easeOutCubic cho cảm giác chậm dần tự nhiên
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(end * eased)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setValue(end)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [start, end, duration])

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString()
  return display
}
