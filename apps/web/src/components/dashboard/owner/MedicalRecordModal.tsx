import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"
import {
  createPetMedicalRecordApi,
  updatePetMedicalRecordApi,
} from "@/services/pets.service"
import type {
  CreatePetMedicalRecordRequest,
  PetMedicalRecordResponse,
  UpdatePetMedicalRecordRequest,
} from "@/types"

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: string[]; message?: string }
      | undefined
    return data?.errors?.[0] ?? data?.message ?? fallback
  }
  return fallback
}

const RECORD_TYPES = [
  { value: "Vaccine", label: "Tiêm phòng" },
  { value: "Visit", label: "Khám bệnh" },
  { value: "Medication", label: "Dùng thuốc" },
  { value: "Surgery", label: "Phẫu thuật" },
  { value: "Allergy", label: "Dị ứng" },
  { value: "Illness", label: "Bệnh lý" },
]

interface MedicalRecordModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  editingRecord?: PetMedicalRecordResponse | null
}

export default function MedicalRecordModal({
  isOpen,
  onClose,
  petId,
  editingRecord,
}: MedicalRecordModalProps) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(editingRecord)

  const [recordType, setRecordType] = useState("Visit")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split("T")[0])
  const [vetName, setVetName] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [medicationName, setMedicationName] = useState("")
  const [dosage, setDosage] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [attachmentUrl, setAttachmentUrl] = useState("")

  useEffect(() => {
    if (editingRecord) {
      setRecordType(editingRecord.recordType)
      setTitle(editingRecord.title)
      setDescription(editingRecord.description ?? "")
      setRecordDate(editingRecord.recordDate.split("T")[0])
      setVetName(editingRecord.vetName ?? "")
      setClinicName(editingRecord.clinicName ?? "")
      setMedicationName(editingRecord.medicationName ?? "")
      setDosage(editingRecord.dosage ?? "")
      setStartDate(editingRecord.startDate?.split("T")[0] ?? "")
      setEndDate(editingRecord.endDate?.split("T")[0] ?? "")
      setAttachmentUrl(editingRecord.attachmentUrl ?? "")
    } else {
      setRecordType("Visit")
      setTitle("")
      setDescription("")
      setRecordDate(new Date().toISOString().split("T")[0])
      setVetName("")
      setClinicName("")
      setMedicationName("")
      setDosage("")
      setStartDate("")
      setEndDate("")
      setAttachmentUrl("")
    }
  }, [editingRecord, isOpen])

  const createMutation = useMutation({
    mutationFn: (data: CreatePetMedicalRecordRequest) =>
      createPetMedicalRecordApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-medical", petId] })
      toast.success("Thêm hồ sơ y tế thành công!")
      onClose()
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Không thêm được hồ sơ y tế. Vui lòng thử lại."),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePetMedicalRecordRequest) =>
      updatePetMedicalRecordApi(petId, editingRecord!.medicalRecordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-medical", petId] })
      toast.success("Cập nhật hồ sơ y tế thành công!")
      onClose()
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Không cập nhật được hồ sơ y tế. Vui lòng thử lại."),
      )
    },
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const payload = {
      recordType,
      title: title.trim(),
      description: description.trim() || undefined,
      recordDate,
      vetName: vetName.trim() || undefined,
      clinicName: clinicName.trim() || undefined,
      medicationName: medicationName.trim() || undefined,
      dosage: dosage.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload as CreatePetMedicalRecordRequest)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(580px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">
              {isEdit ? "Cập nhật hồ sơ y tế" : "Thêm hồ sơ y tế"}
            </h3>
            <p className="mt-1 text-sm text-po-text-muted">
              {isEdit
                ? "Cập nhật thông tin y tế cho thú cưng."
                : "Nhập thông tin y tế để lưu vào hồ sơ."}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        {/* Record Type */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            Loại hồ sơ <span className="text-po-danger">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {RECORD_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setRecordType(t.value)}
                disabled={isLoading}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  recordType === t.value
                    ? "border-po-primary bg-po-primary/10 text-po-primary"
                    : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong"
                } ${isLoading ? "opacity-60" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            Tiêu đề <span className="text-po-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Tiêm phòng dại, Khám định kỳ..."
            required
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        {/* Date */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            Ngày ghi nhận <span className="text-po-danger">*</span>
          </label>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        {/* Vet & Clinic */}
        <div className="grid gap-1.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Bác sĩ</label>
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              placeholder="VD: BS. Minh"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Phòng khám</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="VD: Phòng khám Thú Y PetOmi"
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Medication */}
        {(recordType === "Medication" || medicationName) && (
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">Thuốc</label>
              <input
                type="text"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="VD: Amoxicillin"
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">Liều dùng</label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="VD: 1 viên/ngày"
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Date range */}
        {(recordType === "Medication" || startDate) && (
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-semibold text-po-text">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả chi tiết về hồ sơ y tế..."
            rows={3}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-po-border bg-white px-4 py-2.5 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : isEdit ? "Lưu thay đổi" : "Thêm hồ sơ"}
          </button>
        </div>
      </form>
      </div>
      </div>
  )
}
