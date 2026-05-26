import { Bell, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import {
  getReminderPreferencesApi,
  updateReminderPreferencesApi,
} from "@/services/reminder-preferences.service"
import type { UpdateReminderPreferenceRequest } from "@/types"

const REMINDER_TYPE_DEFS = [
  {
    type: "Vaccine",
    label: "Tiêm phòng",
    description: "Nhắc lịch tiêm phòng vaccine cho thú cưng.",
  },
  {
    type: "Medication",
    label: "Thuốc",
    description: "Nhắc uống thuốc đúng giờ theo toa.",
  },
  {
    type: "FollowUp",
    label: "Tái khám",
    description: "Nhắc lịch tái khám định kỳ.",
  },
  {
    type: "Deworming",
    label: "Tẩy giun",
    description: "Nhắc lịch tẩy giun định kỳ.",
  },
  {
    type: "Grooming",
    label: "Vệ sinh",
    description: "Nhắc lịch cắt tỉa, tắm rửa.",
  },
  {
    type: "WeightTracking",
    label: "Cân nặng",
    description: "Nhắc theo dõi cân nặng thú cưng.",
  },
  {
    type: "Custom",
    label: "Tùy chỉnh",
    description: "Các nhắc nhở do bạn tự tạo.",
  },
]

const REMIND_BEFORE_OPTIONS = [
  { value: 15, label: "15 phút trước" },
  { value: 30, label: "30 phút trước" },
  { value: 60, label: "1 giờ trước" },
  { value: 120, label: "2 giờ trước" },
  { value: 1440, label: "1 ngày trước" },
]

interface PrefState {
  reminderType: string
  isEnabled: boolean
  remindBeforeMinutes: number | null
  channel: string
}

interface OwnerReminderPreferencesPageProps {
  embedded?: boolean
}

export default function OwnerReminderPreferencesPage({
  embedded = false,
}: OwnerReminderPreferencesPageProps) {
  const queryClient = useQueryClient()

  const { data: existingPrefs, isLoading, error } = useQuery({
    queryKey: ["owner-reminder-preferences"],
    queryFn: getReminderPreferencesApi,
  })

  const [prefs, setPrefs] = useState<PrefState[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [dirtyTypes, setDirtyTypes] = useState<Set<string>>(() => new Set())
  const hasChanges = dirtyTypes.size > 0

  useEffect(() => {
    if (existingPrefs) {
      const mapped = REMINDER_TYPE_DEFS.map((def) => {
        const found = existingPrefs.find(
          (p) => p.reminderType.toLowerCase() === def.type.toLowerCase(),
        )
        return {
          reminderType: def.type,
          isEnabled: found?.isEnabled ?? true,
          remindBeforeMinutes: found?.remindBeforeMinutes ?? 60,
          channel: found?.channel ?? "PushEmail",
        } satisfies PrefState
      })
      setPrefs(mapped)
      setDirtyTypes(new Set())
    }
  }, [existingPrefs])

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateReminderPreferenceRequest) => {
      return updateReminderPreferencesApi(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-reminder-preferences"] })
    },
  })

  const markDirty = (reminderType: string) => {
    setDirtyTypes((prev) => {
      const next = new Set(prev)
      next.add(reminderType)
      return next
    })
  }

  const clearDirtyType = (reminderType: string) => {
    setDirtyTypes((prev) => {
      const next = new Set(prev)
      next.delete(reminderType)
      return next
    })
  }

  const handleToggle = (reminderType: string) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.reminderType === reminderType
          ? { ...p, isEnabled: !p.isEnabled }
          : p,
      ),
    )
    markDirty(reminderType)
  }

  const handleRemindBeforeChange = (reminderType: string, minutes: number) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.reminderType === reminderType
          ? { ...p, remindBeforeMinutes: minutes }
          : p,
      ),
    )
    markDirty(reminderType)
  }

  const handleSave = async (reminderType: string) => {
    if (!dirtyTypes.has(reminderType)) return

    const pref = prefs.find((p) => p.reminderType === reminderType)
    if (!pref) return

    setSaving(reminderType)
    try {
      await updateMutation.mutateAsync({
        reminderType: pref.reminderType,
        isEnabled: pref.isEnabled,
        remindBeforeMinutes: pref.remindBeforeMinutes ?? undefined,
        channel: pref.channel,
      })
      clearDirtyType(reminderType)
      toast.success("Lưu cài đặt thành công!")
    } catch {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
    } finally {
      setSaving(null)
    }
  }

  const handleSaveAll = async () => {
    const changedPrefs = prefs.filter((pref) => dirtyTypes.has(pref.reminderType))
    if (changedPrefs.length === 0) return

    setSaving("all")
    let success = 0
    let failed = 0
    const savedTypes: string[] = []

    for (const pref of changedPrefs) {
      try {
        await updateMutation.mutateAsync({
          reminderType: pref.reminderType,
          isEnabled: pref.isEnabled,
          remindBeforeMinutes: pref.remindBeforeMinutes ?? undefined,
          channel: pref.channel,
        })
        success++
        savedTypes.push(pref.reminderType)
      } catch {
        failed++
      }
    }

    setSaving(null)

    if (failed === 0) {
      toast.success(`Đã lưu ${success} cài đặt thành công!`)
      setDirtyTypes(new Set())
    } else {
      setDirtyTypes((prev) => {
        const next = new Set(prev)
        savedTypes.forEach((type) => next.delete(type))
        return next
      })
      toast.error(`${failed} cài đặt thất bại. Vui lòng thử lại.`)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">
            Cài đặt nhắc nhở
          </h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Cấu hình cách thức và thời điểm nhận thông báo cho từng loại nhắc nhở.
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSaveAll}
            disabled={updateMutation.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <Check className="size-4" />
            Lưu tất cả thay đổi
          </button>
        )}
        </div>
      )}

      {embedded && hasChanges && (
        <button
          onClick={handleSaveAll}
          disabled={updateMutation.isPending}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          <Check className="size-4" />
          Lưu tất cả thay đổi
        </button>
      )}

      {/* Preference Cards */}
      <DashboardSection
        title={embedded ? "Theo loại nhắc nhở" : "Cấu hình theo loại"}
        className={embedded ? "border-0 bg-transparent p-0 shadow-none" : undefined}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={Bell}
            title="Không thể tải cài đặt"
            description="Đã xảy ra lỗi. Vui lòng thử lại."
          />
        ) : (
          <div className="grid gap-4">
            {REMINDER_TYPE_DEFS.map((def) => {
              const pref = prefs.find(
                (p) => p.reminderType === def.type,
              )
              const isSavingThis = saving === def.type
              const hasChanged = dirtyTypes.has(def.type)

              return (
                <div
                  key={def.type}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-po-border bg-white p-4"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggle(def.type)}
                      className="mt-0.5 shrink-0"
                      title={pref?.isEnabled ? "Tắt nhắc nhở" : "Bật nhắc nhở"}
                    >
                      <div
                        className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs transition ${
                          pref?.isEnabled
                            ? "border-po-success bg-po-success-soft text-po-success"
                            : "border-po-border bg-po-surface-muted text-po-text-subtle"
                        }`}
                      >
                        <Bell className="size-3.5" />
                      </div>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-po-text">{def.label}</p>
                      <p className="mt-0.5 text-xs text-po-text-muted">
                        {def.description}
                      </p>
                      {pref?.isEnabled && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-po-text-subtle">
                            Nhắc trước:
                          </span>
                          <select
                            value={pref?.remindBeforeMinutes ?? 60}
                            onChange={(e) =>
                              handleRemindBeforeChange(
                                def.type,
                                Number(e.target.value),
                              )
                            }
                            className="h-8 rounded-full border border-po-border bg-white px-3 text-xs text-po-text focus:border-po-primary focus:outline-none focus:ring-1 focus:ring-po-primary/20"
                          >
                            {REMIND_BEFORE_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSave(def.type)}
                    disabled={
                      isSavingThis ||
                      updateMutation.isPending ||
                      !hasChanged
                    }
                    className={`shrink-0 rounded-full border bg-white px-4 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      hasChanged
                        ? "border-po-primary text-po-primary hover:bg-po-primary/10"
                        : "border-po-border text-po-text-muted"
                    }`}
                  >
                    {isSavingThis ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
