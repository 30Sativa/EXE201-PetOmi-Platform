import { useEffect, useRef, useState } from "react"
import { CalendarCheck, Check, ChevronLeft, ChevronRight, MapPin, Search, Stethoscope, User, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { getErrorMessage } from "@/lib/utils"
import {
  bookAppointmentApi,
  getAvailableSlotsApi,
  getClinicDoctorsApi,
} from "@/services/appointments.service"
import {
  getMyClinicApi,
  searchClinicsApi,
} from "@/services/clinic.service"
import { getPetsApi } from "@/services/pets.service"
import type {
  AvailableSlotResponse,
  BookAppointmentRequest,
  ClinicDoctorResponse,
  ClinicSearchResult,
  PetResponse,
} from "@/types"

const APPOINTMENT_TYPES = [
  { value: "Checkup", label: "Khám tổng quát", icon: Stethoscope },
  { value: "Vaccination", label: "Tiêm phòng", icon: Stethoscope },
  { value: "Surgery", label: "Phẫu thuật", icon: Stethoscope },
  { value: "Emergency", label: "Cấp cứu", icon: Stethoscope },
  { value: "Grooming", label: "Làm đẹp", icon: Stethoscope },
  { value: "Followup", label: "Tái khám", icon: Stethoscope },
]

interface OwnerBookAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "clinic" | "pet" | "doctor" | "details" | "datetime" | "confirm"

const STEPS: { key: Step; label: string }[] = [
  { key: "clinic", label: "Chọn phòng khám" },
  { key: "pet", label: "Chọn thú cưng" },
  { key: "doctor", label: "Chọn bác sĩ" },
  { key: "details", label: "Chi tiết" },
  { key: "datetime", label: "Ngày & Giờ" },
  { key: "confirm", label: "Xác nhận" },
]

const STEP_ORDER: Step[] = ["clinic", "pet", "doctor", "details", "datetime", "confirm"]

function getStepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step)
}

function goToStep(current: Step, direction: "next" | "prev"): Step {
  const idx = getStepIndex(current)
  if (direction === "next") {
    const nextIdx = Math.min(idx + 1, STEP_ORDER.length - 1)
    return STEP_ORDER[nextIdx]
  }
  const prevIdx = Math.max(idx - 1, 0)
  return STEP_ORDER[prevIdx]
}

function canGoNext(
  step: Step,
  selectedClinic: ClinicSearchResult | null,
  selectedPet: PetResponse | null,
  selectedDoctor: ClinicDoctorResponse | null,
  appointmentType: string,
  selectedDate: string,
  selectedSlot: AvailableSlotResponse | null,
): boolean {
  switch (step) {
    case "clinic":
      return selectedClinic !== null
    case "pet":
      return selectedPet !== null
    case "doctor":
      return selectedDoctor !== null
    case "details":
      return appointmentType !== ""
    case "datetime":
      return selectedDate !== "" && selectedSlot !== null
    default:
      return true
  }
}

