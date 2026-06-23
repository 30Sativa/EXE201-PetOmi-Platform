import { useCountUp } from "@/hooks/useCountUp"

interface AnimatedStatProps {
  /** Giá trị hiển thị gốc, vd "100+", "50K+", "4.9", "24/7" */
  value: string
  /** Bắt đầu đếm (gắn với inView) */
  start: boolean
  className?: string
}

/**
 * Tách phần số ra để đếm count-up, giữ nguyên prefix/suffix (+, K+, ...).
 * Với giá trị không thuần số (vd "24/7") thì hiển thị tĩnh.
 */
export default function AnimatedStat({ value, start, className }: AnimatedStatProps) {
  // Tách: [phần đầu không phải số][số][phần đuôi]
  const match = value.match(/^(\D*)([\d.]+)(.*)$/)
  const isNumeric = Boolean(match) && !value.includes("/")

  const numStr = isNumeric ? match![2] : "0"
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0
  const end = parseFloat(numStr)

  // Hook luôn được gọi (giữ thứ tự hook nhất quán); khi không phải số thì bỏ qua kết quả.
  const count = useCountUp({ end, start: start && isNumeric, decimals, duration: 1500 })

  if (!isNumeric) {
    return <span className={className}>{value}</span>
  }

  return (
    <span className={className}>
      {match![1]}
      {count}
      {match![3]}
    </span>
  )
}
