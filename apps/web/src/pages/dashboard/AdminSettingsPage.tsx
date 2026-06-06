import { useState } from "react"
import {
  Bell,
  Check,
  KeyRound,
  Mail,
  Save,
  Search,
  Settings,
  Shield,
  X,
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { LoadingSpinner } from "@/components/ui/LoadingStates"
import EmptyState from "@/components/ui/EmptyState"
import { getSystemSettingsApi, updateSystemSettingApi } from "@/services/admin.service"
import type { SystemSettingResponse } from "@/types"

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
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

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  General: { label: "Chung", icon: Settings, color: "text-po-primary" },
  Notification: { label: "Thông báo", icon: Bell, color: "text-po-warning" },
  Security: { label: "Bảo mật", icon: Shield, color: "text-po-danger" },
  Email: { label: "Email", icon: Mail, color: "text-po-success" },
  Api: { label: "API", icon: KeyRound, color: "text-po-text-muted" },
}

const SETTING_DEFINITIONS: Record<
  string,
  { label: string; description: string; type: "text" | "number" | "boolean" | "select"; options?: string[] }
> = {
  AppName: {
    label: "Tên ứng dụng",
    description: "Tên hiển thị của ứng dụng",
    type: "text",
  },
  MaxUsersPerClinic: {
    label: "Số người tối đa / clinic",
    description: "Số lượng người dùng tối đa được phép trong một clinic",
    type: "number",
  },
  DefaultPageSize: {
    label: "Kích thước trang mặc định",
    description: "Số phần tử hiển thị trên một trang (phân trang)",
    type: "number",
  },
  MaintenanceMode: {
    label: "Chế độ bảo trì",
    description: "Bật/Tắt chế độ bảo trì toàn hệ thống",
    type: "boolean",
  },
  AllowRegistration: {
    label: "Cho phép đăng ký",
    description: "Cho phép người dùng mới đăng ký tài khoản",
    type: "boolean",
  },
  RequireEmailVerification: {
    label: "Yêu cầu xác thực email",
    description: "Bắt buộc người dùng phải xác thực email trước khi sử dụng",
    type: "boolean",
  },
  SmtpHost: {
    label: "SMTP Host",
    description: "Địa chỉ server SMTP để gửi email",
    type: "text",
  },
  SmtpPort: {
    label: "SMTP Port",
    description: "Cổng SMTP (thường là 587 hoặc 465)",
    type: "number",
  },
  SessionTimeout: {
    label: "Thời gian hết hạn session (phút)",
    description: "Sau bao lâu thì session bị tự động hết hạn",
    type: "number",
  },
  MaxLoginAttempts: {
    label: "Số lần đăng nhập tối đa",
    description: "Số lần đăng nhập sai trước khi tài khoản bị tạm khóa",
    type: "number",
  },
  JwtExpiryMinutes: {
    label: "Thời gian hết hạn Access Token (phút)",
    description: "Access token hết hạn sau bao lâu",
    type: "number",
  },
  RefreshTokenExpiryDays: {
    label: "Thời gian hết hạn Refresh Token (ngày)",
    description: "Refresh token hết hạn sau bao lâu",
    type: "number",
  },
}

type CategoryFilter = "all" | "General" | "Notification" | "Security" | "Email" | "Api"

