import { useMemo, useState } from "react"
import { Check, Clipboard, Link2, ShieldCheck, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

import { createPetHealthShareApi } from "@/services/pet-health-share.service"
import type {
  CreatePetHealthShareRequest,
  PetHealthShareAccessMode,
  PetHealthShareResponse,
  PetHealthShareScope,
} from "@/types"
import { cn } from "@/lib/utils"

interface SharePetHealthProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  petId: string
  petName: string
}

const scopeOptions: Array<{
  value: PetHealthShareScope
  title: string
  description: string
}> = [
  {
    value: "EmergencySummary",
    title: "Emergency summary",
    description: "Basic profile, allergies, chronic conditions, and alerts.",
  },
  {
    value: "ClinicVisit",
    title: "Clinic visit",
    description: "Visit-ready medical summary with sensitive notes hidden.",
  },
  {
    value: "FullHealthProfile",
    title: "Full health profile",
    description: "Fuller records, examinations, prescriptions, and owner contact.",
  },
]

type ExpiryPreset = "one-time" | "24h" | "7d" | "custom"

const toInputDateTime = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const getPresetExpiry = (preset: ExpiryPreset, customValue: string) => {
  if (preset === "custom") {
    return customValue ? new Date(customValue).toISOString() : undefined
  }

  const now = Date.now()

  if (preset === "7d") {
    return new Date(now + 7 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000).toISOString()
  }

  return new Date(now + 24 * 60 * 60 * 1000).toISOString()
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-"
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

const getShareLink = (code: string) => {
  const origin = typeof window === "undefined" ? "" : window.location.origin
  return `${origin}/dashboard/clinic/pet-intake?shareCode=${encodeURIComponent(code)}`
}

const copyText = async (text: string, successMessage: string) => {
  await navigator.clipboard.writeText(text)
  toast.success(successMessage)
}

export default function SharePetHealthProfileDialog({
  isOpen,
  onClose,
  petId,
  petName,
}: SharePetHealthProfileDialogProps) {
  const queryClient = useQueryClient()
  const [scope, setScope] = useState<PetHealthShareScope>("ClinicVisit")
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("24h")
  const [customExpiry, setCustomExpiry] = useState(() =>
    toInputDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  )
  const [clinicId, setClinicId] = useState("")
  const [note, setNote] = useState("")
  const [createdShare, setCreatedShare] = useState<PetHealthShareResponse | null>(null)

  const maxCustomDateTime = useMemo(
    () => toInputDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 - 10 * 60 * 1000)),
    [],
  )

  const mutation = useMutation({
    mutationFn: (data: CreatePetHealthShareRequest) =>
      createPetHealthShareApi(petId, data),
    onSuccess: (share) => {
      setCreatedShare(share)
      queryClient.invalidateQueries({ queryKey: ["pet-health-shares", petId] })
      toast.success("Health share code created.")
    },
    onError: () => {
      toast.error("Could not create health share code. Please check the settings.")
    },
  })

  if (!isOpen) return null

  const isOneTime = expiryPreset === "one-time"
  const canSubmit =
    !mutation.isPending &&
    (expiryPreset !== "custom" || Boolean(customExpiry))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const accessMode: PetHealthShareAccessMode = isOneTime ? "OneTime" : "Temporary"
    const expiresAt = getPresetExpiry(expiryPreset, customExpiry)

    mutation.mutate({
      scope,
      accessMode,
      expiresAt,
      clinicId: clinicId.trim() || undefined,
      note: note.trim() || undefined,
    })
  }

  const shareLink = createdShare ? getShareLink(createdShare.displayCode) : ""

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={(event) => event.target === event.currentTarget && !mutation.isPending && onClose()}
    >
      <div className="m-auto grid max-h-[calc(100vh-2rem)] w-[min(760px,100%)] overflow-y-auto rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">
              Share {petName}'s health profile
            </h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Create a short code for clinic staff to view the right health details.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-semibold text-po-text">Share scope</span>
              <div className="grid gap-2">
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setScope(option.value)}
                    disabled={mutation.isPending}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl border p-3 text-left transition",
                      scope === option.value
                        ? "border-po-primary bg-po-primary/10"
                        : "border-po-border bg-white hover:border-po-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 place-items-center rounded-full border",
                        scope === option.value
                          ? "border-po-primary bg-po-primary text-white"
                          : "border-po-border",
                      )}
                    >
                      {scope === option.value ? <Check className="size-3" /> : null}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-po-text">
                        {option.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-po-text-muted">
                        {option.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold text-po-text">Expiry</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["one-time", "One-time"],
                  ["24h", "24 hours"],
                  ["7d", "7 days"],
                  ["custom", "Custom"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExpiryPreset(value as ExpiryPreset)}
                    disabled={mutation.isPending}
                    className={cn(
                      "h-10 rounded-xl border px-3 text-sm font-semibold transition",
                      expiryPreset === value
                        ? "border-po-primary bg-po-primary text-white"
                        : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {expiryPreset === "custom" ? (
                <input
                  type="datetime-local"
                  value={customExpiry}
                  min={toInputDateTime(new Date(Date.now() + 5 * 60 * 1000))}
                  max={maxCustomDateTime}
                  onChange={(event) => setCustomExpiry(event.target.value)}
                  disabled={mutation.isPending}
                  className="h-11 rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
                />
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="health-share-clinic" className="text-sm font-semibold text-po-text">
                Clinic restriction
              </label>
              <input
                id="health-share-clinic"
                value={clinicId}
                onChange={(event) => setClinicId(event.target.value)}
                placeholder="Optional clinic ID"
                disabled={mutation.isPending}
                className="h-11 rounded-xl border border-po-border bg-white px-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="health-share-note" className="text-sm font-semibold text-po-text">
                Note
              </label>
              <textarea
                id="health-share-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Optional context for this share"
                disabled={mutation.isPending}
                className="resize-none rounded-xl border border-po-border bg-white px-4 py-3 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={mutation.isPending}
                className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
              >
                <ShieldCheck className="size-4" />
                {mutation.isPending ? "Creating..." : "Create code"}
              </button>
            </div>
          </form>

          <aside className="rounded-2xl border border-po-border bg-po-surface-muted p-4">
            {createdShare ? (
              <div className="grid gap-4">
                <div className="rounded-2xl border border-po-border bg-white p-3">
                  <QRCodeSVG
                    value={shareLink}
                    size={224}
                    level="M"
                    includeMargin
                    className="h-auto w-full"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-po-text-muted">
                    Health share code
                  </p>
                  <p className="mt-2 break-all rounded-xl border border-po-border bg-white px-4 py-3 text-center text-2xl font-extrabold tracking-wide text-po-text">
                    {createdShare.displayCode}
                  </p>
                </div>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(createdShare.displayCode, "Code copied.")
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
                  >
                    <Clipboard className="size-4" />
                    Copy code
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(shareLink, "Share link copied.")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-po-border bg-white px-4 text-sm font-semibold text-po-text-muted transition hover:bg-white/80 hover:text-po-text"
                  >
                    <Link2 className="size-4" />
                    Copy link
                  </button>
                </div>
                <div className="grid gap-1 text-xs text-po-text-muted">
                  <p>Scope: {createdShare.scope}</p>
                  <p>Mode: {createdShare.accessMode}</p>
                  <p>Expires: {formatDateTime(createdShare.expiresAt)}</p>
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-56 place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-po-primary">
                    <ShieldCheck className="size-6" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-po-text">
                    Your code appears here
                  </p>
                  <p className="mt-1 text-xs text-po-text-muted">
                    Create a code, then show the QR or copy the link for the clinic.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
