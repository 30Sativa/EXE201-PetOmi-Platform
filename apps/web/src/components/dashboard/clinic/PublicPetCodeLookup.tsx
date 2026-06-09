import { useState } from "react"
import { IdCard, Search } from "lucide-react"
import { useMutation } from "@tanstack/react-query"

import Avatar from "@/components/ui/Avatar"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getErrorMessage } from "@/lib/utils"
import { getClinicPetHealthOverviewApi } from "@/services/pet-health-share.service"
import { searchClinicPetsApi } from "@/services/clinic.service"
import type { ClinicPetSearchItemResponse, PetHealthOverviewResponse } from "@/types"

interface PublicPetCodeLookupProps {
  clinicId: string
  onOverviewLoaded: (overview: PetHealthOverviewResponse) => void
}

export default function PublicPetCodeLookup({
  clinicId,
  onOverviewLoaded,
}: PublicPetCodeLookupProps) {
  const [code, setCode] = useState("")
  const [matches, setMatches] = useState<ClinicPetSearchItemResponse[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const lookupMutation = useMutation({
    mutationFn: (search: string) =>
      searchClinicPetsApi(clinicId, { search, limit: 10 }),
    onSuccess: (items) => {
      setMatches(items)
      setErrorMessage("")
    },
    onError: (error) => {
      setMatches([])
      setErrorMessage(getErrorMessage(error, "Could not lookup this PetOmi ID."))
    },
  })

  const overviewMutation = useMutation({
    mutationFn: (petId: string) =>
      getClinicPetHealthOverviewApi(clinicId, petId),
    onSuccess: (overview) => {
      setErrorMessage("")
      onOverviewLoaded(overview)
    },
    onError: (error) => {
      setErrorMessage(
        getErrorMessage(
          error,
          "This pet needs a valid HealthShareCode before private health records can be shown.",
        ),
      )
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) return
    lookupMutation.mutate(normalizedCode)
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <IdCard className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-po-text">PetOmi ID lookup</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Use this only to find known pets. Private health records still require a share code or an existing clinic relationship.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="PO-ABC-123"
          disabled={lookupMutation.isPending || overviewMutation.isPending}
          className="h-11 rounded-xl border border-po-border bg-white px-4 text-sm font-semibold uppercase tracking-wide text-po-text placeholder:normal-case placeholder:tracking-normal placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!code.trim() || lookupMutation.isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
        >
          {lookupMutation.isPending ? <LoadingSpinner size="sm" /> : <Search className="size-4" />}
          Lookup
        </button>
      </form>

      {errorMessage ? (
        <div className="rounded-2xl border border-po-warning/30 bg-po-warning-soft px-4 py-3 text-sm font-semibold text-po-warning">
          {errorMessage}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <div className="grid gap-3">
          {matches.map((pet) => (
            <div
              key={pet.petId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={pet.avatarUrl} fallback={pet.petName.slice(0, 2).toUpperCase()} size="sm" alt={pet.petName} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-po-text">{pet.petName}</p>
                  <p className="truncate text-xs text-po-text-muted">
                    {[pet.species, pet.breed, pet.ownerFullName ?? pet.ownerEmail].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => overviewMutation.mutate(pet.petId)}
                disabled={overviewMutation.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-po-border bg-white px-4 text-xs font-semibold text-po-text-muted transition hover:text-po-text disabled:opacity-60"
              >
                {overviewMutation.isPending ? <LoadingSpinner size="sm" /> : null}
                Open clinic overview
              </button>
            </div>
          ))}
        </div>
      ) : lookupMutation.isSuccess ? (
        <div className="rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3 text-sm text-po-text-muted">
          No known pet found for this code. Ask the owner for a HealthShareCode or continue with guest intake.
        </div>
      ) : null}
    </section>
  )
}
