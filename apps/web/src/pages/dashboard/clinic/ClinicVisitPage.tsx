import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Pill, Plus, Receipt, Save, Stethoscope, Trash2 } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import { useMyClinic } from "@/hooks/useClinicQueries"
import { formatCurrency, formatShortId } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import {
  autoComposeInvoiceApi,
  getInvoiceByAppointmentApi,
  payInvoiceApi,
  requestSePayPaymentApi,
} from "@/services/clinic-billing.service"
import {
  addPrescriptionApi,
  completeExaminationApi,
  createExaminationApi,
  deletePrescriptionApi,
  getExaminationByAppointmentApi,
  getPrescriptionsApi,
  updateExaminationApi,
} from "@/services/clinic-visit.service"
import { getInventoryApi } from "@/services/clinic.service"
import type {
  AddPrescriptionItemRequest,
  ExaminationResponse,
  InvoiceResponse,
  PrescriptionItemResponse,
  SePayPaymentRequestResponse,
  UpdateExaminationRequest,
} from "@/types"

type ExamForm = {
  chiefComplaint: string
  weightKg: string
  temperatureC: string
  heartRate: string
  respiratoryRate: string
  examinationNotes: string
  diagnosis: string
  treatmentPlan: string
}

const emptyExamForm: ExamForm = {
  chiefComplaint: "",
  weightKg: "",
  temperatureC: "",
  heartRate: "",
  respiratoryRate: "",
  examinationNotes: "",
  diagnosis: "",
  treatmentPlan: "",
}

function toExamForm(exam: ExaminationResponse | null | undefined): ExamForm {
  if (!exam) return emptyExamForm

  return {
    chiefComplaint: exam.chiefComplaint ?? "",
    weightKg: exam.weightKg?.toString() ?? "",
    temperatureC: exam.temperatureC?.toString() ?? "",
    heartRate: exam.heartRate?.toString() ?? "",
    respiratoryRate: exam.respiratoryRate?.toString() ?? "",
    examinationNotes: exam.examinationNotes ?? "",
    diagnosis: exam.diagnosis ?? "",
    treatmentPlan: exam.treatmentPlan ?? "",
  }
}

function toNullableNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toExamPayload(form: ExamForm): UpdateExaminationRequest {
  return {
    chiefComplaint: form.chiefComplaint.trim(),
    weightKg: toNullableNumber(form.weightKg),
    temperatureC: toNullableNumber(form.temperatureC),
    heartRate: toNullableNumber(form.heartRate),
    respiratoryRate: toNullableNumber(form.respiratoryRate),
    examinationNotes: form.examinationNotes.trim() || null,
    diagnosis: form.diagnosis.trim() || null,
    treatmentPlan: form.treatmentPlan.trim() || null,
  }
}

