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
    description: "Xem hồ sơ đăng ký, xác minh thông tin và phản hồi lý do nếu phòng khám chưa đạt.",
    icon: BadgeCheck,
  },
  {
    title: "Phân quyền dễ hiểu",
    description: "Chủ nuôi, bác sĩ và quản trị viên được dẫn tới đúng khu vực làm việc của mình.",
    icon: UsersRound,
  },
  {
    title: "Bảo mật dữ liệu",
    description: "Thông tin thú cưng chỉ được xem và chia sẻ theo quyền được cấp, có lịch sử để kiểm tra khi cần.",
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
            Giữ hệ thống đáng tin từ bước đăng ký.
          </h2>
          <p className="text-base leading-7 text-po-text-muted">
            Admin kiểm soát phòng khám mới, tài khoản người dùng và các thao tác quan trọng bằng những bước rõ ràng, dễ theo dõi.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="border-l border-po-border pl-4">
              <p className="text-2xl font-extrabold text-po-text">Vai trò rõ ràng</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">mỗi người thấy đúng phần việc</p>
            </div>
            <div className="border-l border-po-border pl-4">
              <p className="text-2xl font-extrabold text-po-text">Dễ kiểm tra</p>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">xem lại thao tác khi cần</p>
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
