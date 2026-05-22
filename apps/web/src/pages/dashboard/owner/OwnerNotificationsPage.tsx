import { Bell, CheckCheck, Wifi, WifiOff } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import StatusBadge from "@/components/ui/StatusBadge"
import { useNotifications } from "@/contexts/NotificationContext"
import { cn } from "@/lib/utils"

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Vừa xong"
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })
  } catch {
    return dateStr
  }
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "reminder":
      return "🔔"
    case "appointment":
      return "📅"
    case "review":
      return "⭐"
    default:
      return "ℹ️"
  }
}

const getNotificationTypeLabel = (type: string) => {
  switch (type) {
    case "reminder":
      return "Nhắc nhở"
    case "appointment":
      return "Lịch hẹn"
    case "review":
      return "Đánh giá"
    case "system":
      return "Hệ thống"
    default:
      return "Thông báo"
  }
}

export default function OwnerNotificationsPage() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Thông báo</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Nhận thông báo real-time về lịch hẹn, nhắc nhở và cập nhật hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              isConnected
                ? "border-po-success bg-po-success-soft text-po-success"
                : "border-po-border bg-po-surface-muted text-po-text-muted",
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="size-4" />
                Đã kết nối
              </>
            ) : (
              <>
                <WifiOff className="size-4" />
                Mất kết nối
              </>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
            >
              <CheckCheck className="size-4" />
              Đánh dấu đã đọc ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Connection Help */}
      {!isConnected && (
        <div className="rounded-2xl border border-po-warning bg-po-warning-soft p-4">
          <p className="text-sm font-semibold text-po-warning">
            Mất kết nối thông báo
          </p>
          <p className="mt-1 text-xs text-po-text-muted">
            Không thể nhận thông báo real-time. Vui lòng đăng nhập lại để kết nối lại.
          </p>
        </div>
      )}

      {/* Notification List */}
      <DashboardSection
        title={`${notifications.length} thông báo`}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} chưa đọc`
            : "Tất cả đã đọc"
        }
      >
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-po-surface-muted">
              <Bell className="size-7 text-po-text-subtle" />
            </div>
            <p className="text-sm font-semibold text-po-text">
              Chưa có thông báo nào
            </p>
            <p className="mt-1 text-xs text-po-text-muted">
              Các thông báo về lịch hẹn và nhắc nhở sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition",
                  notif.isRead
                    ? "border-po-border bg-white opacity-70"
                    : "border-po-primary/30 bg-po-primary-soft",
                )}
              >
                <span className="mt-0.5 text-xl">
                  {getNotificationIcon(notif.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-po-text">{notif.title}</p>
                    {!notif.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-po-primary" />
                    )}
                  </div>
                  {notif.message && (
                    <p className="mt-0.5 text-xs text-po-text-muted">
                      {notif.message}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-po-text-subtle">
                    <StatusBadge
                      variant="info"
                      label={getNotificationTypeLabel(notif.type)}
                    />
                    <span>·</span>
                    <span>{formatTime(notif.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