export default function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<CategoryFilter>("all")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [search, setSearch] = useState("")

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => getSystemSettingsApi(),
    staleTime: 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSystemSettingApi(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] })
      setEditingKey(null)
    },
  })

  const startEdit = (setting: SystemSettingResponse) => {
    setEditingKey(setting.SettingKey)
    setEditValue(setting.SettingValue)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue("")
  }

  const saveEdit = () => {
    if (!editingKey) return
    updateMutation.mutate({ key: editingKey, value: editValue })
  }

  const groupedSettings = (settings ?? []).reduce<Record<string, SystemSettingResponse[]>>(
    (acc, setting) => {
      const cat = setting.Category || "General"
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(setting)
      return acc
    },
    {},
  )

  const filteredGroups =
    filter === "all"
      ? groupedSettings
      : { [filter]: groupedSettings[filter] ?? [] }

  const filtered: Array<[string, SystemSettingResponse[]]> = Object.entries(filteredGroups)
    .filter(([cat]) => filter === "all" || cat === filter)
    .map(([category, items]): [string, SystemSettingResponse[]] => [
      category,
      items.filter((s) => {
        if (!search) return true
        const def = SETTING_DEFINITIONS[s.SettingKey]
        return (
          s.SettingKey.toLowerCase().includes(search.toLowerCase()) ||
          (def?.label ?? "").toLowerCase().includes(search.toLowerCase())
        )
      }),
    ])
    .filter(([, items]) => items.length > 0)

  const categoryTabs: { value: CategoryFilter; label: string; icon: React.ElementType }[] = [
    { value: "all", label: "Tất cả", icon: Settings },
    { value: "General", label: "Chung", icon: Settings },
    { value: "Security", label: "Bảo mật", icon: Shield },
    { value: "Notification", label: "Thông báo", icon: Bell },
    { value: "Email", label: "Email", icon: Mail },
    { value: "Api", label: "API", icon: KeyRound },
  ]

  return (
    <div className="grid gap-5">
      <section className="admin-page-hero">
        <div className="admin-page-hero-body">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-po-text-subtle">
            Admin system configuration
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
            Cài đặt hệ thống
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-po-text-muted">
            Cấu hình các thông số hoạt động của hệ thống. Thay đổi sẽ có hiệu lực ngay lập tức. Hãy
            cẩn thận khi chỉnh sửa các thông số quan trọng.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-po-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm cấu hình..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white text-sm text-po-text ring-1 ring-po-border/80 placeholder:text-po-text-muted/70 focus:outline-none focus:ring-2 focus:ring-po-primary/40 transition"
          />
        </div>

        <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1 ring-1 ring-po-border/80">
          {categoryTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition whitespace-nowrap ${
                filter === tab.value
                  ? "bg-po-primary text-white"
                  : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text"
              }`}
            >
              <tab.icon className="size-3 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[28px] bg-white py-20 text-center shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
          <EmptyState
            icon={Settings}
            title="Không có cấu hình nào"
            description={
              search ? "Thử lại từ khóa khác" : "Chưa có cấu hình nào trong danh mục này."
            }
          />
        </div>
      ) : (
        filtered.map(([category, items]) => {
          const meta = CATEGORY_META[category] ?? {
            label: category,
            icon: Settings,
            color: "text-po-text-muted",
          }
          const CatIcon = meta.icon

          return (
            <section
              key={category}
              className="overflow-hidden rounded-[28px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80"
            >
              <div className="flex items-center gap-3 border-b border-po-border/60 px-5 py-4">
                <CatIcon className={`size-5 shrink-0 ${meta.color}`} />
                <h3 className="text-sm font-bold text-po-text">{meta.label}</h3>
                <span className="ml-auto text-xs text-po-text-muted">
                  {items.length} cấu hình
                </span>
              </div>

              <div className="divide-y divide-po-border/40">
                {items.map((setting) => {
                  const def = SETTING_DEFINITIONS[setting.SettingKey]
                  const isEditing = editingKey === setting.SettingKey

                  return (
                    <div key={setting.SettingKey} className="px-5 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-po-text">
                              {def?.label ?? setting.SettingKey}
                            </p>
                            {def?.type === "boolean" && (
                              <span className="inline-flex items-center rounded-2xl bg-po-surface-muted px-2 py-0.5 text-[10px] font-semibold text-po-text-muted">
                                Toggle
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-po-text-muted">
                            {def?.description ?? setting.Description ?? setting.SettingKey}
                          </p>
                          <p className="mt-1 text-[10px] text-po-text-subtle font-mono">
                            Cập nhật lúc: {formatDate(setting.UpdatedAt)}
                          </p>
                        </div>

                        <div className="w-full sm:w-auto sm:shrink-0">
                          {isEditing ? (
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              {def?.type === "boolean" ? (
                                <button
                                  onClick={() => setEditValue(editValue === "true" ? "false" : "true")}
                                  className={`inline-flex h-9 min-w-20 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-semibold transition ${
                                    editValue === "true"
                                      ? "bg-po-success text-white"
                                      : "bg-po-danger text-white"
                                  }`}
                                >
                                  {editValue === "true" ? "Bật" : "Tắt"}
                                </button>
                              ) : def?.type === "select" && def.options ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-9 min-w-36 rounded-2xl bg-po-surface-muted/50 px-4 text-xs text-po-text ring-1 ring-po-border/60 focus:outline-none focus:ring-2 focus:ring-po-primary/40"
                                >
                                  {def.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={def?.type === "number" ? "number" : "text"}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-9 w-full min-w-0 rounded-2xl bg-po-surface-muted/50 px-4 text-xs text-po-text ring-1 ring-po-border/60 focus:outline-none focus:ring-2 focus:ring-po-primary/40 sm:w-48"
                                />
                              )}

                              <button
                                onClick={saveEdit}
                                disabled={updateMutation.isPending}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-po-success text-white transition hover:-translate-y-0.5 disabled:opacity-40"
                                title="Lưu"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={updateMutation.isPending}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-po-surface-muted text-po-text-muted transition hover:-translate-y-0.5 disabled:opacity-40"
                                title="Hủy"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <span className="max-w-full break-words rounded-2xl bg-po-surface-muted/50 px-3 py-1 text-xs font-semibold text-po-text">
                                {setting.SettingValue}
                              </span>
                              <button
                                onClick={() => startEdit(setting)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-po-primary-soft text-po-primary transition hover:-translate-y-0.5 hover:bg-po-primary hover:text-white"
                                title="Chỉnh sửa"
                              >
                                <Save className="size-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}

      <div className="rounded-2xl bg-po-warning-soft/20 border border-po-warning/20 p-4 text-sm text-po-warning">
        <p className="font-semibold flex items-center gap-2">
          <Shield className="size-4 shrink-0" />
          Lưu ý quan trọng
        </p>
        <p className="mt-1 text-xs leading-5 opacity-80">
          Các thay đổi cấu hình sẽ có hiệu lực ngay lập tức. Một số thay đổi (như MaintenanceMode, JwtExpiryMinutes) có thể ảnh hưởng đến trải nghiệm người dùng. Hãy thông báo trước khi thay đổi hệ thống.
        </p>
      </div>
    </div>
  )
}

