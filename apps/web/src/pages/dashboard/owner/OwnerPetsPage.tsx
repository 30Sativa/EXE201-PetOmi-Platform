import { useState } from "react"
import { Plus, PawPrint, Search } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import Avatar from "@/components/ui/Avatar"
import { useQuery } from "@tanstack/react-query"
import { getPetsApi } from "@/services/pets.service"
import { cn } from "@/lib/utils"
import type { PetResponse } from "@/types"

const speciesEmoji: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  Bird: "🐦",
  Fish: "🐟",
  Rabbit: "🐰",
  Hamster: "🐹",
  default: "🐾",
}

const getSpeciesEmoji = (species: string) =>
  speciesEmoji[species] ?? speciesEmoji.default

const formatAge = (dob: string | null) => {
  if (!dob) return null
  try {
    const birth = new Date(dob)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()
    const totalMonths = years * 12 + months
    if (totalMonths < 12) return `${totalMonths} tháng`
    const y = Math.floor(totalMonths / 12)
    return `${y} tuổi`
  } catch {
    return null
  }
}

export default function OwnerPetsPage() {
  const [search, setSearch] = useState("")
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all")

  const { data: pets, isLoading, error } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const speciesOptions = [
    { value: "all", label: "Tất cả" },
    ...[
      ...new Set((pets ?? []).map((p) => p.species)),
    ].map((s) => ({ value: s, label: s })),
  ]

  const filtered = (pets ?? []).filter((pet) => {
    const matchSearch =
      search === "" ||
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.species.toLowerCase().includes(search.toLowerCase()) ||
      (pet.breed ?? "").toLowerCase().includes(search.toLowerCase())
    const matchSpecies =
      selectedSpecies === "all" || pet.species === selectedSpecies
    return matchSearch && matchSpecies
  })

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Quản lý thú cưng</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Thêm, chỉnh sửa và theo dõi hồ sơ sức khỏe của thú cưng.
          </p>
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
          <Plus className="size-4" />
          Thêm thú cưng
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-po-text-subtle" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, loài, giống..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-po-border bg-white pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 rounded-full border border-po-border bg-po-surface-muted p-1">
          {speciesOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedSpecies(opt.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                selectedSpecies === opt.value
                  ? "bg-white text-po-primary shadow-sm"
                  : "text-po-text-muted hover:text-po-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pet List */}
      <DashboardSection title={`${filtered.length} thú cưng`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon={PawPrint}
            title="Không thể tải danh sách thú cưng"
            description="Đã xảy ra lỗi khi lấy dữ liệu. Vui lòng thử lại."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title={search ? "Không tìm thấy thú cưng nào" : "Chưa có thú cưng nào"}
            description={
              search
                ? "Thử tìm kiếm với từ khóa khác."
                : "Hãy thêm thú cưng đầu tiên của bạn để bắt đầu."
            }
            action={
              !search ? (
                <button className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
                  <Plus className="size-4" />
                  Thêm thú cưng
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pet) => (
              <PetCard key={pet.petId} pet={pet} />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}

function PetCard({ pet }: { pet: PetResponse }) {
  const age = formatAge(pet.dateOfBirth)

  return (
    <div className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-po-border bg-white transition hover:border-po-border-strong hover:shadow-md">
      {/* Avatar / Hero */}
      <div className="relative h-32 bg-gradient-to-br from-po-primary-soft to-po-surface-muted">
        {pet.avatarUrl ? (
          <img
            src={pet.avatarUrl}
            alt={pet.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl">{getSpeciesEmoji(pet.species)}</span>
          </div>
        )}
        {/* Edit button overlay */}
        <div className="absolute right-3 top-3 opacity-0 transition group-hover:opacity-100">
          <button className="grid size-8 place-items-center rounded-full bg-white/90 text-po-text shadow-sm backdrop-blur-sm hover:bg-white">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold text-po-text">{pet.name}</p>
            <p className="mt-0.5 text-xs text-po-text-muted">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
            </p>
          </div>
          <span className="shrink-0 text-2xl">{getSpeciesEmoji(pet.species)}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {pet.gender && (
            <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
              {pet.gender}
            </span>
          )}
          {age && (
            <span className="rounded-full bg-po-surface-muted px-2.5 py-0.5 text-xs font-medium text-po-text-muted">
              {age}
            </span>
          )}
          {pet.isBirthDateEstimated && (
            <span className="rounded-full bg-po-warning-soft px-2.5 py-0.5 text-xs font-medium text-po-warning">
              Tuổi ước lượng
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
