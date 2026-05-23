import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createPetPhotoApi } from "@/services/pets.service"
import type { CreatePetPhotoRequest } from "@/types"

interface PhotoModalProps {
  isOpen: boolean
  onClose: () => void
  petId: string
}

export default function PhotoModal({
  isOpen,
  onClose,
  petId,
}: PhotoModalProps) {
  const queryClient = useQueryClient()

  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [isAvatar, setIsAvatar] = useState(false)
  const [takenAt, setTakenAt] = useState("")

  const mutation = useMutation({
    mutationFn: (data: CreatePetPhotoRequest) =>
      createPetPhotoApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] })
      setImageUrl("")
      setCaption("")
      setIsAvatar(false)
      setTakenAt("")
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return
    mutation.mutate({
      imageUrl: imageUrl.trim(),
      caption: caption.trim() || undefined,
      isAvatar,
      takenAt: takenAt ? new Date(takenAt).toISOString() : undefined,
    })
  }

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={handleBackdropClick}
      style={{ animation: "po-dialog-in 200ms cubic-bezier(0.2,0.8,0.2,1) both" }}
    >
      <div className="w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20"
        style={{ animation: "po-dialog-content-in 300ms cubic-bezier(0.2,0.8,0.2,1) both" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">Thêm ảnh</h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Nhập URL ảnh để thêm vào thư viện của thú cưng.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">
            URL ảnh <span className="text-po-danger">*</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            required
            disabled={mutation.isPending}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        {imageUrl && (
          <div className="overflow-hidden rounded-xl border border-po-border">
            <img
              src={imageUrl}
              alt="Preview"
              className="h-48 w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Mô tả</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="VD: Mochi ngày sinh nhật"
            disabled={mutation.isPending}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-semibold text-po-text">Ngày chụp</label>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            disabled={mutation.isPending}
            className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isAvatar}
            onChange={(e) => setIsAvatar(e.target.checked)}
            disabled={mutation.isPending}
            className="size-5 rounded accent-po-primary"
          />
          <span className="text-sm font-semibold text-po-text">
            Đặt làm ảnh đại diện
          </span>
        </label>

        {mutation.error && (
          <div className="rounded-xl border border-po-danger/30 bg-po-danger/10 px-4 py-3 text-sm text-po-danger">
            Đã xảy ra lỗi khi tải ảnh. Vui lòng kiểm tra lại URL.
          </div>
        )}

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !imageUrl.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            {mutation.isPending ? "Đang tải..." : "Thêm ảnh"}
          </button>
        </div>
      </form>
      </div>
      </div>
  )
}
