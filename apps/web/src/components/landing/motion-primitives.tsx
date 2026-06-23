import type { ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

/**
 * Bộ primitive animation dùng chung cho landing page (Framer Motion).
 * Tất cả đều tôn trọng prefers-reduced-motion: khi bật giảm chuyển động,
 * phần tử hiện ra ngay, không dịch chuyển.
 */

type Direction = "up" | "down" | "left" | "right" | "none"

const offset: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: 24 },
  right: { x: -24 },
  none: {},
}

interface RevealProps {
  children: ReactNode
  /** Hướng phần tử trượt vào */
  direction?: Direction
  /** Trễ trước khi chạy (giây) */
  delay?: number
  /** Thời lượng (giây) */
  duration?: number
  className?: string
  /** Ngưỡng phần tử hiện trong viewport mới chạy (0-1) */
  amount?: number
  as?: "div" | "section" | "article" | "li"
}

/**
 * Hiện dần + trượt vào khi cuộn tới. Chạy 1 lần (once).
 */
export function Reveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  amount = 0.2,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion()
  const o = reduce ? {} : offset[direction]

  const MotionTag = motion[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...o }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </MotionTag>
  )
}

/**
 * Container cho hiệu ứng stagger: các <Stagger.Item> con sẽ hiện lần lượt.
 */
const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } },
}

interface StaggerProps {
  children: ReactNode
  className?: string
  amount?: number
  as?: "div" | "section" | "ul"
}

export function StaggerGroup({ children, className, amount = 0.2, as = "div" }: StaggerProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]
  return (
    <MotionTag
      className={className}
      variants={reduce ? undefined : staggerContainer}
      initial={reduce ? undefined : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  as?: "div" | "article" | "li"
}

export function StaggerItem({ children, className, style, as = "div" }: StaggerItemProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]
  return (
    <MotionTag className={className} style={style} variants={reduce ? undefined : staggerItem}>
      {children}
    </MotionTag>
  )
}

interface TiltCardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Thẻ nâng lên + nghiêng nhẹ khi hover (tắt khi reduced-motion).
 */
export function TiltCard({ children, className, style }: TiltCardProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 800, ...style }}
      whileHover={reduce ? undefined : { y: -6, rotateX: 3, rotateY: -3, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.div>
  )
}