export default function ClinicVisitPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { appointmentId = "" } = useParams()
  const { data: clinic, isLoading: isClinicLoading } = useMyClinic()
  const clinicId = clinic?.clinicId ?? ""
  const [form, setForm] = useState<ExamForm>(emptyExamForm)
  const [prescriptionForm, setPrescriptionForm] = useState<AddPrescriptionItemRequest>({
    medicationName: "",
    dosage: "",
    frequency: "",
    durationDays: 3,
    instructions: "",
    inventoryItemId: "",
  })
  const [discountAmount, setDiscountAmount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState("Cash")
  const [paidAmount, setPaidAmount] = useState("")
  const [qrRequest, setQrRequest] = useState<SePayPaymentRequestResponse | null>(null)

  const examQuery = useQuery({
    queryKey: ["clinic", clinicId, "examination", appointmentId],
    queryFn: () => getExaminationByAppointmentApi(appointmentId),
    enabled: Boolean(clinicId && appointmentId),
  })

  const exam = examQuery.data ?? null
  const examinationId = exam?.id ?? ""

  const prescriptionsQuery = useQuery({
    queryKey: ["clinic", clinicId, "prescriptions", examinationId],
    queryFn: () => getPrescriptionsApi(clinicId, examinationId),
    enabled: Boolean(clinicId && examinationId),
  })

  const invoiceQuery = useQuery({
    queryKey: ["clinic", clinicId, "invoice", appointmentId],
    queryFn: () => getInvoiceByAppointmentApi(clinicId, appointmentId),
    enabled: Boolean(clinicId && appointmentId),
  })

  const inventoryQuery = useQuery({
    queryKey: ["clinic", clinicId, "inventory"],
    queryFn: () => getInventoryApi(clinicId),
    enabled: Boolean(clinicId),
  })

  useEffect(() => {
    queueMicrotask(() => setForm(toExamForm(exam)))
  }, [exam])

  useEffect(() => {
    const finalAmount = invoiceQuery.data?.finalAmount
    if (finalAmount) {
      queueMicrotask(() => setPaidAmount(String(finalAmount)))
    }
  }, [invoiceQuery.data?.finalAmount])

  const createExamMutation = useMutation({
    mutationFn: () =>
      createExaminationApi(clinicId, {
        appointmentId,
        chiefComplaint: form.chiefComplaint.trim() || "Khám tại quầy",
        weightKg: toNullableNumber(form.weightKg),
        temperatureC: toNullableNumber(form.temperatureC),
        heartRate: toNullableNumber(form.heartRate),
        respiratoryRate: toNullableNumber(form.respiratoryRate),
        examinationNotes: form.examinationNotes.trim() || null,
        diagnosis: form.diagnosis.trim() || null,
        treatmentPlan: form.treatmentPlan.trim() || null,
      }),
    onSuccess: async () => {
      toast.success("Đã tạo phiếu khám.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "examination", appointmentId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo phiếu khám.")),
  })

  const saveExamMutation = useMutation({
    mutationFn: () => updateExaminationApi(clinicId, examinationId, toExamPayload(form)),
    onSuccess: async () => {
      toast.success("Đã lưu phiếu khám.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "examination", appointmentId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể lưu phiếu khám.")),
  })

  const completeExamMutation = useMutation({
    mutationFn: () => completeExaminationApi(clinicId, examinationId),
    onSuccess: async () => {
      toast.success("Đã hoàn tất phiếu khám.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "examination", appointmentId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể hoàn tất phiếu khám.")),
  })

  const addPrescriptionMutation = useMutation({
    mutationFn: () =>
      addPrescriptionApi(clinicId, examinationId, {
        ...prescriptionForm,
        medicationName: prescriptionForm.medicationName.trim(),
        dosage: prescriptionForm.dosage.trim(),
        frequency: prescriptionForm.frequency.trim(),
        instructions: prescriptionForm.instructions?.trim() || null,
        inventoryItemId: prescriptionForm.inventoryItemId || null,
      }),
    onSuccess: async () => {
      toast.success("Đã thêm thuốc vào toa.")
      setPrescriptionForm({
        medicationName: "",
        dosage: "",
        frequency: "",
        durationDays: 3,
        instructions: "",
        inventoryItemId: "",
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "prescriptions", examinationId] }),
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "inventory"] }),
      ])
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể thêm thuốc.")),
  })

  const deletePrescriptionMutation = useMutation({
    mutationFn: (prescriptionId: string) => deletePrescriptionApi(clinicId, examinationId, prescriptionId),
    onSuccess: async () => {
      toast.success("Đã xóa thuốc khỏi toa.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "prescriptions", examinationId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể xóa thuốc.")),
  })

  const autoComposeMutation = useMutation({
    mutationFn: () =>
      autoComposeInvoiceApi(clinicId, {
        appointmentId,
        examinationId: examinationId || null,
        discountAmount: toNullableNumber(discountAmount) ?? 0,
        notes: "Auto-compose từ phiếu khám",
        includeService: true,
        includePrescriptions: true,
      }),
    onSuccess: async () => {
      toast.success("Đã tạo hóa đơn tự động.")
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice", appointmentId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo hóa đơn.")),
  })

  const payMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) =>
      payInvoiceApi(clinicId, invoice.id, {
        paymentMethod,
        paidAmount: toNullableNumber(paidAmount) ?? invoice.finalAmount,
      }),
    onSuccess: async () => {
      toast.success("Đã ghi nhận thanh toán.")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "dashboard-summary"] }),
      ])
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể thanh toán hóa đơn.")),
  })

  const sePayMutation = useMutation({
    mutationFn: (invoice: InvoiceResponse) => requestSePayPaymentApi(clinicId, invoice.id),
    onSuccess: async (result) => {
      toast.success("Đã tạo QR SePay.")
      setQrRequest(result)
      await queryClient.invalidateQueries({ queryKey: ["clinic", clinicId, "invoice", appointmentId] })
    },
    onError: (error) => toast.error(getErrorMessage(error, "Không thể tạo QR SePay.")),
  })

  if (isClinicLoading || examQuery.isLoading) {
    return <div className="rounded-[30px] bg-white/88 py-16 text-center ring-1 ring-po-border/80"><LoadingSpinner /></div>
  }

  if (!clinic) {
    return <EmptyState icon={Stethoscope} title="Chưa có clinic" description="Bạn cần có hồ sơ clinic trước khi khám bệnh." />
  }

  const prescriptions = prescriptionsQuery.data ?? []
  const invoice = invoiceQuery.data ?? null

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/dashboard/clinic/appointments")}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-po-text-muted ring-1 ring-po-border/80 transition hover:bg-po-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại lịch hẹn
          </button>
          <h2 className="mt-3 text-xl font-extrabold text-po-text">Phiếu khám {formatShortId(appointmentId)}</h2>
          <p className="mt-1 text-sm text-po-text-muted">SOAP, toa thuốc, hóa đơn và thanh toán trong một màn hình.</p>
        </div>
        {exam ? <StatusBadge variant={exam.status === "Completed" ? "success" : "info"} label={exam.status} /> : <StatusBadge variant="warning" label="Chưa có phiếu" />}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <DashboardSection
          title="SOAP"
          subtitle="Ghi nhận triệu chứng, chỉ số, chẩn đoán và kế hoạch điều trị."
          action={
            exam ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => saveExamMutation.mutate()}
                  disabled={saveExamMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
                >
                  <Save className="size-4" />
                  Lưu
                </button>
                <button
                  onClick={() => completeExamMutation.mutate()}
                  disabled={!form.diagnosis.trim() || completeExamMutation.isPending}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-po-success px-4 text-sm font-semibold text-white transition hover:bg-po-success/90 disabled:opacity-60"
                >
                  <CheckCircle2 className="size-4" />
                  Hoàn tất
                </button>
              </div>
            ) : (
              <button
                onClick={() => createExamMutation.mutate()}
                disabled={createExamMutation.isPending}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
              >
                <Plus className="size-4" />
                Tạo phiếu khám
              </button>
            )
          }
        >
          <ExamFormView form={form} onChange={setForm} />
        </DashboardSection>

        <div className="grid gap-6">
          <DashboardSection title="Toa thuốc" subtitle="Kê thuốc và có thể link với kho.">
            {!exam ? (
              <EmptyState icon={Pill} title="Chưa có phiếu khám" description="Tạo phiếu khám trước khi kê đơn." />
            ) : (
              <div className="grid gap-4">
                <PrescriptionForm
                  form={prescriptionForm}
                  inventory={inventoryQuery.data ?? []}
                  onChange={setPrescriptionForm}
                  onSubmit={() => addPrescriptionMutation.mutate()}
                  isSubmitting={addPrescriptionMutation.isPending}
                />
                <PrescriptionList
                  prescriptions={prescriptions}
                  isLoading={prescriptionsQuery.isLoading}
                  onDelete={(id) => deletePrescriptionMutation.mutate(id)}
                />
              </div>
            )}
          </DashboardSection>

          <DashboardSection title="Hóa đơn" subtitle="Tạo hóa đơn từ dịch vụ và toa thuốc, sau đó thu tiền hoặc tạo QR SePay.">
            <InvoicePanel
              invoice={invoice}
              qrRequest={qrRequest}
              discountAmount={discountAmount}
              paymentMethod={paymentMethod}
              paidAmount={paidAmount}
              isLoading={invoiceQuery.isLoading}
              isComposing={autoComposeMutation.isPending}
              isPaying={payMutation.isPending}
              isRequestingQr={sePayMutation.isPending}
              onDiscountChange={setDiscountAmount}
              onPaymentMethodChange={setPaymentMethod}
              onPaidAmountChange={setPaidAmount}
              onCompose={() => autoComposeMutation.mutate()}
              onPay={() => invoice && payMutation.mutate(invoice)}
              onRequestQr={() => invoice && sePayMutation.mutate(invoice)}
            />
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}

