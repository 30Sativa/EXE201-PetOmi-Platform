import { useEffect, useState } from "react"
import { Star, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"
import { createClinicReviewApi } from "@/services/clinic-review.service"
import { cn } from "@/lib/utils"

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { errors?: string[]; message?: string }
      | undefined
    return data?.errors?.[0] ?? data?.message ?? fallback
  }
  return fallback
}

interface ClinicReviewModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: string
  appointmentId?: string | null
  appointmentLabel?: string
}

export default function ClinicReviewModal({
  isOpen,
  onClose,
  clinicId,
  appointmentId,
  appointmentLabel,
}: ClinicReviewModalProps) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState("")

  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setHoverRating(0)
      setContent("")
    }
  }, [isOpen, appointmentId])

  const createMutation = useMutation({
    mutationFn: createClinicReviewApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-clinic-reviews"] })
      toast.success("Cảm ơn bạn đã đánh giá phòng khám! 🎉")
      onClose()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không gửi được đánh giá. Vui lòng thử lại."))
    },
  })

  if (!isOpen) return null

  const handleBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !createMutation.isPending) onClose()
  }

  const handleSubmit = () => {
    if (rating < 1) {
      toast.error("Vui lòng chọn số sao đánh giá.")
      return
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.")
      return
    }
    createMutation.mutate({
      clinicId,
      appointmentId: appointmentId ?? undefined,
      rating,
      reviewContent: content.trim(),
    })
  }

  const activeStars = hoverRating || rating
  const ratingLabels = ["", "Tệ", "Chưa tốt", "Bình thường", "Tốt", "Tuyệt vời"]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 animate-dialog-in"
      onClick={handleBackdrop}
    >
      <div className="m-auto w-[min(460px,100%)] overflow-hidden rounded-3xl border border-po-border bg-white shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4 border-b border-po-border/70 bg-po-surface-muted/50 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-po-text">Đánh giá phòng khám</h3>
            {appointmentLabel ? (
              <p className="mt-1 text-sm text-po-text-muted">{appointmentLabel}</p>
            ) : (
              <p className="mt-1 text-sm text-po-text-muted">
                Chia sẻ trải nghiệm của bạn để giúp người khác.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="shrink-0 rounded-full p-1.5 text-po-text-muted transition hover:bg-white hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid place-items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={createMutation.isPending}
                  aria-label={`${value} sao`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "size-9 transition-colors",
                      value <= activeStars
                        ? "fill-po-warning text-po-warning"
                        : "fill-transparent text-po-border-strong",
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="h-5 text-sm font-semibold text-po-text-muted">
              {activeStars > 0 ? ratingLabels[activeStars] : "Chạm để chọn sao"}
            </p>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">
              Nhận xét của bạn
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={createMutation.isPending}
              rows={4}
              maxLength={1000}
              placeholder="Phòng khám phục vụ thế nào? Bác sĩ có tận tình không?"
              className="w-full resize-none rounded-2xl border border-po-border bg-white px-4 py-3 text-sm text-po-text outline-none transition focus:border-po-primary focus:ring-[var(--po-focus-ring)]"
            />
            <p className="text-right text-xs text-po-text-subtle">{content.length}/1000</p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-5 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-bold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
              {createMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
