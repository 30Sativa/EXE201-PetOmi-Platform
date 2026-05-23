import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  Camera,
  Heart,
  Link2,
  Pencil,
  Plus,
  Scale,
  Trash2,
  UserRound,
  Weight,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import Avatar from "@/components/ui/Avatar"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import PetModal from "@/components/dashboard/owner/PetModal"
import HealthProfileModal from "@/components/dashboard/owner/HealthProfileModal"
import WeightLogModal from "@/components/dashboard/owner/WeightLogModal"
import MedicalRecordModal from "@/components/dashboard/owner/MedicalRecordModal"
import PhotoModal from "@/components/dashboard/owner/PhotoModal"
import TabFilter from "@/components/ui/TabFilter"
import {
  deletePetApi,
  getPetAccessApi,
  getPetByIdApi,
  getPetHealthProfileApi,
  getPetMedicalRecordsApi,
  getPetPhotosApi,
  getPetWeightLogsApi,
  revokePetAccessApi,
} from "@/services/pets.service"
import type {
  PetHealthProfileResponse,
  PetMedicalRecordResponse,
  PetPhotoResponse,
  PetResponse,
  PetUserAccessResponse,
  PetWeightLogResponse,
} from "@/types"
import { cn } from "@/lib/utils"

// ==================== HELPERS ====================

const speciesEmoji: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  default: "🐾",
}

const getSpeciesEmoji = (species: string) =>
  speciesEmoji[species] ?? speciesEmoji.default

