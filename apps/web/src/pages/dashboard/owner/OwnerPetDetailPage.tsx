import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Activity,
  ArrowLeft,
  Bell,
  Camera,
  Cat,
  Dog,
  Heart,
  Link2,
  PawPrint,
  Pencil,
  Plus,
  Scale,
  Share2,
  ShieldCheck,
  Syringe,
  Trash2,
  Weight,
  X,
  type LucideIcon,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import Avatar from "@/components/ui/Avatar"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import DashboardSection from "@/components/dashboard/DashboardSection"
import CreateReminderModal from "@/components/dashboard/owner/CreateReminderModal"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import PetModal from "@/components/dashboard/owner/PetModal"
import HealthProfileModal from "@/components/dashboard/owner/HealthProfileModal"
import WeightLogModal from "@/components/dashboard/owner/WeightLogModal"
import MedicalRecordModal from "@/components/dashboard/owner/MedicalRecordModal"
import PhotoModal from "@/components/dashboard/owner/PhotoModal"
import PetHealthShareList from "@/components/dashboard/owner/PetHealthShareList"
import SharePetHealthProfileDialog from "@/components/dashboard/owner/SharePetHealthProfileDialog"
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
  setPetAvatarApi,
} from "@/services/pets.service"
import {
  getRemindersApi,
  toggleReminderApi,
  dismissReminderApi,
} from "@/services/reminders.service"
import type {
  PetHealthProfileResponse,
  PetMedicalRecordResponse,
  PetPhotoResponse,
  PetResponse,
  PetUserAccessResponse,
  PetWeightLogResponse,
  ReminderResponse,
} from "@/types"
import { cn } from "@/lib/utils"

// ==================== HELPERS ====================

const speciesIcon: Record<string, LucideIcon> = {
  Dog,
  Cat,
  default: PawPrint,
}

const getSpeciesIcon = (species: string): LucideIcon =>
  speciesIcon[species] ?? speciesIcon.default

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