function ExamFormView({
  form,
  onChange,
}: {
  form: ExamForm
  onChange: (form: ExamForm) => void
}) {
  const update = (key: keyof ExamForm, value: string) => onChange({ ...form, [key]: value })

  return (
    <div className="grid gap-4">
      <Textarea label="Triệu chứng chính" value={form.chiefComplaint} onChange={(value) => update("chiefComplaint", value)} required />
      <div className="grid gap-4 md:grid-cols-4">
        <Input label="Cân nặng (kg)" value={form.weightKg} onChange={(value) => update("weightKg", value)} />
        <Input label="Nhiệt độ (°C)" value={form.temperatureC} onChange={(value) => update("temperatureC", value)} />
        <Input label="Nhịp tim" value={form.heartRate} onChange={(value) => update("heartRate", value)} />
        <Input label="Nhịp thở" value={form.respiratoryRate} onChange={(value) => update("respiratoryRate", value)} />
      </div>
      <Textarea label="Ghi chú khám" value={form.examinationNotes} onChange={(value) => update("examinationNotes", value)} />
      <Textarea label="Chẩn đoán" value={form.diagnosis} onChange={(value) => update("diagnosis", value)} required />
      <Textarea label="Kế hoạch điều trị" value={form.treatmentPlan} onChange={(value) => update("treatmentPlan", value)} />
    </div>
  )
}

