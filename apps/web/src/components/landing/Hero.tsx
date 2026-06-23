import { useRef, useState, useEffect } from "react"
import { CalendarCheck, Info, MessageCircleHeart, ShieldCheck, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react"

import AnimatedStat from "./AnimatedStat"

interface Highlight {
  title: string
  description: string
  icon: typeof Sparkles
}

const highlights: Highlight[] = [
  {
    title: "Nhận biết dấu hiệu bất thường",
    description: "Gợi ý bước tiếp theo rõ ràng để bạn không phải tự xoay xở.",
    icon: Sparkles,
  },
  {
    title: "Lịch khám gọn hơn",
    description: "Gửi trước triệu chứng và hồ sơ để phòng khám chuẩn bị tốt hơn.",
    icon: CalendarCheck,
  },
]

const trustMarks = [
  { value: "24/7", label: "tư vấn triệu chứng" },
  { value: "4.9", label: "điểm hài lòng" },
  { value: "100+", label: "phòng khám đã duyệt" },
]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.2, 0.8, 0.2, 1] } },
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Parallax: ảnh nền dịch nhẹ khi cuộn qua hero
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08])

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-po-bg">
      <motion.img
        src="/hero-pets-new.png"
        alt="Bác sĩ thú y đang khám cho một chú chó trong phòng khám sáng sủa"
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-y-0 right-0 z-0 hidden h-full w-[58%] object-cover object-center md:block"
      />
      <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,_rgba(255,247,237,0.99)_0%,_rgba(255,247,237,0.95)_42%,_rgba(255,247,237,0.28)_70%,_rgba(255,247,237,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-po-bg to-transparent" />

      <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-64px)] w-[calc(100%_-_24px)] max-w-[1200px] items-center gap-8 py-14 md:grid-cols-[0.95fr_1.05fr] md:py-20 lg:min-h-[720px]">
        <motion.div
          className="min-w-0 max-w-2xl"
          variants={reduce ? undefined : container}
          initial={reduce ? undefined : "hidden"}
          animate={reduce ? undefined : "show"}
        >
          <motion.span
            variants={reduce ? undefined : item}
            className="block w-fit border-l-2 border-po-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle"
          >
            Pet-care cho chủ nuôi bận rộn
          </motion.span>
          <motion.h1
            variants={reduce ? undefined : item}
            className="mt-5 max-w-[14ch] text-5xl font-extrabold leading-[0.98] text-po-text text-balance max-[480px]:max-w-full sm:text-6xl lg:text-7xl"
          >
            Trợ lý AI cho sức khỏe thú cưng.
          </motion.h1>
          <motion.p
            variants={reduce ? undefined : item}
            className="mt-6 max-w-xl min-w-0 text-base leading-8 text-po-text-muted md:text-lg"
          >
            PetOmi giúp chủ nuôi chat với AI để ghi triệu chứng, lưu hồ sơ, nhắc lịch và chuẩn bị thông tin trước khi gặp bác sĩ thú y.
          </motion.p>
          <motion.div variants={reduce ? undefined : item} className="mt-8 flex w-full flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover hover:shadow-xl focus-visible:shadow-[var(--po-focus-ring)] active:translate-y-0 max-[480px]:w-full"
            >
              <MessageCircleHeart className="size-4" />
              Chat với AI ngay
            </Link>
            <a
              href="#services"
              className="inline-flex h-12 items-center justify-center rounded-full border border-po-border bg-white/80 px-6 text-sm font-semibold text-po-text transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:shadow-[var(--po-focus-ring)] active:translate-y-0 max-[480px]:w-full"
            >
              Xem cách PetOmi hỗ trợ
            </a>
          </motion.div>
          <motion.p
            variants={reduce ? undefined : item}
            className="mt-4 flex max-w-xl items-start gap-2 text-xs leading-5 text-po-text-subtle"
          >
            <Info className="mt-0.5 size-3.5 shrink-0 text-po-text-subtle" />
            PetOmi chỉ hỗ trợ ghi nhận và tham khảo thông tin ban đầu, không thay thế bác sĩ thú y.
          </motion.p>
          <motion.div variants={reduce ? undefined : item} className="mt-10 grid max-w-xl gap-4 sm:grid-cols-2">
            {highlights.map((hl) => {
              const Icon = hl.icon
              return (
                <div key={hl.title} className="border-t border-po-border pt-4">
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-po-primary" />
                    <p className="text-sm leading-6 text-po-text-muted">
                      <span className="font-semibold text-po-text">{hl.title}.</span> {hl.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative min-h-[420px] md:min-h-[560px]"
          initial={reduce ? undefined : { opacity: 0, y: 32, scale: 0.95 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <img
            src="/hero-pets-new.png"
            alt="Bác sĩ thú y kiểm tra sức khỏe cho chó trong phòng khám"
            className="h-full min-h-[420px] w-full rounded-[28px] object-cover object-center shadow-2xl shadow-orange-200/30 md:hidden"
          />
          <div className="po-animate-float absolute bottom-5 left-4 right-4 rounded-[24px] border border-white/70 bg-white/[0.88] p-4 shadow-xl backdrop-blur md:bottom-10 md:left-auto md:right-0 md:w-[340px]">
            <div className="flex items-center gap-3">
              <span className="po-animate-pulse grid size-10 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                <MessageCircleHeart className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-po-text">Tóm tắt trước buổi khám</p>
                <p className="text-xs leading-5 text-po-text-muted">Bác sĩ nắm được bối cảnh trước khi thú cưng tới khám.</p>
              </div>
            </div>
          </div>
          <div
            className="po-animate-float absolute right-4 top-5 hidden rounded-[22px] border border-white/70 bg-white/[0.86] px-4 py-3 shadow-lg backdrop-blur md:flex md:items-center md:gap-3"
            style={{ animationDelay: "-2.4s" }}
          >
            <ShieldCheck className="size-5 text-po-primary" />
            <span className="text-sm font-semibold text-po-text">Phòng khám đã xác thực</span>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto w-[calc(100%_-_24px)] max-w-[1200px] -translate-y-6">
        <div className="grid gap-3 border-y border-po-border bg-white/72 px-4 py-4 backdrop-blur sm:grid-cols-3 md:px-8">
          {trustMarks.map((mark) => (
            <div key={mark.label} className="flex items-baseline gap-3 sm:justify-center">
              <AnimatedStat value={mark.value} start={mounted} className="text-2xl font-extrabold text-po-text" />
              <span className="text-sm text-po-text-muted">{mark.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
