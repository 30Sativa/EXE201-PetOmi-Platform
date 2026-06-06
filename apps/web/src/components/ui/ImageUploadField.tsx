import { useEffect, useRef, useState } from "react"
import { Camera, FileText, Upload, X } from "lucide-react"

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
  helpText?: string
  emptyLabel?: string
  replaceLabel?: string
  onUploadComplete?: (result: CloudinaryUploadResult) => void
  onUploadStateChange?: (isUploading: boolean) => void
}

const DEFAULT_MAX_SIZE_MB = 5

function getUploadErrorMessage(error: unknown, imageType: ImageType) {
  const message = getErrorMessage(error, "Upload that bai. Vui long thu lai.")
  const normalized = message.toLowerCase()

  if (
    normalized.includes("resourceid") ||
    normalized.includes("clinicid") ||
    normalized.includes("petid") ||
    normalized.includes("imagetype")
  ) {
    if (imageType === "clinic_license") {
      return "Chua the upload file giay phep. Vui long tai lai trang hoac thu lai sau."
    }

    return "Chua the upload file do thieu thong tin lien ket. Vui long thu lai sau."
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
  helpText,
  emptyLabel,
  replaceLabel,
  onUploadComplete,
  onUploadStateChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value ?? null)
  const [previewFormat, setPreviewFormat] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentPreview = preview ?? value ?? null
  const isPdfPreview = previewFormat === "pdf" || currentPreview?.toLowerCase().includes(".pdf")
  const uploadHelpText = helpText ?? `JPG, PNG, WEBP, toi da ${maxSizeMb}MB`
  const uploadLabel = emptyLabel ?? "Tai file len"
  const replaceText = replaceLabel ?? "Thay file"

  useEffect(() => {
    queueMicrotask(() => {
      setPreview(value ?? null)
      setPreviewFormat(value?.toLowerCase().includes(".pdf") ? "pdf" : null)
      setError(null)
    })
  }, [value])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Dung luong toi da la ${maxSizeMb}MB.`)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const selectedFormat = file.type === "application/pdf" ? "pdf" : null
    setPreview(objectUrl)
    setPreviewFormat(selectedFormat)
    setError(null)

    setIsUploading(true)
    onUploadStateChange?.(true)
    try {
      const result: CloudinaryUploadResult = await uploadImageApi(
        file,
        imageType,
        resourceId,
      )
      URL.revokeObjectURL(objectUrl)
      setPreview(result.secureUrl)
      setPreviewFormat(result.format?.toLowerCase() ?? selectedFormat)
      onChange(result.secureUrl)
      onUploadComplete?.(result)
    } catch (error) {
      setError(getUploadErrorMessage(error, imageType))
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
      setPreviewFormat(null)
    } finally {
      setIsUploading(false)
      onUploadStateChange?.(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setPreviewFormat(null)
    setError(null)
    onChange("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleReplaceClick = () => {
    inputRef.current?.click()
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      onChange={handleFileChange}
      className="hidden"
    />
  )

  if (buttonOnly) {
    return (
      <div className="grid gap-1.5">
        {label && <span className="text-sm font-semibold text-po-text">{label}</span>}
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
                Dang upload...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                {buttonLabel ?? (currentPreview ? replaceText : uploadLabel)}
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
              Xoa
            </button>
          )}
        </div>
        {error && <p className="text-xs text-po-danger">{error}</p>}
        {showHelpText && <p className="text-xs text-po-text-subtle">{uploadHelpText}</p>}
        {fileInput}
      </div>
    )
  }

  if (currentPreview) {
    return (
      <div className="grid gap-1.5">
        {label && <span className="text-sm font-semibold text-po-text">{label}</span>}
        <div className="relative inline-block w-full">
          {isPdfPreview ? (
            <a
              href={currentPreview}
              target="_blank"
              rel="noreferrer"
              className={previewClassName ?? "flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-po-border bg-white text-sm font-semibold text-po-primary"}
            >
              <FileText className="size-5" />
              PDF da upload
            </a>
          ) : (
            <img
              src={currentPreview}
              alt="Preview"
              className={previewClassName ?? "h-24 w-full rounded-xl border border-po-border object-cover"}
              onError={() => setError("Khong the tai file preview.")}
            />
          )}
          {!disabled && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReplaceClick}
                disabled={isUploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text transition hover:bg-po-surface-muted disabled:opacity-60"
              >
                <Camera className="size-3" />
                {replaceText}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-danger transition hover:bg-po-danger-soft disabled:opacity-60"
              >
                <X className="size-3" />
                Xoa
              </button>
            </div>
          )}
        </div>
        {isUploading && <p className="text-xs text-po-text-muted">Dang upload...</p>}
        {error && <p className="text-xs text-po-danger">{error}</p>}
        {fileInput}
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      {label && <span className="text-sm font-semibold text-po-text">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-po-border bg-po-surface-muted text-sm font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-primary disabled:opacity-60"
      >
        {isUploading ? (
          <>
            <Upload className="size-4 animate-pulse" />
            Dang upload...
          </>
        ) : (
          <>
            <Camera className="size-4" />
            {uploadLabel}
          </>
        )}
      </button>
      {error && <p className="text-xs text-po-danger">{error}</p>}
      {showHelpText && <p className="text-xs text-po-text-subtle">{uploadHelpText}</p>}
      {fileInput}
    </div>
  )
}
