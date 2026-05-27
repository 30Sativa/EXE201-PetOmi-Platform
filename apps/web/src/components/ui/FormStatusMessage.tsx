import { AlertTriangle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"

type FormStatusMessageProps = {
  status: "success" | "error"
  title?: string
  message: string
  className?: string
}

export default function FormStatusMessage({
  status,
  title,
  message,
  className,
}: FormStatusMessageProps) {
  const isSuccess = status === "success"
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={cn(
        "flex gap-3 rounded-[22px] px-4 py-4 text-left ring-1",
        isSuccess
          ? "bg-po-success-soft text-po-success ring-po-success/20"
          : "bg-po-danger-soft text-po-danger ring-po-danger/20",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-2xl bg-white/75",
          isSuccess ? "text-po-success" : "text-po-danger",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm font-extrabold leading-5">
          {title ?? (isSuccess ? "Thao tác thành công" : "Chưa thể xử lý")}
        </strong>
        <span className="mt-1 block text-sm font-medium leading-6 opacity-90">
          {message}
        </span>
      </span>
    </div>
  )
}