const formatAge = (dob: string | null) => {
  if (!dob) return null
  try {
    const birth = new Date(dob)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    const totalMonths = years * 12 + months
    if (totalMonths < 1) return "< 1 tháng"
    if (totalMonths < 12) return `${totalMonths} tháng`
    const y = Math.floor(totalMonths / 12)
    return `${y} tuổi`
  } catch {
    return null
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—"
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

const MEDICAL_RECORD_TYPES = [
  { value: "all", label: "Tất cả" },
  { value: "Vaccination", label: "Tiêm phòng" },
  { value: "Checkup", label: "Khám định kỳ" },
  { value: "Surgery", label: "Phẫu thuật" },
  { value: "Illness", label: "Bệnh lý" },
  { value: "Medication", label: "Thuốc" },
  { value: "LabTest", label: "Xét nghiệm" },
  { value: "Dental", label: "Răng miệng" },
  { value: "Grooming", label: "Vệ sinh" },
]

type TabValue = "overview" | "health" | "weight" | "medical" | "photos" | "sharing"

// ==================== PAGE ====================

export default function OwnerPetDetailPage() {
  const { petId } = useParams<{ petId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabValue>("overview")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deletingPet, setDeletingPet] = useState(false)
  const [revokingAccess, setRevokingAccess] = useState<PetUserAccessResponse | null>(null)
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false)
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<PetMedicalRecordResponse | null>(null)

  // ==================== QUERIES ====================

  const { data: pet, isLoading: loadingPet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => getPetByIdApi(petId!),
    enabled: Boolean(petId),
  })

  const { data: healthProfile, isLoading: loadingHealth } = useQuery({
    queryKey: ["pet-health", petId],
    queryFn: () => getPetHealthProfileApi(petId!),
    enabled: Boolean(petId) && activeTab === "health",
  })

  const { data: weightLogs, isLoading: loadingWeight } = useQuery({
    queryKey: ["pet-weight", petId],
    queryFn: () => getPetWeightLogsApi(petId!),
    enabled: Boolean(petId) && activeTab === "weight",
  })

  const { data: medicalRecords, isLoading: loadingMedical } = useQuery({
    queryKey: ["pet-medical", petId],
    queryFn: () => getPetMedicalRecordsApi(petId!),
    enabled: Boolean(petId) && activeTab === "medical",
  })

  const { data: photos, isLoading: loadingPhotos } = useQuery({
    queryKey: ["pet-photos", petId],
    queryFn: () => getPetPhotosApi(petId!),
    enabled: Boolean(petId) && activeTab === "photos",
  })

  const { data: accessList, isLoading: loadingAccess } = useQuery({
    queryKey: ["pet-access", petId],
    queryFn: () => getPetAccessApi(petId!),
    enabled: Boolean(petId) && activeTab === "sharing",
  })

  // ==================== MUTATIONS ====================

  const deleteMutation = useMutation({
    mutationFn: () => deletePetApi(petId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      navigate("/dashboard/owner/pets")
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (accessId: string) => revokePetAccessApi(petId!, accessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-access", petId] })
      setRevokingAccess(null)
    },
  })

  const isLoading =
    loadingPet ||
    loadingHealth ||
    loadingWeight ||
    loadingMedical ||
    loadingPhotos ||
    loadingAccess

  const TABS = [
    { value: "overview" as const, label: "Tổng quan" },
    { value: "health" as const, label: "Sức khỏe" },
    { value: "weight" as const, label: "Cân nặng" },
    { value: "medical" as const, label: "Hồ sơ y tế" },
    { value: "photos" as const, label: "Ảnh" },
    { value: "sharing" as const, label: "Chia sẻ" },
  ]

  if (loadingPet) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-po-text-muted">Không tìm thấy thú cưng.</p>
        <button
          onClick={() => navigate("/dashboard/owner/pets")}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Back + Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate("/dashboard/owner/pets")}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:border-po-border-strong hover:text-po-text"
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
          >
            <Activity className="size-4" />
            Chỉnh sửa
          </button>
          <button
            onClick={() => setDeletingPet(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-po-danger/30 bg-white px-4 text-sm font-semibold text-po-danger transition hover:bg-po-danger/10"
          >
            <Trash2 className="size-4" />
            Xóa
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex items-center gap-4 rounded-[24px] border border-po-border bg-white p-5">
        <Avatar src={pet.avatarUrl} alt={pet.name} size="2xl" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-po-text">{pet.name}</h2>
            <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
          </div>
          <p className="mt-0.5 text-sm text-po-text-muted">
            {pet.species}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pet.gender && (
              <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
                {pet.gender === "Male" ? "Đực" : pet.gender === "Female" ? "Cái" : pet.gender}
              </span>
            )}
            {formatAge(pet.dateOfBirth) && (
              <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
                {formatAge(pet.dateOfBirth)}
              </span>
            )}
            {pet.isBirthDateEstimated && (
              <span className="rounded-full bg-po-warning-soft px-2.5 py-0.5 text-xs font-medium text-po-warning">
                Tuổi ước lượng
              </span>
            )}
            {pet.isNeutered && (
              <span className="rounded-full bg-po-success-soft px-2.5 py-0.5 text-xs font-medium text-po-success">
                {pet.isNeutered === "Yes" ? "Đã triệt sản" : pet.isNeutered === "No" ? "Chưa triệt sản" : pet.isNeutered}
              </span>
            )}
            {pet.color && (
              <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
                {pet.color}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabFilter
        tabs={TABS}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as TabValue)}
      />

      {/* Tab Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <OverviewTab pet={pet} healthProfile={healthProfile} />
          )}
          {activeTab === "health" && (
            <HealthTab
              profile={healthProfile}
              onEdit={() => setIsHealthModalOpen(true)}
              onCreate={() => setIsHealthModalOpen(true)}
            />
          )}
          {activeTab === "weight" && (
            <WeightTab
              logs={weightLogs}
              petId={petId!}
              onAdd={() => setIsWeightModalOpen(true)}
            />
          )}
          {activeTab === "medical" && (
            <MedicalTab
              records={medicalRecords}
              petId={petId!}
              onAdd={() => setIsMedicalModalOpen(true)}
              onEdit={(record) => {
                setEditingMedicalRecord(record)
                setIsMedicalModalOpen(true)
              }}
            />
          )}
          {activeTab === "photos" && (
            <PhotosTab
              photos={photos}
              onAdd={() => setIsPhotoModalOpen(true)}
            />
          )}
          {activeTab === "sharing" && (
            <SharingTab
              accessList={accessList}
              petId={petId!}
              petName={pet.name}
            />
          )}
        </>
      )}

      {/* Edit Modal */}
      <PetModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        pet={pet}
      />

      {/* Health Profile Modal */}
      <HealthProfileModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        petId={petId!}
        existingProfile={healthProfile}
      />

      {/* Weight Log Modal */}
      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        petId={petId!}
      />

      {/* Medical Record Modal */}
      <MedicalRecordModal
        isOpen={isMedicalModalOpen}
        onClose={() => {
          setIsMedicalModalOpen(false)
          setEditingMedicalRecord(null)
        }}
        petId={petId!}
        editingRecord={editingMedicalRecord}
      />

      {/* Photo Modal */}
      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        petId={petId!}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingPet}
        onClose={() => setDeletingPet(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Xóa ${pet.name}?`}
        description="Hồ sơ thú cưng sẽ bị xóa mềm và có thể khôi phục sau."
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Revoke Access Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revokingAccess)}
        onClose={() => setRevokingAccess(null)}
        onConfirm={() => {
          if (revokingAccess) revokeMutation.mutate(revokingAccess.petUserAccessId)
        }}
        title="Thu hồi quyền truy cập?"
        description={`Người dùng sẽ không còn có thể truy cập vào hồ sơ của ${pet.name}.`}
        confirmLabel="Thu hồi"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </div>
  )
}

// ==================== OVERVIEW TAB ====================

function OverviewTab({
  pet,
  healthProfile,
}: {
  pet: PetResponse
  healthProfile?: PetHealthProfileResponse | null
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DashboardSection title="Thông tin cơ bản">
        <div className="grid gap-3">
          <InfoRow label="Loài" value={pet.species} />
          <InfoRow label="Giống" value={pet.breed ?? "—"} />
          <InfoRow label="Giới tính" value={pet.gender ?? "—"} />
          <InfoRow label="Ngày sinh" value={formatDate(pet.dateOfBirth)} />
          {pet.isBirthDateEstimated && (
            <InfoRow label="Ghi chú" value="Ngày sinh ước lượng" />
          )}
          <InfoRow label="Màu lông" value={pet.color ?? "—"} />
          <InfoRow label="Triệt sản" value={pet.isNeutered ?? "—"} />
          <InfoRow label="Ngày tạo" value={formatDate(pet.createdAt)} />
        </div>
      </DashboardSection>

      <DashboardSection title="Hồ sơ sức khỏe">
        {healthProfile ? (
          <div className="grid gap-3">
            <InfoRow label="Cân nặng hiện tại" value={healthProfile.currentWeightKg ? `${healthProfile.currentWeightKg} kg` : "—"} />
            <InfoRow label="Dị ứng" value={healthProfile.allergies ?? "—"} />
            <InfoRow label="Bệnh mãn tính" value={healthProfile.chronicConditions ?? "—"} />
            <InfoRow label="Số microchip" value={healthProfile.microchipNumber ?? "—"} />
            <InfoRow label="Cập nhật lần cuối" value={formatDate(healthProfile.updatedAt)} />
          </div>
        ) : (
          <p className="text-sm text-po-text-muted">Chưa có hồ sơ sức khỏe.</p>
        )}
      </DashboardSection>
    </div>
  )
}

// ==================== HEALTH TAB ====================

function HealthTab({
  profile,
  onEdit,
  onCreate,
}: {
  profile?: PetHealthProfileResponse | null
  onEdit: () => void
  onCreate: () => void
}) {
  return (
      <DashboardSection
        title="Hồ sơ sức khỏe"
        action={
          <div className="flex items-center gap-2">
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              profile
                ? "bg-po-success-soft text-po-success"
                : "bg-po-surface-muted text-po-text-muted",
            )}>
              {profile ? "Đã có" : "Chưa có"}
            </span>
            <button
              onClick={profile ? onEdit : onCreate}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-po-primary px-3 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
            >
              <Pencil className="size-3" />
              {profile ? "Sửa" : "Tạo"}
            </button>
          </div>
        }
      >
      {profile ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Cân nặng hiện tại</p>
            <p className="text-lg font-extrabold text-po-text">
              {profile.currentWeightKg ? `${profile.currentWeightKg} kg` : "—"}
            </p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Màu lông</p>
            <p className="text-lg font-extrabold text-po-text">{profile.color ?? "—"}</p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Triệt sản</p>
            <p className="text-lg font-extrabold text-po-text">{profile.isNeutered ?? "—"}</p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Số microchip</p>
            <p className="text-lg font-extrabold text-po-text">{profile.microchipNumber ?? "—"}</p>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <p className="text-xs font-semibold text-po-text-muted">Dị ứng</p>
            <p className="text-sm text-po-text">{profile.allergies ?? "Không có thông tin"}</p>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <p className="text-xs font-semibold text-po-text-muted">Bệnh mãn tính</p>
            <p className="text-sm text-po-text">{profile.chronicConditions ?? "Không có thông tin"}</p>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Chưa có hồ sơ sức khỏe"
          description="Tạo hồ sơ sức khỏe để theo dõi tình trạng của thú cưng."
        />
      )}
    </DashboardSection>
  )
}

// ==================== WEIGHT TAB ====================

function WeightTab({
  logs,
  petId,
  onAdd,
}: {
  logs?: PetWeightLogResponse[] | null
  petId: string
  onAdd: () => void
}) {
  const latestWeight = logs && logs.length > 0 ? logs[0].weightKg : null
  const oldestWeight =
    logs && logs.length > 1 ? logs[logs.length - 1].weightKg : null
  const weightChange =
    latestWeight && oldestWeight
      ? (latestWeight - oldestWeight).toFixed(1)
      : null

  return (
    <div className="grid gap-4">
      {/* Summary */}
      {latestWeight && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-po-border bg-white p-4 text-center">
            <p className="text-xs font-semibold text-po-text-muted">Cân nặng hiện tại</p>
            <p className="mt-1 text-2xl font-extrabold text-po-text">{latestWeight} kg</p>
          </div>
          {weightChange && (
            <div className="rounded-2xl border border-po-border bg-white p-4 text-center">
              <p className="text-xs font-semibold text-po-text-muted">Thay đổi</p>
              <p className={cn(
                "mt-1 text-2xl font-extrabold",
                Number(weightChange) > 0 ? "text-po-warning" : "text-po-success"
              )}>
                {Number(weightChange) > 0 ? "+" : ""}{weightChange} kg
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-po-border bg-white p-4 text-center">
            <p className="text-xs font-semibold text-po-text-muted">Số lần ghi nhận</p>
            <p className="mt-1 text-2xl font-extrabold text-po-text">{logs?.length ?? 0}</p>
          </div>
        </div>
      )}

      {/* Log List */}
      <DashboardSection
        title="Lịch sử cân nặng"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-po-text-muted">
              {logs?.length ?? 0} bản ghi
            </span>
            <button
              onClick={onAdd}
              className="inline-flex h-7 items-center gap-1.5 rounded-full bg-po-primary px-3 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
            >
              <Plus className="size-3" />
              Ghi nhận
            </button>
          </div>
        }
      >
        {!logs || logs.length === 0 ? (
          <EmptyState
            icon={Weight}
            title="Chưa có bản ghi cân nặng"
            description="Ghi nhận cân nặng để theo dõi sự phát triển của thú cưng."
          />
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <div
                key={log.weightLogId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-po-primary-soft">
                    <Scale className="size-4 text-po-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-po-text">{log.weightKg} kg</p>
                    <p className="text-xs text-po-text-muted">
                      {formatDate(log.measuredAt)}
                      {log.source ? ` · ${log.source}` : ""}
                    </p>
                  </div>
                </div>
                {log.note && (
                  <p className="text-xs text-po-text-muted">{log.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

// ==================== MEDICAL RECORDS TAB ====================

function MedicalTab({
  records,
  petId,
  onAdd,
  onEdit,
}: {
  records?: PetMedicalRecordResponse[] | null
  petId: string
  onAdd: () => void
  onEdit: (record: PetMedicalRecordResponse) => void
}) {
  const [filterType, setFilterType] = useState("all")

  const filtered = (records ?? []).filter(
    (r) => filterType === "all" || r.recordType === filterType,
  )

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {MEDICAL_RECORD_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                filterType === t.value
                  ? "border-po-primary bg-po-primary/10 text-po-primary"
                  : "border-po-border bg-white text-po-text-muted hover:text-po-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
        >
          <Plus className="size-3" />
          Thêm hồ sơ
        </button>
      </div>

      <DashboardSection title="Hồ sơ y tế">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Không có hồ sơ y tế"
            description="Ghi nhận lịch sử khám, tiêm phòng và điều trị của thú cưng."
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((record) => (
              <div
                key={record.medicalRecordId}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-po-text">{record.title}</p>
                    <span className="rounded-full bg-po-primary-soft px-2.5 py-0.5 text-xs font-semibold text-po-primary">
                      {record.recordType}
                    </span>
                  </div>
                  {record.description && (
                    <p className="mt-1 text-sm text-po-text-muted">{record.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-po-text-muted">
                    <span>{formatDate(record.recordDate)}</span>
                    {record.clinicName && <span>{record.clinicName}</span>}
                    {record.vetName && <span>BS. {record.vetName}</span>}
                    {record.medicationName && (
                      <span>Thuốc: {record.medicationName}</span>
                    )}
                    {record.dosage && <span>Liều: {record.dosage}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(record)}
                    className="grid size-8 place-items-center rounded-full border border-po-border text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-primary"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

// ==================== PHOTOS TAB ====================

function PhotosTab({
  photos,
  onAdd,
}: {
  photos?: PetPhotoResponse[] | null
  onAdd: () => void
}) {
  return (
    <DashboardSection
      title="Thư viện ảnh"
      action={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-po-text-muted">
            {photos?.length ?? 0} ảnh
          </span>
          <button
            onClick={onAdd}
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-po-primary px-3 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
          >
            <Plus className="size-3" />
            Thêm ảnh
          </button>
        </div>
      }
    >
      {!photos || photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Chưa có ảnh nào"
          description="Thêm ảnh để lưu giữ khoảnh khắc của thú cưng."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.photoId} className="group relative overflow-hidden rounded-2xl border border-po-border">
              <img
                src={photo.imageUrl}
                alt={photo.caption ?? "Ảnh thú cưng"}
                className="h-48 w-full object-cover"
              />
              {photo.isAvatar && (
                <div className="absolute left-2 top-2 rounded-full bg-po-primary px-2 py-0.5 text-xs font-semibold text-white">
                  Avatar
                </div>
              )}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-xs font-medium text-white">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  )
}

// ==================== SHARING TAB ====================

function SharingTab({
  accessList,
  petId,
  petName,
}: {
  accessList?: PetUserAccessResponse[] | null
  petId: string
  petName: string
}) {
  const activeCount = (accessList ?? []).filter((a) => !a.isExpired).length

  return (
    <div className="grid gap-4">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-po-border bg-white p-4">
          <p className="text-sm font-semibold text-po-text-muted">Người được chia sẻ</p>
          <p className="mt-1 text-2xl font-extrabold text-po-text">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-po-border bg-white p-4">
          <p className="text-sm font-semibold text-po-text-muted">Tổng quyền</p>
          <p className="mt-1 text-2xl font-extrabold text-po-text">Viewer · Editor</p>
        </div>
      </div>

      {/* Access List */}
      <DashboardSection title={`Quản lý chia sẻ ${petName}`}>
        {(accessList ?? []).length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Chưa có ai được chia sẻ quyền truy cập"
            description={`Chia sẻ quyền truy cập ${petName} với thành viên gia đình hoặc bác sĩ thú y.`}
          />
        ) : (
          <div className="grid gap-3">
            {accessList.map((access) => (
              <div
                key={access.petUserAccessId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar fallback={access.userId.slice(0, 2).toUpperCase()} size="sm" />
                  <div>
                    <p className="font-bold text-po-text">{access.userId}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        access.accessRole === "Editor"
                          ? "bg-po-warning-soft text-po-warning"
                          : "bg-po-primary-soft text-po-primary",
                      )}>
                        {access.accessRole}
                      </span>
                      {access.isExpired ? (
                        <span className="rounded-full bg-po-danger-soft px-2.5 py-0.5 text-xs font-semibold text-po-danger">
                          Đã hết hạn
                        </span>
                      ) : (
                        <span className="rounded-full bg-po-success-soft px-2.5 py-0.5 text-xs font-semibold text-po-success">
                          Hoạt động
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!access.isExpired && (
                  <button
                    onClick={() => {/* TODO: revoke */}}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-danger/30 px-3 text-xs font-semibold text-po-danger transition hover:bg-po-danger/10"
                  >
                    <Trash2 className="size-3" />
                    Thu hồi
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

// ==================== HELPERS ====================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-po-border/60 pb-2 last:border-0 last:pb-0">
      <p className="text-sm text-po-text-muted">{label}</p>
      <p className="text-sm font-semibold text-po-text">{value}</p>
    </div>
  )
}
