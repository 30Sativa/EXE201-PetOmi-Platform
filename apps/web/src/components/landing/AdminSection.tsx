import { BadgeCheck, Lock, UsersRound } from "lucide-react"

import { useInView } from "@/hooks"

interface AdminHighlight {
  title: string
  description: string
  icon: typeof UsersRound
}

const highlights: AdminHighlight[] = [
  {
    title: "Duyệt phòng khám",
    description: "Phòng khám đăng ký, admin xác nhận hoặc từ chối rõ ràng, minh bạch.",
    icon: BadgeCheck,
  },
  {
    title: "Quản lý người dùng",
    description: "Phân chia vai trò rõ ràng: Chủ nuôi, Bác sĩ và Quản trị — mỗi người chỉ thấy việc của mình.",
    icon: UsersRound,
  },
  {
    title: "Bảo mật dữ liệu",
    description: "Nhật ký hoạt động, tuân thủ GDPR và bảo vệ quyền riêng tư người dùng.",
    icon: Lock,
  },
]

export default function AdminSection() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="admin" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)] rounded-[32px] border border-po-border bg-white px-6 py-10 shadow-sm">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className={`grid gap-4 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Quản trị viên</p>
            <h2 className="text-3xl font-extrabold text-po-text md:text-4xl">
              Vận hành minh bạch, quản lý dễ dàng.
            </h2>
            <p className="text-base leading-7 text-po-text-muted">
              Từ duyệt phòng khám mới đến giám sát toàn bộ hệ thống — mọi thứ được kiểm soát và rõ ràng.
            </p>
          </div>
          <div className="grid gap-4">
            {highlights.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className={`flex items-start gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-4 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-po-text">{item.title}</p>
                    <p className="text-xs leading-5 text-po-text-muted">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
