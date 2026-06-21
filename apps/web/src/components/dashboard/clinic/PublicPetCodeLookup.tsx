import { useEffect, useState } from "react"
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
  initialCode?: string
  onOverviewLoaded: (overview: PetHealthOverviewResponse) => void
}

export default function PublicPetCodeLookup({
  clinicId,
  initialCode = "",
  onOverviewLoaded,
}: PublicPetCodeLookupProps) {
  const [code, setCode] = useState(initialCode)
  const [matches, setMatches] = useState<ClinicPetSearchItemResponse[]>([])
  const [errorMessage, setErrorMessage] = useState("")

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
          "Đã nhận diện thú cưng, nhưng hồ sơ sức khỏe riêng tư cần chủ nuôi cấp quyền sức khỏe trong app hoặc cần quan hệ phòng khám hợp lệ.",
        ),
      )
    },
  })

  const lookupMutation = useMutation({
    mutationFn: ({ search }: { search: string; autoOpen: boolean }) =>
      searchClinicPetsApi(clinicId, { search, limit: 10 }),
    onSuccess: (items, variables) => {
      setMatches(items)
      setErrorMessage("")
      if (variables.autoOpen && items.length === 1) {
        overviewMutation.mutate(items[0].petId)
      }
    },
    onError: (error) => {
      setMatches([])
      setErrorMessage(getErrorMessage(error, "Không thể tra cứu PetOmi ID này."))
    },
  })

  useEffect(() => {
    const normalizedCode = initialCode.trim().toUpperCase()
    if (!normalizedCode || !clinicId) return

    setCode(normalizedCode)
    lookupMutation.mutate({ search: normalizedCode, autoOpen: true })
    // Chạy khi scanner hoặc URL đưa vào PetOmi ID mới.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, initialCode])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) return
    lookupMutation.mutate({ search: normalizedCode, autoOpen: false })
  }

  return (
    <section className="grid gap-4 rounded-[24px] border border-po-border bg-white p-5 shadow-sm shadow-orange-200/15">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
          <IdCard className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold text-po-text">Tra cứu PetOmi ID</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Dùng PetOmi ID từ QR hộ chiếu để nhận diện thú cưng. Hồ sơ sức khỏe riêng tư chỉ mở khi chủ nuôi đã cấp quyền hoặc phòng khám có quan hệ hợp lệ.
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
                    {[pet.publicPetCode, pet.species, pet.breed, pet.ownerFullName ?? pet.ownerEmail].filter(Boolean).join(" · ")}
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
                Mở tổng quan phòng khám
              </button>
            </div>
          ))}
        </div>
      ) : lookupMutation.isSuccess ? (
        <div className="rounded-2xl border border-po-border bg-po-surface-muted px-4 py-3 text-sm text-po-text-muted">
          Không tìm thấy thú cưng nào với mã này. Hãy kiểm tra lại PetOmi ID trên hộ chiếu hoặc tiếp tục tiếp nhận khách.
        </div>
      ) : null}
    </section>
  )
}
