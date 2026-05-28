import { useMemo, useState } from "react"
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMe } from "@/hooks/useAuthQueries"
import { createClinicApi, createVetProfileApi, getMyClinicApi } from "@/services/clinic.service"
import { getErrorMessage } from "@/lib/utils"
import type { CreateClinicRequest, MyClinicResponse } from "@/types"

type FormState = {
  vetLicenseNumber: string
  specialization: string
  clinicName: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  licenseImageUrl: string
}

const initialForm: FormState = {
  vetLicenseNumber: "",
  specialization: "",
  clinicName: "",
  address: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseImageUrl: "",
}

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "success" as const
    case "rejected":
      return "danger" as const
    case "pending":
      return "warning" as const
    default:
      return "default" as const
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function toNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default function OwnerClinicRegistrationPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(initialForm)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const { data: me, isLoading: loadingMe } = useMe()
  const { data: myClinic, isLoading: loadingClinic } = useQuery({
    queryKey: ["owner", "my-clinic"],
    queryFn: getMyClinicApi,
    retry: false,
  })

  const createClinicMutation = useMutation({
    mutationFn: async () => {
      if (!me?.vetProfile) {
        try {
          await createVetProfileApi({
            licenseNumber: toNullable(form.vetLicenseNumber),
            specialization: toNullable(form.specialization),
          })
        } catch (error) {
          const errorText = getErrorMessage(error)
          if (!errorText.toLowerCase().includes("vetprofile")) {
            throw error
          }
        }
      }

      const payload: CreateClinicRequest = {
        clinicName: form.clinicName.trim(),
        address: toNullable(form.address),
        phone: toNullable(form.phone),
        email: toNullable(form.email),
        licenseNumber: toNullable(form.licenseNumber),
        licenseImageUrl: toNullable(form.licenseImageUrl),
        licenseCloudinaryPublicId: null,
      }

      return createClinicApi(payload)
    },
    onSuccess: async () => {
      setErrorMessage("")
      setMessage("Dang ky clinic thanh cong. Ho so dang cho admin duyet.")
      setForm(initialForm)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner", "my-clinic"] }),
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
      ])
    },
    onError: (error) => {
      setMessage("")
      setErrorMessage(getErrorMessage(error, "Dang ky clinic that bai. Vui long thu lai."))
    },
  })

  const isLoading = loadingMe || loadingClinic
  const hasVetProfile = Boolean(me?.vetProfile)
  const canSubmit = useMemo(
    () => form.clinicName.trim().length >= 2 && !createClinicMutation.isPending && !myClinic,
    [createClinicMutation.isPending, form.clinicName, myClinic],
  )

  const updateField =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")
    setErrorMessage("")
    if (!canSubmit) return
    createClinicMutation.mutate()
  }

  return (
    <div className="grid gap-5 md:gap-6">
      <section className="overflow-hidden rounded-[34px] bg-white/90 text-po-text shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
              Owner to clinic owner
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-[1.08] md:text-5xl">
              Dang ky clinic tu tai khoan owner hien tai.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-po-text-muted md:text-base md:leading-8">
              Tai khoan owner se tao ho so vet neu chua co, sau do gui ho so clinic.
              Nguoi tao clinic duoc gan vai tro ClinicOwner mac dinh.
            </p>
          </div>

          <div className="relative min-h-[220px] overflow-hidden bg-[linear-gradient(135deg,#fff7ed,#f6fffb)] lg:min-h-full">
            <div className="absolute right-8 top-8 grid size-24 place-items-center rounded-[28px] bg-white/75 text-po-primary shadow-xl shadow-orange-200/30 ring-1 ring-po-border/70">
              <Building2 className="size-11" />
            </div>
            <div className="absolute bottom-5 left-5 right-5 rounded-[24px] bg-white/[0.9] p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-po-primary" />
                ClinicOwner flow
              </div>
              <p className="mt-1 text-xs leading-5 text-po-text-muted">
                VetProfile truoc, clinic pending sau, admin duyet cuoi cung.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <FlowStep
          icon={Stethoscope}
          title="1. Ho so vet"
          text={hasVetProfile ? "Da co VetProfile" : "Se tao VetProfile tu form nay"}
          done={hasVetProfile}
        />
        <FlowStep
          icon={Building2}
          title="2. Ho so clinic"
          text={myClinic ? "Da co clinic" : "Gui thong tin phong kham"}
          done={Boolean(myClinic)}
        />
        <FlowStep
          icon={ClipboardCheck}
          title="3. Admin duyet"
          text={myClinic?.status ?? "Cho admin review"}
          done={myClinic?.status === "Approved"}
        />
      </div>

      {isLoading ? (
        <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : myClinic ? (
        <ExistingClinicPanel clinic={myClinic} onOpenClinic={() => navigate("/dashboard/clinic")} />
      ) : (
        <DashboardSection
          title="Thong tin dang ky clinic"
          subtitle="Nhap thong tin co ban de gui ho so cho admin review."
        >
          <form onSubmit={handleSubmit} className="grid gap-5">
            {!hasVetProfile && (
              <div className="grid gap-4 rounded-2xl bg-po-surface-muted/65 p-4 ring-1 ring-po-border/70 md:grid-cols-2">
                <InputField
                  label="Vet license"
                  value={form.vetLicenseNumber}
                  onChange={updateField("vetLicenseNumber")}
                  placeholder="So chung chi hanh nghe"
                />
                <InputField
                  label="Chuyen mon"
                  value={form.specialization}
                  onChange={updateField("specialization")}
                  placeholder="Noi khoa, phau thuat, da lieu..."
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Ten clinic"
                value={form.clinicName}
                onChange={updateField("clinicName")}
                placeholder="PetOmi Clinic District 2"
                required
              />
              <InputField
                label="So giay phep clinic"
                value={form.licenseNumber}
                onChange={updateField("licenseNumber")}
                placeholder="GPKD-..."
              />
              <InputField
                label="Email clinic"
                value={form.email}
                onChange={updateField("email")}
                placeholder="clinic@example.com"
                type="email"
              />
              <InputField
                label="So dien thoai"
                value={form.phone}
                onChange={updateField("phone")}
                placeholder="090..."
              />
              <InputField
                label="Link anh giay phep"
                value={form.licenseImageUrl}
                onChange={updateField("licenseImageUrl")}
                placeholder="https://..."
              />
              <InputField
                label="Dia chi"
                value={form.address}
                onChange={updateField("address")}
                placeholder="So nha, phuong, quan, thanh pho"
              />
            </div>

            {message && (
              <p className="rounded-2xl bg-po-success-soft px-4 py-3 text-sm font-semibold text-po-success">
                {message}
              </p>
            )}
            {errorMessage && (
              <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard/owner")}
                className="inline-flex h-11 items-center rounded-full bg-po-surface-muted px-5 text-sm font-semibold text-po-text ring-1 ring-po-border/80 transition hover:bg-white"
              >
                Huy
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createClinicMutation.isPending ? "Dang gui..." : "Gui dang ky"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </DashboardSection>
      )}
    </div>
  )
}

function FlowStep({
  icon: Icon,
  title,
  text,
  done,
}: {
  icon: React.ElementType
  title: string
  text: string
  done?: boolean
}) {
  return (
    <div className="rounded-[26px] bg-white/85 p-5 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-po-text">{title}</p>
          <p className="mt-1 text-xs leading-5 text-po-text-muted">{text}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-2xl ${done ? "bg-po-success-soft text-po-success" : "bg-po-primary-soft text-po-primary"}`}>
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  )
}

function ExistingClinicPanel({
  clinic,
  onOpenClinic,
}: {
  clinic: MyClinicResponse
  onOpenClinic: () => void
}) {
  return (
    <DashboardSection
      title="Clinic cua ban"
      subtitle="Tai khoan nay da tao clinic, khong can dang ky lai."
      action={
        clinic.status === "Approved" ? (
          <button
            onClick={onOpenClinic}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
          >
            Mo clinic dashboard
            <ArrowRight className="size-3.5" />
          </button>
        ) : null
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl bg-po-surface-muted/65 p-5 ring-1 ring-po-border/70">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/80">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold text-po-text">{clinic.clinicName}</p>
              <p className="mt-1 text-xs text-po-text-muted">{clinic.address ?? "Chua co dia chi"}</p>
            </div>
            <StatusBadge variant={statusVariant(clinic.status)} label={clinic.status} />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-po-text-muted sm:grid-cols-2">
            <InfoRow label="Email" value={clinic.email ?? "Chua co"} />
            <InfoRow label="Phone" value={clinic.phone ?? "Chua co"} />
            <InfoRow label="License" value={clinic.licenseNumber ?? "Chua co"} />
            <InfoRow label="Created" value={formatDate(clinic.createdAt)} />
          </div>

          {clinic.rejectedReason && (
            <p className="mt-4 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
              Ly do tu choi: {clinic.rejectedReason}
            </p>
          )}
        </div>

        <EmptyState
          icon={FileText}
          title={
            clinic.status === "Approved"
              ? "Da duoc duyet"
              : clinic.status === "Rejected"
                ? "Can nop lai ho so"
                : "Dang cho admin duyet"
          }
          description={
            clinic.status === "Approved"
              ? "Ban co the vao clinic dashboard."
              : clinic.status === "Rejected"
                ? "Backend da co endpoint resubmit, FE co the them buoc nop lai tiep theo."
                : "Admin se review thong tin clinic."
          }
          className="rounded-2xl bg-white ring-1 ring-po-border/80"
        />
      </div>
    </DashboardSection>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-po-text-subtle">{label}</p>
      <p className="mt-1 font-semibold text-po-text">{value}</p>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
