import { BadgeCheck, Lock, UsersRound } from "lucide-react"

interface AdminHighlight {
  title: string
  description: string
  icon: typeof UsersRound
}

const highlights: AdminHighlight[] = [
  {
    title: "Clinic verification",
    description: "Luồng duyệt pending → approved/rejected rõ ràng cho admin và clinic.",
    icon: BadgeCheck,
  },
  {
    title: "Role & user management",
    description: "Owner/Vet/Admin, role toggle và quản lý thiết bị đăng nhập an toàn.",
    icon: UsersRound,
  },
  {
    title: "Security & compliance",
    description: "Audit log, xuất/xóa dữ liệu theo GDPR và bảo mật 2 lớp cho thao tác nhạy cảm.",
    icon: Lock,
  },
]

export default function AdminSection() {
  return (
    <section id="admin" className="py-16">
      <div className="mx-auto w-[min(100%-24px,1200px)] rounded-[32px] border border-po-border bg-white px-6 py-10 shadow-sm">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-po-text-subtle">Admin & compliance</p>
            <h2 className="mt-3 text-3xl font-extrabold text-po-text md:text-4xl">
              Một luồng vận hành rõ ràng cho admin và clinic.
            </h2>
            <p className="mt-4 text-base leading-7 text-po-text-muted">
              Từ duyệt clinic đến quản trị người dùng và bảo mật dữ liệu, PetOmi giữ mọi trạng thái minh bạch để vận hành
              mượt mà.
            </p>
          </div>
          <div className="grid gap-4">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-4">
                  <span className="grid size-10 place-items-center rounded-2xl bg-white text-po-primary">
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
