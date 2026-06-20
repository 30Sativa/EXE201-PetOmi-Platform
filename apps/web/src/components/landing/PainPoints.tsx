import { CalendarX, FileQuestion, HelpCircle } from "lucide-react"

import { useInView } from "@/hooks"

interface PainPoint {
  title: string
  description: string
  icon: typeof HelpCircle
}

const painPoints: PainPoint[] = [
  {
    title: "Không biết có đáng lo không",
    description: "Bỏ ăn, nôn nhẹ, gãi nhiều nhưng chưa rõ có cần đi khám ngay.",
    icon: HelpCircle,
  },
  {
    title: "Thông tin bị rời rạc",
    description: "Triệu chứng, lịch khám, vaccine và đơn thuốc nằm ở nhiều nơi khác nhau.",
    icon: FileQuestion,
  },
  {
    title: "Khó chuẩn bị trước khi đi khám",
    description: "Bác sĩ thú y mất thời gian hỏi lại từ đầu và khó nắm tình hình nhanh.",
    icon: CalendarX,
  },
]

export default function PainPoints() {
  const { ref, inView } = useInView({ threshold: 0.15 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-14 md:py-16">
      <div className="mx-auto w-[calc(100%_-_24px)] max-w-[1200px]">
        <div
          className={`rounded-[28px] border border-dashed border-po-primary/60 bg-po-primary-soft/40 p-6 transition-all duration-500 md:p-10 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-po-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-po-primary">
            <span className="grid size-4 place-items-center rounded-full bg-po-primary text-[10px] text-white">!</span>
            Pain point section
          </span>
          <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight text-po-text md:text-4xl">
            Khi thú cưng có dấu hiệu lạ.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-po-text-muted">
            Chủ nuôi thường không biết dấu hiệu có đáng lo không, thông tin sức khỏe lại rời rạc và khó chuẩn bị trước khi đi khám.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {painPoints.map((item, i) => {
              const Icon = item.icon
              return (
                <article
                  key={item.title}
                  className={`rounded-[20px] border border-po-border bg-white p-5 shadow-sm transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                  style={{ transitionDelay: `${120 + i * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-base font-semibold leading-snug text-po-text">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-po-text-muted">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