export default function OwnerBookAppointmentModal({
  isOpen,
  onClose,
}: OwnerBookAppointmentModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>("clinic")
  const [clinicSearch, setClinicSearch] = useState("")

  const [selectedClinic, setSelectedClinic] = useState<ClinicSearchResult | null>(null)
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<ClinicDoctorResponse | null>(null)
  const [appointmentType, setAppointmentType] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null)

  const [errorMessage, setErrorMessage] = useState("")

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep("clinic")
      setSelectedClinic(null)
      setSelectedPet(null)
      setSelectedDoctor(null)
      setAppointmentType("")
      setNotes("")
      setSelectedDate("")
      setSelectedSlot(null)
      setClinicSearch("")
      setErrorMessage("")
    }
  }, [isOpen])

  // Queries
  const { data: clinics, isLoading: loadingClinics } = useQuery({
    queryKey: ["clinic-search", clinicSearch],
    queryFn: () => searchClinicsApi({ keyword: clinicSearch, pageSize: 10 }),
    enabled: isOpen,
  })

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
    enabled: isOpen,
  })

  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ["clinic-doctors", selectedClinic?.clinicId],
    queryFn: () => getClinicDoctorsApi(selectedClinic!.clinicId),
    enabled: isOpen && selectedClinic !== null,
  })

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["available-slots", selectedClinic?.clinicId, selectedDate, selectedDoctor?.vetClinicId],
    queryFn: () =>
      getAvailableSlotsApi({
        clinicId: selectedClinic!.clinicId,
        date: selectedDate,
        vetClinicId: selectedDoctor?.vetClinicId,
      }),
    enabled: isOpen && selectedClinic !== null && selectedDate !== "",
  })

  const bookMutation = useMutation({
    mutationFn: () => {
      if (!selectedClinic || !selectedPet || !selectedDoctor || !selectedSlot) {
        return Promise.reject(new Error("Thiếu thông tin đặt lịch."))
      }
      const payload: BookAppointmentRequest = {
        clinicId: selectedClinic.clinicId,
        vetClinicId: selectedDoctor.vetClinicId,
        petId: selectedPet.petId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        appointmentType: appointmentType || "Checkup",
        notes: notes.trim() || undefined,
      }
      return bookAppointmentApi(payload)
    },
    onSuccess: () => {
      toast.success("Đặt lịch hẹn thành công!")
      queryClient.invalidateQueries({ queryKey: ["owner-appointments"] })
      onClose()
    },
    onError: (error) => {
      const msg = getErrorMessage(error, "Đặt lịch thất bại. Vui lòng thử lại.")
      setErrorMessage(msg)
      toast.error(msg)
    },
  })

  const handleClose = () => {
    if (bookMutation.isPending) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const goNext = () => {
    if (!canGoNext(step, selectedClinic, selectedPet, selectedDoctor, appointmentType, selectedDate, selectedSlot)) return
    setStep((s) => goToStep(s, "next"))
  }

  const goPrev = () => {
    setStep((s) => goToStep(s, "prev"))
  }

  const currentStepIndex = getStepIndex(step)
  const canGoNextVal = canGoNext(step, selectedClinic, selectedPet, selectedDoctor, appointmentType, selectedDate, selectedSlot)
  const showBack = step !== "clinic"

  const availableSlots = Array.isArray(slots) ? slots : []

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto flex h-[min(90vh,680px)] w-[min(560px,100%)] flex-col rounded-[28px] border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-po-border px-6 py-5">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Đặt lịch hẹn</h3>
            <p className="mt-1 text-xs text-po-text-muted">Hoàn tất các bước để đặt lịch khám cho thú cưng.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={bookMutation.isPending}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="shrink-0 border-b border-po-border px-6 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1">
                <div
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    i < currentStepIndex
                      ? "bg-po-primary text-white"
                      : i === currentStepIndex
                        ? "bg-po-primary text-white ring-2 ring-po-primary/20"
                        : "bg-po-surface-muted text-po-text-subtle",
                  )}
                >
                  {i < currentStepIndex ? <Check className="size-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-4 transition-colors",
                      i < currentStepIndex ? "bg-po-primary" : "bg-po-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs font-semibold text-po-primary">
            {STEPS[currentStepIndex]?.label}
          </p>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* Step: Clinic */}
          {step === "clinic" && (
            <ClinicStep
              clinics={clinics?.items ?? []}
              loading={loadingClinics}
              search={clinicSearch}
              onSearch={setClinicSearch}
              selected={selectedClinic}
              onSelect={setSelectedClinic}
            />
          )}

          {/* Step: Pet */}
          {step === "pet" && (
            <PetStep
              pets={pets ?? []}
              selected={selectedPet}
              onSelect={setSelectedPet}
            />
          )}

          {/* Step: Doctor */}
          {step === "doctor" && (
            <DoctorStep
              doctors={doctors ?? []}
              loading={loadingDoctors}
              selected={selectedDoctor}
              onSelect={setSelectedDoctor}
            />
          )}

          {/* Step: Details */}
          {step === "details" && (
            <DetailsStep
              appointmentType={appointmentType}
              notes={notes}
              onTypeChange={setAppointmentType}
              onNotesChange={setNotes}
            />
          )}

          {/* Step: DateTime */}
          {step === "datetime" && (
            <DateTimeStep
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              slots={availableSlots}
              loading={loadingSlots}
              onDateChange={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
              }}
              onSlotSelect={setSelectedSlot}
            />
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <ConfirmStep
              clinic={selectedClinic}
              pet={selectedPet}
              doctor={selectedDoctor}
              appointmentType={appointmentType}
              date={selectedDate}
              slot={selectedSlot}
              notes={notes}
              errorMessage={errorMessage}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-t border-po-border px-6 py-4">
          <div>
            {showBack && (
              <button
                onClick={goPrev}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
              >
                <ChevronLeft className="size-4" />
                Quay lại
              </button>
            )}
          </div>

          {step !== "confirm" ? (
            <button
              onClick={goNext}
              disabled={!canGoNextVal}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-sm shadow-orange-200/40 transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tiếp tục
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white shadow-sm shadow-orange-200/40 transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bookMutation.isPending ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== Sub-components =====

function ClinicStep({
  clinics,
  loading,
  search,
  onSearch,
  selected,
  onSelect,
}: {
  clinics: ClinicSearchResult[]
  loading: boolean
  search: string
  onSearch: (v: string) => void
  selected: ClinicSearchResult | null
  onSelect: (c: ClinicSearchResult) => void
}) {
  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-po-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Tìm kiếm phòng khám..."
          className="h-11 w-full rounded-2xl border border-po-border bg-white pl-10 pr-4 text-sm text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="size-6 animate-spin rounded-full border-2 border-po-border border-t-po-primary" />
        </div>
      ) : clinics.length === 0 ? (
        <p className="py-6 text-center text-sm text-po-text-muted">
          Không tìm thấy phòng khám nào.
        </p>
      ) : (
        <div className="grid gap-2">
          {clinics.map((clinic) => (
            <button
              key={clinic.clinicId}
              onClick={() => onSelect(clinic)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                selected?.clinicId === clinic.clinicId
                  ? "border-po-primary bg-po-primary-soft ring-2 ring-po-primary/20"
                  : "border-po-border bg-white hover:border-po-primary/50 hover:bg-po-surface-muted/50",
              )}
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-surface-muted text-po-text-muted">
                <MapPin className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-po-text">{clinic.clinicName}</p>
                <p className="mt-0.5 text-xs text-po-text-muted line-clamp-1">
                  {clinic.address ?? "Chưa có địa chỉ"}
                </p>
              </div>
              {selected?.clinicId === clinic.clinicId && (
                <div className="grid size-5 shrink-0 place-items-center rounded-full bg-po-primary text-white">
                  <Check className="size-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PetStep({
  pets,
  selected,
  onSelect,
}: {
  pets: PetResponse[]
  selected: PetResponse | null
  onSelect: (p: PetResponse) => void
}) {
  if (pets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-po-text-muted">Bạn chưa có thú cưng nào.</p>
        <p className="mt-1 text-xs text-po-text-subtle">Hãy thêm thú cưng trước khi đặt lịch.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {pets.map((pet) => (
        <button
          key={pet.petId}
          onClick={() => onSelect(pet)}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
            selected?.petId === pet.petId
              ? "border-po-primary bg-po-primary-soft ring-2 ring-po-primary/20"
              : "border-po-border bg-white hover:border-po-primary/50 hover:bg-po-surface-muted/50",
          )}
        >
          {pet.avatarUrl ? (
            <img
              src={pet.avatarUrl}
              alt={pet.name}
              className="size-10 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-surface-muted text-po-text-muted">
              <User className="size-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-po-text">{pet.name}</p>
            <p className="mt-0.5 text-xs text-po-text-muted">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
            </p>
          </div>
          {selected?.petId === pet.petId && (
            <div className="grid size-5 shrink-0 place-items-center rounded-full bg-po-primary text-white">
              <Check className="size-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function DoctorStep({
  doctors,
  loading,
  selected,
  onSelect,
}: {
  doctors: ClinicDoctorResponse[]
  loading: boolean
  selected: ClinicDoctorResponse | null
  onSelect: (d: ClinicDoctorResponse) => void
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="size-6 animate-spin rounded-full border-2 border-po-border border-t-po-primary" />
      </div>
    )
  }

  if (doctors.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-po-text-muted">Không có bác sĩ nào tại phòng khám này.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      {doctors.map((doctor) => (
        <button
          key={doctor.vetClinicId}
          onClick={() => onSelect(doctor)}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 text-left transition",
            selected?.vetClinicId === doctor.vetClinicId
              ? "border-po-primary bg-po-primary-soft ring-2 ring-po-primary/20"
              : "border-po-border bg-white hover:border-po-primary/50 hover:bg-po-surface-muted/50",
          )}
        >
          {doctor.avatarUrl ? (
            <img
              src={doctor.avatarUrl}
              alt={doctor.fullName}
              className="size-10 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
              <User className="size-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-po-text">{doctor.fullName}</p>
            {doctor.specialization && (
              <p className="mt-0.5 text-xs text-po-text-muted">{doctor.specialization}</p>
            )}
          </div>
          {selected?.vetClinicId === doctor.vetClinicId && (
            <div className="grid size-5 shrink-0 place-items-center rounded-full bg-po-primary text-white">
              <Check className="size-3" />
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function DetailsStep({
  appointmentType,
  notes,
  onTypeChange,
  onNotesChange,
}: {
  appointmentType: string
  notes: string
  onTypeChange: (v: string) => void
  onNotesChange: (v: string) => void
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-po-text">Loại khám</p>
        <div className="grid grid-cols-2 gap-2">
          {APPOINTMENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={cn(
                "flex items-center gap-2 rounded-2xl border p-3 text-left text-sm font-semibold transition",
                appointmentType === t.value
                  ? "border-po-primary bg-po-primary-soft text-po-primary ring-2 ring-po-primary/20"
                  : "border-po-border bg-white text-po-text hover:border-po-primary/50",
              )}
            >
              <t.icon className="size-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <p className="text-sm font-semibold text-po-text">Ghi chú (tùy chọn)</p>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Mô tả triệu chứng, lý do khám, hoặc yêu cầu đặc biệt..."
          className="w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm text-po-text outline-none transition placeholder:text-po-text-muted/70 focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
      </div>
    </div>
  )
}

function DateTimeStep({
  selectedDate,
  selectedSlot,
  slots,
  loading,
  onDateChange,
  onSlotSelect,
}: {
  selectedDate: string
  selectedSlot: AvailableSlotResponse | null
  slots: AvailableSlotResponse[]
  loading: boolean
  onDateChange: (date: string) => void
  onSlotSelect: (slot: AvailableSlotResponse) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const minDate = today.toISOString().split("T")[0]

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="grid gap-5">
      {/* Date picker */}
      <div className="grid gap-1.5">
        <p className="text-sm font-semibold text-po-text">Chọn ngày</p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          min={minDate}
          max={maxDateStr}
          className="h-11 w-full cursor-pointer rounded-2xl border border-po-border bg-white px-4 text-sm text-po-text outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary/20"
        />
      </div>

      {/* Slot picker */}
      {selectedDate && (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-po-text">
            Chọn giờ {selectedDate && `- ${formatDateDisplay(selectedDate)}`}
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="size-6 animate-spin rounded-full border-2 border-po-border border-t-po-primary" />
            </div>
          ) : slots.length === 0 ? (
            <p className="py-4 text-center text-sm text-po-text-muted">
              Không có slot trống vào ngày này. Vui lòng chọn ngày khác.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot, i) => {
                const isSelected =
                  selectedSlot &&
                  slot.startTime === selectedSlot.startTime &&
                  slot.endTime === selectedSlot.endTime
                return (
                  <button
                    key={`${slot.startTime}-${i}`}
                    onClick={() => onSlotSelect(slot)}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border p-2.5 text-sm font-semibold transition",
                      isSelected
                        ? "border-po-primary bg-po-primary text-white"
                        : "border-po-border bg-white text-po-text hover:border-po-primary/50",
                    )}
                  >
                    <CalendarCheck className="mb-1 size-4" />
                    {slot.startTime.slice(0, 5)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConfirmStep({
  clinic,
  pet,
  doctor,
  appointmentType,
  date,
  slot,
  notes,
  errorMessage,
}: {
  clinic: ClinicSearchResult | null
  pet: PetResponse | null
  doctor: ClinicDoctorResponse | null
  appointmentType: string
  date: string
  slot: AvailableSlotResponse | null
  notes: string
  errorMessage: string
}) {
  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const typeLabel =
    APPOINTMENT_TYPES.find((t) => t.value === appointmentType)?.label ??
    appointmentType

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl bg-po-surface-muted/70 p-4 ring-1 ring-po-border/70">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-po-text-subtle">
          Thông tin đặt lịch
        </p>
        <div className="grid gap-3 text-sm">
          <InfoRow label="Phòng khám" value={clinic?.clinicName ?? "-"} />
          <InfoRow label="Địa chỉ" value={clinic?.address ?? "-"} />
          <InfoRow label="Thú cưng" value={pet?.name ?? "-"} />
          <InfoRow label="Bác sĩ" value={doctor?.fullName ?? "-"} />
          <InfoRow label="Loại khám" value={typeLabel} />
          <InfoRow label="Ngày" value={date ? formatDateDisplay(date) : "-"} />
          <InfoRow label="Giờ" value={slot ? `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)}` : "-"} />
          {notes && <InfoRow label="Ghi chú" value={notes} />}
        </div>
      </div>

      {errorMessage && (
        <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
          {errorMessage}
        </p>
      )}

      <div className="rounded-2xl border border-po-warning/30 bg-po-warning-soft px-4 py-3 text-xs font-semibold text-po-warning">
        Lịch hẹn sẽ ở trạng thái "Chờ xác nhận". Phòng khám sẽ xác nhận trước giờ khám.
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-po-text-muted">{label}</span>
      <span className="text-right font-semibold text-po-text">{value}</span>
    </div>
  )
}
