import { useEffect, useState } from "react"
import { KeyRound, Search } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getErrorMessage } from "@/lib/utils"
import {
  getClinicPetHealthOverviewApi,
  resolveClinicPetHealthShareApi,
} from "@/services/pet-health-share.service"
import type { PetHealthOverviewResponse } from "@/types"

interface PetHealthShareCodeFormProps {
  clinicId: string
  initialCode?: string
  onOverviewLoaded: (overview: PetHealthOverviewResponse) => void
}

const normalizeShareCode = (value: string) => value.trim().toUpperCase()

const getResolveErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 429
  ) {
    return "Too many attempts. Please wait a minute before trying another HealthShareCode."
  }

  return getErrorMessage(error, "Could not resolve this health share code.")
}

export default function PetHealthShareCodeForm({
  clinicId,
  initialCode,
  onOverviewLoaded,
}: PetHealthShareCodeFormProps) {
  const [shareCode, setShareCode] = useState(initialCode ?? "")
  const [errorMessage, setErrorMessage] = useState("")

  const mutation = useMutation({
    mutationFn: async (code: string) => {
      const normalizedCode = normalizeShareCode(code)
      const resolved = await resolveClinicPetHealthShareApi(clinicId, {
        shareCode: normalizedCode,
      })

      return getClinicPetHealthOverviewApi(clinicId, resolved.petId, {
        shareCode: normalizedCode,
      })
    },
    onSuccess: (overview) => {
      setErrorMessage("")
      onOverviewLoaded(overview)
    },
    onError: (error) => {
      setErrorMessage(getResolveErrorMessage(error))
    },
  })

  useEffect(() => {
    if (!initialCode || !clinicId) return
    setShareCode(initialCode)
    mutation.mutate(initialCode)
    // Run once for a link-opened share code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, initialCode])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedCode = normalizeShareCode(shareCode)
    if (!normalizedCode) return
    mutation.mutate(normalizedCode)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <KeyRound className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-po-text">
            Enter health share code
          </h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Paste the HLT code provided by the pet owner. The access scope is enforced by backend.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={shareCode}
          onChange={(event) => setShareCode(event.target.value)}
          placeholder="HLT-ABC-123"
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          disabled={mutation.isPending}
          className="h-11 rounded-xl border border-po-border bg-white px-4 text-sm font-semibold uppercase tracking-wide text-po-text placeholder:normal-case placeholder:tracking-normal placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !shareCode.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          {mutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Search className="size-4" />
          )}
          Resolve
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-po-danger/30 bg-po-danger/10 px-4 py-3 text-sm font-semibold text-po-danger">
          {errorMessage}
        </div>
      ) : null}
    </form>
  )
}
