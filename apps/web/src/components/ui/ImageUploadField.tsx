import { useRef, useState } from "react"
import { Camera, Upload, X } from "lucide-react"
import { getErrorMessage } from "@/lib/utils"
import { uploadImageApi, type CloudinaryUploadResult, type ImageType } from "@/services/upload.service"

interface ImageUploadFieldProps {
  label?: string
  value?: string
  onChange: (url: string) => void
  imageType: ImageType
  resourceId?: string
  disabled?: boolean
  accept?: string
  maxSizeMb?: number
  previewClassName?: string
  buttonOnly?: boolean
  buttonLabel?: string
  buttonClassName?: string
  showHelpText?: boolean
  onUploadComplete?: (result: CloudinaryUploadResult) => void
}

const DEFAULT_MAX_SIZE_MB = 5

function getUploadErrorMessage(error: unknown, imageType: ImageType) {
  const message = getErrorMessage(error, "Upload thất bại. Vui lòng thử lại.")
  const normalized = message.toLowerCase()

  if (
    normalized.includes("resourceid") ||
    normalized.includes("clinicid") ||
    normalized.includes("petid") ||
    normalized.includes("imagetype")
  ) {
    if (imageType === "clinic_license") {
      return "Chưa thể upload ảnh giấy phép. Vui lòng tải lại trang hoặc thử lại sau khi hệ thống cập nhật."
    }

    return "Chưa thể upload ảnh do thiếu thông tin liên kết. Vui lòng thử lại sau."
  }

  return message
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  imageType,
  resourceId,
  disabled,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMb = DEFAULT_MAX_SIZE_MB,
  previewClassName,
  buttonOnly = false,
  buttonLabel,
  buttonClassName,
  showHelpText = true,
  onUploadComplete,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentPreview = preview ?? value ?? null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Dung lượng tối đa là ${maxSizeMb}MB.`)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setError(null)

    setIsUploading(true)
    try {
      const result: CloudinaryUploadResult = await uploadImageApi(
        file,
        imageType,
        resourceId,
      )
      onChange(result.secureUrl)
      onUploadComplete?.(result)
    } catch (error) {
      setError(getUploadErrorMessage(error, imageType))
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleReplaceClick = () => {
    inputRef.current?.click()
  }

  if (buttonOnly) {
    return (
      <div className="grid gap-1.5">
        {label && (
          <span className="text-sm font-semibold text-po-text">{label}</span>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReplaceClick}
            disabled={disabled || isUploading}
            className={buttonClassName ?? "inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text transition hover:bg-po-surface-muted disabled:opacity-60"}
          >
            {isUploading ? (
              <>
                <Upload className="size-4 animate-pulse" />
                Đang upload...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                {buttonLabel ?? (currentPreview ? "Thay ảnh" : "Tải ảnh lên")}
              </>
            )}
          </button>
          {currentPreview && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-danger transition hover:bg-po-danger-soft disabled:opacity-60"
            >
              <X className="size-4" />
              Xóa
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-po-danger">{error}</p>
        )}
        {showHelpText && (
          <p className="text-xs text-po-text-subtle">
            JPG, PNG, WEBP, tối đa {maxSizeMb}MB
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    )
  }

  if (currentPreview) {
    return (
      <div className="grid gap-1.5">
        {label && (
          <span className="text-sm font-semibold text-po-text">{label}</span>
        )}
        <div className="relative inline-block w-full">
          <img
            src={currentPreview}
            alt="Preview"
            className={previewClassName ?? "h-24 w-full rounded-xl border border-po-border object-cover"}
            onError={() => setError("Không thể tải ảnh.")}
          />
          {!disabled && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReplaceClick}
                disabled={isUploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text transition hover:bg-po-surface-muted disabled:opacity-60"
              >
                <Camera className="size-3" />
                Thay ảnh
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-danger transition hover:bg-po-danger-soft disabled:opacity-60"
              >
                <X className="size-3" />
                Xóa
              </button>
            </div>
          )}
        </div>
        {isUploading && (
          <p className="text-xs text-po-text-muted">Đang upload...</p>
        )}
        {error && (
          <p className="text-xs text-po-danger">{error}</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      {label && (
        <span className="text-sm font-semibold text-po-text">{label}</span>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-po-border bg-po-surface-muted text-sm font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-primary disabled:opacity-60"
      >
        {isUploading ? (
          <>
            <Upload className="size-4 animate-pulse" />
            Đang upload...
          </>
        ) : (
          <>
            <Camera className="size-4" />
            Tải ảnh lên
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-po-danger">{error}</p>
      )}
      <p className="text-xs text-po-text-subtle">
        JPG, PNG, WEBP, tối đa {maxSizeMb}MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