function PrescriptionForm({
  form,
  inventory,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  form: AddPrescriptionItemRequest
  inventory: Array<{ itemId: string; itemName: string; quantity: number }>
  isSubmitting: boolean
  onChange: (form: AddPrescriptionItemRequest) => void
  onSubmit: () => void
}) {
  const update = (key: keyof AddPrescriptionItemRequest, value: string | number) => onChange({ ...form, [key]: value })
  const canSubmit = form.medicationName.trim() && form.dosage.trim() && form.frequency.trim() && form.durationDays > 0

  return (
    <div className="rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
      <div className="grid gap-3">
        <Input label="Tên thuốc" value={form.medicationName} onChange={(value) => update("medicationName", value)} />
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Liều dùng" value={form.dosage} onChange={(value) => update("dosage", value)} />
          <Input label="Tần suất" value={form.frequency} onChange={(value) => update("frequency", value)} />
          <Input label="Số ngày" value={String(form.durationDays)} onChange={(value) => update("durationDays", Number(value) || 0)} />
        </div>
        <label className="grid gap-1.5 text-sm font-semibold text-po-text">
          Link kho
          <select
            value={form.inventoryItemId ?? ""}
            onChange={(event) => update("inventoryItemId", event.target.value)}
            className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
          >
            <option value="">Không link kho</option>
            {inventory.map((item) => (
              <option key={item.itemId} value={item.itemId}>
                {item.itemName} · tồn {item.quantity}
              </option>
            ))}
          </select>
        </label>
        <Textarea label="Hướng dẫn" value={form.instructions ?? ""} onChange={(value) => update("instructions", value)} />
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          <Plus className="size-4" />
          Thêm thuốc
        </button>
      </div>
    </div>
  )
}

