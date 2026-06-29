import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Bug, Lightbulb, MessageSquareText, MonitorCog, Send, Sparkles, Star } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import { createWebsiteFeedbackApi } from "@/services/website-feedback.service"
import type { WebsiteFeedbackCategory } from "@/types"
import { cn } from "@/lib/utils"

const categoryOptions: Array<{
  value: WebsiteFeedbackCategory
  label: string
  icon: typeof MessageSquareText
}> = [
  { value: "General", label: "Góp ý chung", icon: MessageSquareText },
  { value: "Bug", label: "Báo lỗi", icon: Bug },
  { value: "Feature", label: "Đề xuất tính năng", icon: Lightbulb },
  { value: "UX", label: "Trải nghiệm sử dụng", icon: Sparkles },
  { value: "Performance", label: "Tốc độ/hiệu năng", icon: MonitorCog },
]

export default function WebsiteFeedbackPage() {
  const [category, setCategory] = useState<WebsiteFeedbackCategory>("General")
  const [rating, setRating] = useState<number | null>(5)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const browserInfo = useMemo(() => {
    if (typeof navigator === "undefined") return ""
    return navigator.userAgent
  }, [])

  const mutation = useMutation({
    mutationFn: createWebsiteFeedbackApi,
    onSuccess: () => {
      setSuccessMessage("Cảm ơn bạn nhiều nha, feedback đã tới PetOmi rồi. Team sẽ đọc thật kỹ và chăm chút web tốt hơn.")
      setCategory("General")
      setRating(5)
      setSubject("")
      setMessage("")
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSuccessMessage("")
    mutation.mutate({
      category,
      rating,
      subject,
      message,
      pageUrl: window.location.href,
      browserInfo,
    })
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-xl font-bold text-po-text">Góp ý về website</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-po-text-muted">
          Gửi góp ý về lỗi, trải nghiệm sử dụng, hoặc tính năng bạn muốn PetOmi cải thiện.
        </p>
      </div>

      <DashboardSection title="Nội dung góp ý">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {categoryOptions.map((option) => {
              const Icon = option.icon
              const isSelected = category === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  className={cn(
                    "flex min-h-[92px] flex-col items-start justify-between rounded-2xl border p-4 text-left text-sm font-bold transition",
                    isSelected
                      ? "border-po-primary bg-po-primary-soft text-po-primary"
                      : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong hover:text-po-text",
                  )}
                >
                  <Icon className="size-5" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>

          <div>
            <label className="text-sm font-semibold text-po-text">Mức độ hài lòng</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={cn(
                    "inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold ring-1 transition",
                    (rating ?? 0) >= value
                      ? "bg-po-warning-soft text-po-warning ring-po-warning/30"
                      : "bg-white text-po-text-subtle ring-po-border hover:text-po-text",
                  )}
                  aria-label={`${value} sao`}
                >
                  <Star className={cn("size-4", (rating ?? 0) >= value ? "fill-po-warning" : "")} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-po-text">Tiêu đề</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
                required
                className="h-11 rounded-2xl border border-po-border bg-white px-4 text-sm outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary-soft"
                placeholder="Ví dụ: Nút đặt lịch hơi khó tìm"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-po-text">Nội dung</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={2000}
                required
                rows={8}
                className="resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary-soft"
                placeholder="Mô tả ngắn gọn điều bạn gặp phải hoặc mong muốn cải thiện..."
              />
            </label>
          </div>

          {mutation.isError ? (
            <p className="rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger">
              Không gửi được góp ý. Nếu bạn đang là Admin thì hệ thống không cho phép gửi góp ý website.
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-2xl bg-po-success-soft px-4 py-3 text-sm font-semibold text-po-success">
              {successMessage}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-bold text-white shadow-lg shadow-orange-200/40 transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="size-4" />
              {mutation.isPending ? "Đang gửi..." : "Gửi góp ý"}
            </button>
          </div>
        </form>
      </DashboardSection>
    </div>
  )
}
