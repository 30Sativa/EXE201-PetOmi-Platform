import { X } from "lucide-react"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPetPhotoApi } from "@/services/pets.service"
import ImageUploadField from "@/components/ui/ImageUploadField"
import { cn } from "@/lib/utils"
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
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState("")
  const [caption, setCaption] = useState("")
  const [isAvatar, setIsAvatar] = useState(false)
  const [takenAt, setTakenAt] = useState("")
  const [touchedTakenAt, setTakenAtTouched] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: CreatePetPhotoRequest) =>
      createPetPhotoApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-photos", petId] })
      queryClient.invalidateQueries({ queryKey: ["pet", petId] })
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      toast.success("Thêm ảnh thành công!")
      setImageUrl("")
      setCloudinaryPublicId("")
      setCaption("")
      setIsAvatar(false)
      setTakenAt("")
      onClose()
    },
    onError: () => {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTakenAtTouched(true)
    if (!imageUrl.trim()) return
    if (!takenAt.trim()) return
    mutation.mutate({
      imageUrl: imageUrl.trim(),
      cloudinaryPublicId: cloudinaryPublicId.trim() || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={handleBackdropClick}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
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
        <ImageUploadField
          label="Ảnh"
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url)
            if (!url) setCloudinaryPublicId("")
          }}
          onUploadComplete={(result) => setCloudinaryPublicId(result.publicId)}
          imageType="pet_photo"
          resourceId={petId}
          disabled={mutation.isPending}
        />

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
            onChange={(e) => {
              setTakenAt(e.target.value)
              setTakenAtTouched(true)
            }}
            onBlur={() => setTakenAtTouched(true)}
            max={new Date().toISOString().split("T")[0]}
            disabled={mutation.isPending}
            className={cn(
              "h-11 w-full rounded-xl border bg-white px-4 text-sm focus:outline-none focus:ring-2 disabled:opacity-60",
              touchedTakenAt && !takenAt.trim()
                ? "border-po-danger focus:border-po-danger focus:ring-po-danger/20"
                : "border-po-border focus:border-po-primary focus:ring-po-primary/20"
            )}
          />
          {touchedTakenAt && !takenAt.trim() && (
            <p className="text-xs text-po-danger">Vui lòng chọn ngày chụp.</p>
          )}
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
            disabled={mutation.isPending || !imageUrl.trim() || !takenAt.trim()}
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