function PrescriptionList({
  prescriptions,
  isLoading,
  onDelete,
}: {
  prescriptions: PrescriptionItemResponse[]
  isLoading: boolean
  onDelete: (id: string) => void
}) {
  if (isLoading) return <div className="py-6 text-center"><LoadingSpinner /></div>
  if (prescriptions.length === 0) return <EmptyState icon={Pill} title="Chưa có thuốc" description="Thêm thuốc để auto-compose hóa đơn chính xác hơn." />

  return (
    <div className="grid gap-3">
      {prescriptions.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3">
          <div>
            <p className="text-sm font-bold text-po-text">{item.medicationName}</p>
            <p className="mt-1 text-xs text-po-text-muted">{item.dosage} · {item.frequency} · {item.durationDays} ngày</p>
            {item.instructions ? <p className="mt-1 text-xs text-po-text-subtle">{item.instructions}</p> : null}
          </div>
          <button onClick={() => onDelete(item.id)} className="rounded-full p-2 text-po-danger transition hover:bg-po-danger-soft">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

function InvoicePanel({
  invoice,
  qrRequest,
  discountAmount,
  paymentMethod,
  paidAmount,
  isLoading,
  isComposing,
  isPaying,
  isRequestingQr,
  onDiscountChange,
  onPaymentMethodChange,
  onPaidAmountChange,
  onCompose,
  onPay,
  onRequestQr,
}: {
  invoice: InvoiceResponse | null
  qrRequest: SePayPaymentRequestResponse | null
  discountAmount: string
  paymentMethod: string
  paidAmount: string
  isLoading: boolean
  isComposing: boolean
  isPaying: boolean
  isRequestingQr: boolean
  onDiscountChange: (value: string) => void
  onPaymentMethodChange: (value: string) => void
  onPaidAmountChange: (value: string) => void
  onCompose: () => void
  onPay: () => void
  onRequestQr: () => void
}) {
  const qrUrl = qrRequest?.qrCodeUrl ?? ""
  const paymentReference = qrRequest?.paymentReference || invoice?.paymentReference

  if (isLoading) return <div className="py-6 text-center"><LoadingSpinner /></div>

  if (!invoice) {
    return (
      <div className="grid gap-4">
        <Input label="Giảm giá" value={discountAmount} onChange={onDiscountChange} />
        <button
          onClick={onCompose}
          disabled={isComposing}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          <Receipt className="size-4" />
          {isComposing ? "Đang tạo..." : "Tạo hóa đơn tự động"}
        </button>
      </div>
    )
  }

  const isPaid = invoice.status.toLowerCase() === "paid"

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-po-border bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-po-text-subtle">Mã hóa đơn</p>
            <p className="mt-1 text-lg font-extrabold text-po-text">{invoice.invoiceCode}</p>
          </div>
          <StatusBadge variant={isPaid ? "success" : "warning"} label={invoice.status} />
        </div>
        <p className="mt-4 text-3xl font-extrabold text-po-text">{formatCurrency(invoice.finalAmount)}</p>
        {invoice.warnings.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {invoice.warnings.map((warning) => (
              <p key={warning} className="rounded-2xl bg-po-warning-soft px-3 py-2 text-xs font-semibold text-po-warning">{warning}</p>
            ))}
          </div>
        ) : null}
      </div>

      {!isPaid ? (
        <div className="grid gap-3 rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
          <label className="grid gap-1.5 text-sm font-semibold text-po-text">
            Phương thức
            <select
              value={paymentMethod}
              onChange={(event) => onPaymentMethodChange(event.target.value)}
              className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium outline-none focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
            >
              <option value="Cash">Tiền mặt</option>
              <option value="BankTransfer">Chuyển khoản thủ công</option>
            </select>
          </label>
          <Input label="Số tiền thu" value={paidAmount} onChange={onPaidAmountChange} />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPay}
              disabled={isPaying}
              className="inline-flex h-10 items-center rounded-full bg-po-success px-5 text-sm font-semibold text-white transition hover:bg-po-success/90 disabled:opacity-60"
            >
              {isPaying ? "Đang thu..." : "Ghi nhận thu tiền"}
            </button>
            <button
              onClick={onRequestQr}
              disabled={isRequestingQr}
              className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-po-primary ring-1 ring-po-border/80 transition hover:bg-po-primary-soft disabled:opacity-60"
            >
              {isRequestingQr ? "Đang tạo QR..." : "Tạo QR SePay"}
            </button>
          </div>
          {(qrRequest?.qrCodeUrl || invoice.qrCodeUrl) ? (
            <>
            <img src={qrUrl || invoice.qrCodeUrl || ""} alt={`QR thanh toán ${invoice.invoiceCode}`} className="mx-auto max-h-72 rounded-2xl bg-white p-3 ring-1 ring-po-border/80" />
            {paymentReference ? (
              <p className="mx-auto rounded-2xl bg-po-primary-soft px-4 py-2 font-mono text-base font-extrabold text-po-primary">
                {paymentReference}
              </p>
            ) : null}
            </>
          ) : null}
        </div>
      ) : (
        <p className="rounded-2xl bg-po-success-soft px-4 py-3 text-sm font-semibold text-po-success">Hóa đơn đã thanh toán.</p>
      )}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}

function Textarea({
  label,
  value,
  required,
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-po-text">
      <span>{label}{required ? <span className="ml-1 text-po-danger">*</span> : null}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm font-medium text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
      />
    </label>
  )
}
