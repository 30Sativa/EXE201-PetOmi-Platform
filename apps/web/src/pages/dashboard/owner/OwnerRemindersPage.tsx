import { Bell, BellOff, Plus, Settings, X } from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import CreateReminderModal from "@/components/dashboard/owner/CreateReminderModal"
import OwnerReminderPreferencesPage from "@/pages/dashboard/owner/OwnerReminderPreferencesPage"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge, { reminderStatusVariant } from "@/components/ui/StatusBadge"
import TabFilter from "@/components/ui/TabFilter"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import { getPetsApi } from "@/services/pets.service"
import { getRemindersApi, toggleReminderApi, dismissReminderApi } from "@/services/reminders.service"
import { cn } from "@/lib/utils"
import type { ReminderResponse } from "@/types"

type FilterTab = "all" | "active" | "dismissed"

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hoạt động" },
  { value: "dismissed", label: "Đã bỏ qua" },
]

const formatDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

const getReminderTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    Appointment: "Nhắc lịch hẹn",
    Vaccination: "Nhắc tiêm phòng",
    Medication: "Nhắc uống thuốc",
    Checkup: "Nhắc tái khám",
    Custom: "Nhắc nhở tùy chỉnh",
  }
  return map[type] ?? type
}

export default function OwnerRemindersPage() {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [dismissTarget, setDismissTarget] = useState<ReminderResponse | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const queryClient = useQueryClient()

  const { data: reminders, isLoading, error } = useQuery({
    queryKey: ["owner-reminders"],
    queryFn: getRemindersApi,
  })

  const { data: pets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleReminderApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-reminders"] })
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissReminderApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-reminders"] })
      setDismissTarget(null)
    },
  })

  const filtered = (reminders ?? []).filter((r) => {
    if (filter === "all") return true
    if (filter === "active") return r.status.toLowerCase() === "pending"
    if (filter === "dismissed") return r.status.toLowerCase() === "dismissed"
    return true
  })

  const getPetName = (petId: string | null) => {
    if (!petId) return null
    return pets?.find((p) => p.petId === petId)?.name ?? null
  }

  const activeCount = (reminders ?? []).filter(
    (r) => r.status.toLowerCase() === "pending",
  ).length

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Nhắc nhở</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Quản lý các nhắc nhở về lịch hẹn, tiêm phòng và tái khám.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="inline-flex size-11 items-center justify-center rounded-full border border-po-border bg-white text-po-text-muted transition hover:border-po-primary hover:text-po-primary"
            title="Cài đặt nhắc nhở"
            aria-label="Cài đặt nhắc nhở"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
            <Plus className="size-4" />
            Tạo nhắc nhở
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Tổng nhắc nhở</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {(reminders ?? []).length}
          </p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-success-soft p-4">
          <p className="text-sm font-semibold text-po-success">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-extrabold text-po-success">{activeCount}</p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Đã bỏ qua</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {(reminders ?? []).filter((r) => r.status.toLowerCase() === "dismissed").length}
          </p>
        </div>
      </div>

      {/* Filter */}
      <TabFilter
        tabs={filterTabs}
        activeTab={filter}
        onChange={setFilter}
      />

      {/* Reminder List */}
      <DashboardSection title={`${filtered.length} nhắc nhở`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={Bell}
            title="Không thể tải nhắc nhở"
            description="Đã xảy ra lỗi. Vui lòng thử lại."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={
              filter === "all"
                ? "Chưa có nhắc nhở nào"
                : filter === "active"
                  ? "Không có nhắc nhở đang hoạt động"
                  : "Không có nhắc nhở đã bỏ qua"
            }
            description="Nhắc nhở sẽ được tạo tự động khi bạn đặt lịch hẹn hoặc tiêm phòng."
            action={
              filter === "all" ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
                  <Plus className="size-4" />
                  Tạo nhắc nhở
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map((reminder) => (
              <ReminderCard
                key={reminder.reminderId}
                reminder={reminder}
                petName={getPetName(reminder.petId)}
                onToggle={() => toggleMutation.mutate(reminder.reminderId)}
                onDismiss={() => setDismissTarget(reminder)}
                isToggling={toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Dismiss Dialog */}
      <ConfirmDialog
        isOpen={dismissTarget !== null}
        onClose={() => setDismissTarget(null)}
        onConfirm={() => {
          if (dismissTarget) dismissMutation.mutate(dismissTarget.reminderId)
        }}
        title="Bỏ qua nhắc nhở"
        description={`Bạn có chắc muốn bỏ qua nhắc nhở "${dismissTarget?.title}"?`}
        confirmLabel="Bỏ qua"
        variant="warning"
        isLoading={dismissMutation.isPending}
      />

      {/* Create Reminder Modal */}
      <CreateReminderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ReminderPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  )
}

function ReminderPreferencesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-3 animate-dialog-in sm:p-4"
      onClick={onClose}
    >
      <aside
        className="flex max-h-[min(760px,calc(100dvh-32px))] w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in"
        onClick={(e) => e.stopPropagation()}
        aria-label="Cài đặt nhắc nhở"
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-po-border px-5 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Cài đặt nhắc nhở</h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Cấu hình thời điểm nhận thông báo cho từng loại nhắc nhở.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
            aria-label="Đóng cài đặt nhắc nhở"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <OwnerReminderPreferencesPage embedded />
        </div>
      </aside>
    </div>
  )
}

function ReminderCard({
  reminder,
  petName,
  onToggle,
  onDismiss,
  isToggling,
}: {
  reminder: ReminderResponse
  petName: string | null
  onToggle: () => void
  onDismiss: () => void
  isToggling: boolean
}) {
  const isDismissed = reminder.status.toLowerCase() === "dismissed"

  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 rounded-2xl border px-4 py-4 transition",
        isDismissed
          ? "border-po-border bg-po-surface-muted opacity-70"
          : "border-po-border bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            isDismissed
              ? "bg-po-border text-po-text-subtle"
              : "bg-po-primary-soft text-po-primary",
          )}
        >
          {isDismissed ? <BellOff className="size-5" /> : <Bell className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-po-text">{reminder.title}</p>
            <StatusBadge
              variant={reminderStatusVariant(reminder.status)}
              label={reminder.status}
            />
          </div>
          {reminder.message && (
            <p className="mt-0.5 text-xs text-po-text-muted">{reminder.message}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-po-text-subtle">
            <span>{getReminderTypeLabel(reminder.reminderType)}</span>
            {petName && (
              <>
                <span>·</span>
                <span>Thú cưng: {petName}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-po-text-subtle">
            ⏰ {formatDateTime(reminder.remindAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onToggle}
          disabled={isToggling || isDismissed}
          title={reminder.isEnabled ? "Tắt nhắc nhở" : "Bật nhắc nhở"}
          className={cn(
            "grid size-8 place-items-center rounded-full border text-xs transition",
            reminder.isEnabled
              ? "border-po-success text-po-success hover:bg-po-success-soft"
              : "border-po-border text-po-text-subtle hover:bg-po-surface-muted",
            (isToggling || isDismissed) && "opacity-50",
          )}
        >
          {reminder.isEnabled ? "🔔" : "🔕"}
        </button>
        {!isDismissed && (
          <button
            onClick={onDismiss}
            className="grid size-8 place-items-center rounded-full border border-po-border text-po-text-subtle transition hover:border-po-danger hover:bg-po-danger-soft hover:text-po-danger"
            title="Bỏ qua nhắc nhở"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
