import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, ClipboardPlus, LogIn, ShieldCheck } from "lucide-react"

import PetHealthOverviewPanel from "@/components/dashboard/clinic/PetHealthOverviewPanel"
import PetHealthQrScanner from "@/components/dashboard/clinic/PetHealthQrScanner"
import PetHealthShareCodeForm from "@/components/dashboard/clinic/PetHealthShareCodeForm"
import PublicPetCodeLookup from "@/components/dashboard/clinic/PublicPetCodeLookup"
import TraditionalPetLookupPanel from "@/components/dashboard/clinic/TraditionalPetLookupPanel"
import TabFilter from "@/components/ui/TabFilter"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { useMyClinic } from "@/hooks/useClinicQueries"
import type { PetHealthOverviewResponse } from "@/types"

type IntakeTab = "code" | "petomi-id" | "known-pets" | "guest"

const tabs: { value: IntakeTab; label: string }[] = [
  { value: "code", label: "Nhập mã" },
  { value: "petomi-id", label: "PetOmi ID" },
  { value: "known-pets", label: "Thú cưng đã biết" },
  { value: "guest", label: "Tiếp nhận khách" },
]

export default function ClinicPetIntakePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shareCode = searchParams.get("shareCode") ?? ""
  const [activeShareCode, setActiveShareCode] = useState(shareCode)
  const [activeTab, setActiveTab] = useState<IntakeTab>(shareCode ? "code" : "known-pets")
  const [overview, setOverview] = useState<PetHealthOverviewResponse | null>(null)
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""

  const handleOverviewLoaded = (nextOverview: PetHealthOverviewResponse) => {
    setOverview(nextOverview)
  }

  if (isClinicLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (!clinicId) {
    return (
      <div className="rounded-[24px] border border-po-border bg-white p-6 text-center">
        <h2 className="text-xl font-extrabold text-po-text">Cần hồ sơ phòng khám</h2>
        <p className="mt-2 text-sm text-po-text-muted">
          Tạo hoặc tham gia phòng khám trước khi tiếp nhận thú cưng.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/owner/register-clinic")}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white"
        >
          Đăng ký phòng khám
          <ArrowRight className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-[28px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-po-text-subtle">
              Clinic intake
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-po-text">
              Pet health access
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-po-text-muted">
              Bắt đầu bằng HealthShareCode khi chủ nuôi cung cấp. PetOmi ID và tìm thú cưng đã biết là phương án dự phòng và không bỏ qua quy tắc phân quyền của hệ thống.
            </p>
          </div>
          <Link
            to="/dashboard/clinic/appointments"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
          >
            <ClipboardPlus className="size-4" />
            Appointments
          </Link>
        </div>

        <TabFilter
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mt-5"
        />
      </section>

      {activeTab === "code" ? (
        <div className="grid gap-4">
          <PetHealthQrScanner
            onCodeScanned={(code) => {
              setActiveShareCode(code)
              setActiveTab("code")
            }}
          />
          <PetHealthShareCodeForm
            clinicId={clinicId}
            initialCode={activeShareCode}
            onOverviewLoaded={handleOverviewLoaded}
          />
        </div>
      ) : null}

      {activeTab === "petomi-id" ? (
        <PublicPetCodeLookup
          clinicId={clinicId}
          onOverviewLoaded={handleOverviewLoaded}
        />
      ) : null}

      {activeTab === "known-pets" ? (
        <TraditionalPetLookupPanel
          clinicId={clinicId}
          onOverviewLoaded={handleOverviewLoaded}
        />
      ) : null}

      {activeTab === "guest" ? <GuestIntakeFallback /> : null}

      {overview ? (
        <PetHealthOverviewPanel overview={overview} />
      ) : (
        <section className="rounded-[24px] border border-dashed border-po-border bg-po-surface-muted p-6 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-po-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h3 className="mt-3 text-lg font-extrabold text-po-text">
            No health overview loaded
          </h3>
          <p className="mx-auto mt-1 max-w-xl text-sm text-po-text-muted">
            Xác thực mã chia sẻ sức khỏe hoặc mở thú cưng có quan hệ hợp lệ với phòng khám để xem phần tổng quan được phép.
          </p>
        </section>
      )}
    </div>
  )
}

function GuestIntakeFallback() {
  return (
    <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15 md:grid-cols-[1fr_auto]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <LogIn className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-po-text">Tiếp nhận khách dự phòng</h2>
          <p className="mt-1 max-w-2xl text-sm text-po-text-muted">
            Dùng màn hình lịch hẹn để tiếp nhận walk-in hoặc cấp cứu khi chủ nuôi chưa có tài khoản, PetOmi ID hoặc HealthShareCode.
          </p>
        </div>
      </div>
      <Link
        to="/dashboard/clinic/appointments"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
      >
        Open guest intake
        <ArrowRight className="size-4" />
      </Link>
    </section>
  )
}
