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
    <section ref={ref as React.RefObject<HTMLElement>} id="admin" className="bg-po-surface-muted/70 py-20 md:py-24">
      <div className="mx-auto grid w-[calc(100%_-_24px)] max-w-[1200px] gap-10 md:grid-cols-[0.95fr_1.05fr] md:items-start">
        <div className={`grid gap-5 transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">Quản trị viên</p>
          <h2 className="max-w-xl text-4xl font-extrabold leading-tight text-po-text md:text-5xl">
            Tin cậy bắt đầu từ khâu kiểm duyệt.
          </h2>
          <p className="text-base leading-7 text-po-text-muted">
            Từ duyệt phòng khám mới đến giám sát hoạt động, admin có một bức tranh rõ ràng về ai đang làm gì trong hệ thống.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="border-l border-po-border pl-4">
              <p className="text-2xl font-extrabold text-po-text">Role-based</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">quyền theo vai trò</p>
            </div>
            <div className="border-l border-po-border pl-4">
              <p className="text-2xl font-extrabold text-po-text">Audit log</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">theo dõi thao tác</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {highlights.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`group grid gap-4 rounded-[24px] bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md sm:grid-cols-[auto_1fr] ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary transition group-hover:bg-po-primary group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold leading-snug text-po-text">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-po-text-muted">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
