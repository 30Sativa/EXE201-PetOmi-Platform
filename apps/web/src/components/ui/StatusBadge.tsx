import { cn } from "@/lib/utils"

type BadgeVariant =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "rescheduled"
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"

interface StatusBadgeProps {
  variant?: BadgeVariant
  label: string
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: "bg-po-warning-soft text-po-warning",
  confirmed: "bg-po-primary-soft text-po-primary",
  completed: "bg-po-success-soft text-po-success",
  cancelled: "bg-po-danger-soft text-po-danger",
  rescheduled: "bg-po-accent-soft text-po-accent",
  default: "bg-po-surface-muted text-po-text-muted",
  success: "bg-po-success-soft text-po-success",
  warning: "bg-po-warning-soft text-po-warning",
  danger: "bg-po-danger-soft text-po-danger",
  info: "bg-po-primary-soft text-po-primary",
}

export default function StatusBadge({
  variant = "default",
  label,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className,
      )}
    >
      {label}
    </span>
  )
}

// Map appointment status → badge variant
export function appointmentStatusVariant(
  status: string,
): BadgeVariant {
  switch (status.toLowerCase()) {
    case "pending":
    case "chờ xác nhận":
    case "waiting":
    case "awaiting confirmation":
      return "pending"
    case "confirmed":
    case "đã xác nhận":
    case "approved":
      return "confirmed"
    case "completed":
    case "hoàn thành":
    case "done":
      return "completed"
    case "cancelled":
    case "đã hủy":
    case "rejected":
    case "rejected by clinic":
      return "cancelled"
    case "rescheduled":
    case "đã đổi lịch":
      return "rescheduled"
    default:
      return "default"
  }
}

// Map reminder status → badge variant
export function reminderStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "pending":
    case "active":
    case "đang chờ":
      return "pending"
    case "sent":
    case "đã gửi":
    case "delivered":
      return "success"
    case "dismissed":
    case "đã bỏ qua":
      return "info"
    case "disabled":
    case "tắt":
      return "warning"
    default:
      return "default"
  }
}
