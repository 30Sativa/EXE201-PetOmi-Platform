import { useNavigate } from "react-router-dom"
import {
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Stethoscope,
  Users,
} from "lucide-react"

import Seo from "@/components/common/Seo"
import Footer from "@/components/landing/Footer"
import Navbar from "@/components/landing/Navbar"
import { useAuth } from "@/contexts/AuthContext"

const benefits = [
  {
    icon: FileText,
    title: "Bệnh nhân tới đã có hồ sơ",
    desc: "Chủ nuôi gửi trước triệu chứng và hồ sơ sức khỏe của bé, nên bác sĩ nắm bối cảnh ngay từ đầu, khám nhanh và đúng hơn.",
  },
  {
    icon: BadgeCheck,
    title: "Dấu xác thực tạo niềm tin",
    desc: 'Phòng khám được duyệt sẽ có dấu "đã xác thực" hiển thị cho chủ nuôi, giúp bạn nổi bật và được chọn nhiều hơn.',
  },
  {
    icon: CalendarCheck,
    title: "Quản lý lịch hẹn gọn gàng",
    desc: "Xem lịch khám trong ngày, nhận đặt lịch online, giảm trống giờ và bớt gọi điện qua lại.",
  },
  {
    icon: Users,
    title: "Quản lý bác sĩ và nhân viên",
    desc: "Phân quyền cho bác sĩ, trợ lý, thu ngân. Mỗi người chỉ thấy đúng phần việc của mình.",
  },
  {
    icon: CreditCard,
    title: "Hóa đơn và thanh toán rõ ràng",
    desc: "Lập hóa đơn, theo dõi thu chi và đối soát thanh toán ngay trong một chỗ.",
  },
  {
    icon: ClipboardList,
    title: "Kho thuốc và dịch vụ",
    desc: "Quản lý dịch vụ, giá và tồn kho thuốc để buổi khám diễn ra trơn tru.",
  },
]

const steps = [
  {
    title: "Tạo tài khoản PetOmi",
    desc: "Đăng ký miễn phí bằng email hoặc Google, chỉ mất một phút.",
  },
  {
    title: "Gửi hồ sơ phòng khám",
    desc: "Điền thông tin và tải giấy phép hoạt động để chứng minh phòng khám hợp lệ.",
  },
  {
    title: "Chờ duyệt và bắt đầu",
    desc: "Đội ngũ PetOmi xét duyệt. Được duyệt là bạn có ngay khu quản lý phòng khám riêng.",
  },
]

export default function ForClinicsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Đã đăng nhập thì vào thẳng form đăng ký phòng khám,
  // chưa thì tạo tài khoản trước (xong sẽ vào khu quản lý để đăng ký phòng khám).
  const handleStart = () => {
    if (isAuthenticated) {
      navigate("/dashboard/owner/register-clinic")
    } else {
      navigate("/register")
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden text-po-text">
      <Seo
        title="Dành cho phòng khám thú y"
        description="Đưa phòng khám thú y của bạn lên PetOmi: nhận lịch hẹn online, bệnh nhân tới đã có hồ sơ, dấu xác thực tạo niềm tin, quản lý bác sĩ, hóa đơn và kho thuốc trong một nơi."
        path="/for-clinics"
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-po-bg">
        <div className="mx-auto w-[calc(100%_-_24px)] max-w-[900px] py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-po-primary-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-po-primary">
            <Stethoscope className="size-3.5" />
            Dành cho phòng khám
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold leading-tight text-po-text sm:text-4xl">
            Đưa phòng khám của bạn lên PetOmi
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-po-text-muted">
            Tiếp cận chủ nuôi đang tìm nơi khám đáng tin, nhận bệnh nhân đã có sẵn
            hồ sơ, và quản lý lịch hẹn, bác sĩ, hóa đơn trong cùng một nơi.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-bold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover"
            >
              <Stethoscope className="size-4" />
              Đăng ký phòng khám
            </button>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text transition hover:bg-po-surface-muted"
            >
              Xem cách hoạt động
            </a>
          </div>

          <p className="mt-4 text-xs font-medium text-po-text-subtle">
            Miễn phí tạo tài khoản · Duyệt hồ sơ trước khi hiển thị
          </p>
        </div>
      </section>

      {/* Lợi ích */}
      <section className="bg-white">
        <div className="mx-auto w-[calc(100%_-_24px)] max-w-[1100px] py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-po-text sm:text-3xl">
              PetOmi giúp được gì cho phòng khám
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-po-text-muted">
              Mọi thứ bạn cần để đón thêm khách và vận hành nhẹ nhàng hơn.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl border border-po-border bg-po-bg p-6 transition hover:border-po-primary/40"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                  <item.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-po-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Cách hoạt động */}
      <section id="how-it-works" className="bg-po-bg">
        <div className="mx-auto w-[calc(100%_-_24px)] max-w-[900px] py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-po-text sm:text-3xl">
              Bắt đầu trong 3 bước
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-po-text-muted">
              Không cần hợp đồng phức tạp. Tạo tài khoản, gửi hồ sơ, chờ duyệt là xong.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-po-border bg-white p-6"
              >
                <span className="grid size-10 place-items-center rounded-full bg-po-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-po-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-po-primary px-6 text-sm font-bold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover"
            >
              <Stethoscope className="size-4" />
              Đăng ký phòng khám ngay
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
