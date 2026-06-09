import { useState } from "react"
import { Search, UsersRound } from "lucide-react"
import { useMutation, useQuery } from "@tanstack/react-query"

import Avatar from "@/components/ui/Avatar"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { formatDate } from "@/lib/format"
import { getErrorMessage } from "@/lib/utils"
import { searchClinicPetsApi } from "@/services/clinic.service"
import { getClinicPetHealthOverviewApi } from "@/services/pet-health-share.service"
import type { PetHealthOverviewResponse } from "@/types"

interface TraditionalPetLookupPanelProps {
  clinicId: string
  onOverviewLoaded: (overview: PetHealthOverviewResponse) => void
}

export default function TraditionalPetLookupPanel({
  clinicId,
  onOverviewLoaded,
}: TraditionalPetLookupPanelProps) {
  const [search, setSearch] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const petsQuery = useQuery({
    queryKey: ["clinic", clinicId, "pet-intake", "known-pets", debouncedSearch],
    queryFn: () =>
      searchClinicPetsApi(clinicId, {
        search: debouncedSearch || undefined,
        limit: 20,
      }),
    enabled: Boolean(clinicId),
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
        getErrorMessage(error, "Could not open this pet's clinic overview."),
      )
    },
  })

  const pets = petsQuery.data ?? []

  return (
    <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <UsersRound className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-po-text">Known pets</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Search pets that already have appointment history with this clinic.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-po-text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by pet, owner, email, phone, or internal ID"
          className="h-11 w-full rounded-xl border border-po-border bg-white pl-11 pr-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20"
        />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-po-danger/30 bg-po-danger/10 px-4 py-3 text-sm font-semibold text-po-danger">
          {errorMessage}
        </div>
      ) : null}

      {petsQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : pets.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No known pets found"
          description="Use a health share code or continue with guest intake if this is a new patient."
        />
      ) : (
        <div className="grid gap-3">
          {pets.map((pet) => (
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
                  <p className="mt-1 text-xs text-po-text-subtle">
                    Last appointment: {formatDate(pet.lastAppointmentDate)} · {pet.lastAppointmentStatus ?? "-"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => overviewMutation.mutate(pet.petId)}
                disabled={overviewMutation.isPending}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
              >
                {overviewMutation.isPending ? <LoadingSpinner size="sm" /> : null}
                Open overview
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