const formatGender = (v: string | null) => {
  if (!v) return "—"
  return v === "Male" ? "Đực" : v === "Female" ? "Cái" : v === "Other" ? "Khác" : v
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

const formatIsNeutered = (v: string | null | undefined) => {
  if (!v) return "—"
  return v === "Yes" ? "Đã triệt sản" : v === "No" ? "Chưa triệt sản" : v === "Unknown" ? "Không rõ" : v
}

const MEDICAL_RECORD_TYPES = [
  { value: "all", label: "Tất cả" },
  { value: "Vaccine", label: "Tiêm phòng" },
  { value: "Visit", label: "Khám bệnh" },
  { value: "Medication", label: "Dùng thuốc" },
  { value: "Surgery", label: "Phẫu thuật" },
  { value: "Allergy", label: "Dị ứng" },
  { value: "Illness", label: "Bệnh lý" },
]

const MEDICAL_RECORD_TYPE_LABELS: Record<string, string> = {
  Vaccine: "Tiêm phòng",
  Visit: "Khám bệnh",
  Medication: "Dùng thuốc",
  Surgery: "Phẫu thuật",
  Allergy: "Dị ứng",
  Illness: "Bệnh lý",
}

type TabValue = "overview" | "health" | "weight" | "vaccine" | "medical" | "photos" | "sharing" | "reminders"

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
  const [isHealthShareDialogOpen, setIsHealthShareDialogOpen] = useState(false)
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<PetMedicalRecordResponse | null>(null)
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false)
  const [dismissingReminder, setDismissingReminder] = useState<ReminderResponse | null>(null)

  // ==================== QUERIES ====================

  const { data: pet, isLoading: loadingPet } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => getPetByIdApi(petId!),
    enabled: Boolean(petId),
  })

  const { data: healthProfile, isLoading: loadingHealth } = useQuery({
    queryKey: ["pet-health", petId],
    queryFn: () => getPetHealthProfileApi(petId!),
    enabled: Boolean(petId),
  })

  const { data: weightLogs, isLoading: loadingWeight } = useQuery({
    queryKey: ["pet-weight", petId],
    queryFn: () => getPetWeightLogsApi(petId!),
    enabled: Boolean(petId),
  })

  const { data: medicalRecords, isLoading: loadingMedical } = useQuery({
    queryKey: ["pet-medical", petId],
    queryFn: () => getPetMedicalRecordsApi(petId!),
    enabled: Boolean(petId) && (activeTab === "medical" || activeTab === "vaccine"),
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

  const { data: petReminders, isLoading: loadingReminders } = useQuery({
    queryKey: ["pet-reminders", petId],
    queryFn: async () => {
      const all = await getRemindersApi()
      return all.filter((r) => r.petId === petId)
    },
    enabled: Boolean(petId) && activeTab === "reminders",
  })

  const toggleReminderMutation = useMutation({
    mutationFn: (id: string) => toggleReminderApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-reminders", petId] })
      queryClient.invalidateQueries({ queryKey: ["owner-reminders"] })
    },
  })

  const dismissReminderMutation = useMutation({
    mutationFn: (id: string) => dismissReminderApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-reminders", petId] })
      queryClient.invalidateQueries({ queryKey: ["owner-reminders"] })
      setDismissingReminder(null)
    },
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

  const setAvatarMutation = useMutation({
    mutationFn: (photoId: string) => setPetAvatarApi(petId!, { photoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] })
      queryClient.invalidateQueries({ queryKey: ["pet", petId] })
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      toast.success("Đặt ảnh đại diện thành công!")
    },
    onError: () => {
      toast.error("Đặt ảnh đại diện thất bại. Vui lòng thử lại.")
    },
  })

  const isLoading =
    loadingPet ||
    loadingHealth ||
    loadingWeight ||
    loadingMedical ||
    loadingPhotos ||
    loadingAccess ||
    loadingReminders

  const TABS = [
    { value: "overview" as const, label: "Tổng quan" },
    { value: "health" as const, label: "Sức khỏe" },
    { value: "weight" as const, label: "Cân nặng" },
    { value: "vaccine" as const, label: "Tiêm phòng" },
    { value: "medical" as const, label: "Hồ sơ y tế" },
    { value: "photos" as const, label: "Ảnh" },
    { value: "sharing" as const, label: "Chia sẻ" },
    { value: "reminders" as const, label: "Nhắc nhở" },
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
            onClick={() => setIsHealthShareDialogOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-po-primary/30 bg-white px-4 text-sm font-semibold text-po-primary transition hover:bg-po-primary/10"
          >
            <Share2 className="size-4" />
            Share health
          </button>
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
        <Avatar src={pet.avatarUrl} alt={pet.name} size="xl" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-po-text">{pet.name}</h2>
            {(() => {
              const SpeciesIcon = getSpeciesIcon(pet.species)
              return <SpeciesIcon className="size-6 text-po-primary" aria-hidden="true" />
            })()}
          </div>
          <p className="mt-0.5 text-sm text-po-text-muted">
            {pet.species}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pet.gender && (
              <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
                {formatGender(pet.gender)}
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
            <OverviewTab pet={pet} healthProfile={healthProfile} weightLogs={weightLogs} />
          )}
          {activeTab === "health" && (
            <HealthTab
              profile={healthProfile}
              weightLogs={weightLogs}
              onEdit={() => setIsHealthModalOpen(true)}
              onCreate={() => setIsHealthModalOpen(true)}
            />
          )}
          {activeTab === "weight" && (
            <WeightTab
              logs={weightLogs}
              onAdd={() => setIsWeightModalOpen(true)}
            />
          )}
          {activeTab === "vaccine" && (
            <VaccineTab
              records={medicalRecords}
              loading={loadingMedical}
              onAdd={() => {
                setEditingMedicalRecord(null)
                setIsMedicalModalOpen(true)
              }}
              onEdit={(record) => {
                setEditingMedicalRecord(record)
                setIsMedicalModalOpen(true)
              }}
            />
          )}
          {activeTab === "medical" && (
            <MedicalTab
              records={medicalRecords}
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
              onSetAvatar={(photoId) => setAvatarMutation.mutate(photoId)}
              isSettingAvatar={setAvatarMutation.isPending}
            />
          )}
          {activeTab === "sharing" && (
            <SharingTab
              petId={pet.petId}
              accessList={accessList}
              petName={pet.name}
              onCreateHealthShare={() => setIsHealthShareDialogOpen(true)}
              onRevoke={(access) => setRevokingAccess(access)}
            />
          )}
          {activeTab === "reminders" && (
            <RemindersTab
              reminders={petReminders}
              onAdd={() => setIsReminderModalOpen(true)}
              onToggle={(id) => toggleReminderMutation.mutate(id)}
              onDismiss={(r) => setDismissingReminder(r)}
              isToggling={toggleReminderMutation.isPending}
              isDismissing={dismissReminderMutation.isPending}
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
        initialWeightKg={weightLogs?.[0]?.weightKg}
        initialColor={healthProfile?.color ?? undefined}
        initialIsNeutered={healthProfile?.isNeutered ?? undefined}
      />

      {/* Weight Log Modal */}
      <WeightLogModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        petId={petId!}
        initialWeightKg={weightLogs?.[0]?.weightKg}
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

      {/* Create Reminder Modal */}
      <CreateReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        defaultPetId={petId}
      />

      {/* Health Share Dialog */}
      <SharePetHealthProfileDialog
        isOpen={isHealthShareDialogOpen}
        onClose={() => setIsHealthShareDialogOpen(false)}
        petId={petId!}
        petName={pet.name}
      />

      {/* Dismiss Reminder Dialog */}
      <ConfirmDialog
        isOpen={Boolean(dismissingReminder)}
        onClose={() => setDismissingReminder(null)}
        onConfirm={() => {
          if (dismissingReminder) dismissReminderMutation.mutate(dismissingReminder.reminderId)
        }}
        title="Bỏ qua nhắc nhở"
        description={`Bạn có chắc muốn bỏ qua nhắc nhở "${dismissingReminder?.title}"?`}
        confirmLabel="Bỏ qua"
        variant="warning"
        isLoading={dismissReminderMutation.isPending}
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
  weightLogs,
}: {
  pet: PetResponse
  healthProfile?: PetHealthProfileResponse | null
  weightLogs?: PetWeightLogResponse[] | null
}) {
  const latestWeight = weightLogs?.[0]?.weightKg
  const healthUpdatedAt = healthProfile?.updatedAt
    ? formatDate(healthProfile.updatedAt)
    : "Chưa cập nhật"
  const healthStatus = healthProfile ? "Đã có hồ sơ" : "Chưa có hồ sơ"

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <OverviewMetric
          icon={Activity}
          label="Tuổi"
          value={formatAge(pet.dateOfBirth) ?? "Chưa có ngày sinh"}
          note={pet.isBirthDateEstimated ? "Ngày sinh ước lượng" : formatDate(pet.dateOfBirth)}
        />
        <OverviewMetric
          icon={Weight}
          label="Cân nặng"
          value={latestWeight ? `${latestWeight} kg` : "Chưa ghi nhận"}
          note={`${weightLogs?.length ?? 0} lần theo dõi`}
        />
        <OverviewMetric
          icon={Heart}
          label="Sức khỏe"
          value={healthStatus}
          note={healthUpdatedAt}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection
          title="Hồ sơ thú cưng"
          subtitle="Các thông tin nhận diện và chăm sóc thường dùng."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewField label="Loài" value={pet.species} />
            <OverviewField label="Giống" value={pet.breed ?? "—"} />
            <OverviewField label="Giới tính" value={formatGender(pet.gender)} />
            <OverviewField label="Ngày sinh" value={formatDate(pet.dateOfBirth)} />
            <OverviewField label="Màu lông" value={healthProfile?.color ?? "—"} />
            <OverviewField label="Triệt sản" value={formatIsNeutered(healthProfile?.isNeutered)} />
            <OverviewField label="Ngày tạo hồ sơ" value={formatDate(pet.createdAt)} />
            {pet.isBirthDateEstimated && (
              <OverviewField label="Ghi chú" value="Ngày sinh ước lượng" tone="warning" />
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Theo dõi sức khỏe"
          subtitle="Những dữ liệu cần nhìn nhanh trước khi chăm sóc."
        >
          {healthProfile ? (
            <div className="grid gap-3">
              <OverviewField label="Dị ứng" value={healthProfile.allergies ?? "Chưa có thông tin"} />
              <OverviewField label="Bệnh mãn tính" value={healthProfile.chronicConditions ?? "Chưa có thông tin"} />
              <OverviewField label="Số microchip" value={healthProfile.microchipNumber ?? "Chưa gắn"} />
              <OverviewField label="Cập nhật lần cuối" value={healthUpdatedAt} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-po-border bg-po-surface-muted p-4">
              <p className="text-sm font-semibold text-po-text">Chưa có hồ sơ sức khỏe</p>
              <p className="mt-1 text-sm text-po-text-muted">
                Tạo hồ sơ sức khỏe để lưu cân nặng, dị ứng, bệnh mãn tính và microchip.
              </p>
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  )
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Activity
  label: string
  value: string
  note: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-po-border bg-white p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-po-text-subtle">{label}</p>
        <p className="mt-1 text-lg font-extrabold text-po-text">{value}</p>
        <p className="mt-0.5 text-xs text-po-text-muted">{note}</p>
      </div>
    </div>
  )
}

function OverviewField({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "warning"
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        tone === "warning"
          ? "border-po-warning/30 bg-po-warning-soft"
          : "border-po-border bg-po-surface-muted/60",
      )}
    >
      <p className="text-xs font-semibold text-po-text-subtle">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-po-text">{value}</p>
    </div>
  )
}

// ==================== HEALTH TAB ====================

function HealthTab({
  profile,
  weightLogs,
  onEdit,
  onCreate,
}: {
  profile?: PetHealthProfileResponse | null
  weightLogs?: PetWeightLogResponse[] | null
  onEdit: () => void
  onCreate: () => void
}) {
  const latestWeight = weightLogs?.[0]?.weightKg

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
              {latestWeight ? `${latestWeight} kg` : "—"}
            </p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Màu lông</p>
            <p className="text-lg font-extrabold text-po-text">{profile.color ?? "—"}</p>
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs font-semibold text-po-text-muted">Triệt sản</p>
            <p className="text-lg font-extrabold text-po-text">{formatIsNeutered(profile.isNeutered)}</p>
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
  onAdd,
}: {
  logs?: PetWeightLogResponse[] | null
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

// ==================== VACCINE TAB ====================

function VaccineTab({
  records,
  loading,
  onAdd,
  onEdit,
}: {
  records?: PetMedicalRecordResponse[] | null
  loading: boolean
  onAdd: () => void
  onEdit: (record: PetMedicalRecordResponse) => void
}) {
  // Chỉ lấy các mũi tiêm phòng, sắp xếp mới nhất lên đầu
  const vaccines = (records ?? [])
    .filter((r) => r.recordType === "Vaccine")
    .sort(
      (a, b) =>
        new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime(),
    )

  const lastVaccineDate = vaccines[0]?.recordDate

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-po-primary-soft/60 px-4 py-3 ring-1 ring-po-border/60">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-po-primary ring-1 ring-po-border/70">
            <ShieldCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-po-text">
              {vaccines.length > 0
                ? `Đã tiêm ${vaccines.length} mũi`
                : "Chưa có mũi tiêm nào"}
            </p>
            <p className="text-xs text-po-text-muted">
              {lastVaccineDate
                ? `Mũi gần nhất: ${formatDate(lastVaccineDate)}`
                : "Ghi lại các mũi tiêm để theo dõi lịch tiêm phòng."}
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
        >
          <Plus className="size-3.5" />
          Thêm mũi tiêm
        </button>
      </div>

      <DashboardSection title="Lịch sử tiêm phòng">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : vaccines.length === 0 ? (
          <EmptyState
            icon={Syringe}
            title="Chưa có lịch sử tiêm phòng"
            description="Thêm mũi tiêm đầu tiên để theo dõi lịch tiêm phòng cho bé."
          />
        ) : (
          <div className="relative grid gap-0 pl-2">
            {vaccines.map((record, idx) => (
              <div key={record.medicalRecordId} className="relative flex gap-4 pb-5 last:pb-0">
                {/* Đường nối timeline */}
                {idx < vaccines.length - 1 && (
                  <span className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px bg-po-border" />
                )}
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full bg-po-primary-soft text-po-primary ring-4 ring-white">
                  <Syringe className="size-4" />
                </span>

                <div className="min-w-0 flex-1 rounded-2xl border border-po-border bg-white px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-po-text">{record.title}</p>
                        {idx === 0 && (
                          <span className="rounded-full bg-po-success-soft px-2 py-0.5 text-[11px] font-semibold text-po-success">
                            Mới nhất
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-po-primary">
                        {formatDate(record.recordDate)}
                      </p>
                    </div>
                    <button
                      onClick={() => onEdit(record)}
                      className="grid size-8 shrink-0 place-items-center rounded-full border border-po-border text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-primary"
                      aria-label="Sửa mũi tiêm"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>

                  {record.description && (
                    <p className="mt-2 text-sm text-po-text-muted">{record.description}</p>
                  )}

                  {(record.clinicName || record.vetName) && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-po-text-muted">
                      {record.clinicName && <span>{record.clinicName}</span>}
                      {record.vetName && <span>BS. {record.vetName}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

// ==================== MEDICAL TAB ====================

function MedicalTab({
  records,
  onAdd,
  onEdit,
}: {
  records?: PetMedicalRecordResponse[] | null
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
                      {MEDICAL_RECORD_TYPE_LABELS[record.recordType] ?? record.recordType}
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
  onSetAvatar,
  isSettingAvatar,
}: {
  photos?: PetPhotoResponse[] | null
  onAdd: () => void
  onSetAvatar: (photoId: string) => void
  isSettingAvatar: boolean
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
              {!photo.isAvatar && (
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => onSetAvatar(photo.photoId)}
                    disabled={isSettingAvatar}
                    className="rounded-full bg-white/90 p-1.5 text-po-primary shadow transition hover:bg-white hover:text-po-primary-hover disabled:opacity-50"
                    title="Đặt làm ảnh đại diện"
                  >
                    <Camera className="size-4" />
                  </button>
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
  petId,
  accessList,
  petName,
  onCreateHealthShare,
  onRevoke,
}: {
  petId: string
  accessList?: PetUserAccessResponse[] | null
  petName: string
  onCreateHealthShare: () => void
  onRevoke: (access: PetUserAccessResponse) => void
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

      <PetHealthShareList
        petId={petId}
        petName={petName}
        onCreateShare={onCreateHealthShare}
      />

      {/* Access List */}
      <DashboardSection title={`Quản lý chia sẻ ${petName}`}>
        {!accessList || accessList.length === 0 ? (
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
                  <Avatar fallback={access.userId.slice(0, 2).toUpperCase()} size="sm" alt={access.userId} />
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
                    onClick={() => onRevoke(access)}
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

// ==================== REMINDERS TAB ====================

function RemindersTab({
  reminders,
  onAdd,
  onToggle,
  onDismiss,
  isToggling,
  isDismissing,
}: {
  reminders?: ReminderResponse[] | null
  onAdd: () => void
  onToggle: (id: string) => void
  onDismiss: (r: ReminderResponse) => void
  isToggling: boolean
  isDismissing: boolean
}) {
  const activeReminders = (reminders ?? []).filter(
    (r) => r.status.toLowerCase() === "pending",
  )
  const dismissedReminders = (reminders ?? []).filter(
    (r) => r.status.toLowerCase() === "dismissed",
  )

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  const getReminderTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      Vaccine: "Tiêm phòng",
      Medication: "Thuốc",
      FollowUp: "Tái khám",
      Deworming: "Tẩy giun",
      Grooming: "Vệ sinh",
      WeightTracking: "Cân nặng",
      Custom: "Tùy chỉnh",
    }
    return map[type] ?? type
  }

  const renderReminderCard = (r: ReminderResponse) => {
    const isDismissed = r.status.toLowerCase() === "dismissed"
    return (
      <div
        key={r.reminderId}
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition",
          isDismissed
            ? "border-po-border bg-po-surface-muted opacity-60"
            : "border-po-border bg-white",
        )}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-xs",
            isDismissed
              ? "bg-po-border text-po-text-subtle"
              : "bg-po-primary-soft text-po-primary",
          )}>
            <Bell className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-po-text">{r.title}</p>
            <p className="mt-0.5 text-xs text-po-text-muted">
              {getReminderTypeLabel(r.reminderType)}
            </p>
            <p className="mt-1 text-xs text-po-text-subtle">
              {formatDateTime(r.remindAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {!isDismissed && (
            <>
              <button
                type="button"
                role="switch"
                aria-checked={r.isEnabled}
                aria-label={r.isEnabled ? "Tắt nhắc nhở" : "Bật nhắc nhở"}
                title={r.isEnabled ? "Tắt nhắc nhở" : "Bật nhắc nhở"}
                onClick={() => onToggle(r.reminderId)}
                disabled={isToggling}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-po-primary/40",
                  r.isEnabled ? "bg-po-success" : "bg-po-border",
                  isToggling && "cursor-not-allowed opacity-50",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                    r.isEnabled ? "translate-x-[22px]" : "translate-x-[2px]",
                  )}
                />
              </button>
              <button
                onClick={() => onDismiss(r)}
                disabled={isDismissing}
                title="Bỏ qua nhắc nhở"
                className="grid size-8 place-items-center rounded-full border border-po-border text-po-text-subtle transition hover:border-po-danger hover:bg-po-danger-soft hover:text-po-danger"
              >
                <X className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-sm text-po-text-muted">
          <span className="rounded-full bg-po-success-soft px-3 py-1 text-xs font-semibold text-po-success">
            {activeReminders.length} đang hoạt động
          </span>
          {dismissedReminders.length > 0 && (
            <span className="rounded-full bg-po-surface-muted px-3 py-1 text-xs font-semibold text-po-text-muted">
              {dismissedReminders.length} đã bỏ qua
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
        >
          <Plus className="size-3" />
          Tạo nhắc nhở
        </button>
      </div>

      <DashboardSection title="Nhắc nhở của thú cưng">
        {!reminders || reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Chưa có nhắc nhở nào"
            description="Tạo nhắc nhở để không bỏ lỡ lịch tiêm phòng, uống thuốc hay tái khám."
          />
        ) : (
          <div className="grid gap-2">
            {reminders.map(renderReminderCard)}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
