import { useEffect, useState } from "react"
import { PencilLine, Plus, PawPrint, Search, Trash2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PetModal from "@/components/dashboard/owner/PetModal"
import Avatar from "@/components/ui/Avatar"
import { useQuery } from "@tanstack/react-query"
import { getPetsApi, deletePetApi } from "@/services/pets.service"
import { cn } from "@/lib/utils"
import type { PetResponse } from "@/types"

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

const speciesLabels: Record<string, string> = {
  Dog: "Chó",
  Cat: "Mèo",
  Bird: "Chim",
  Fish: "Cá",
  Rabbit: "Thỏ",
  Hamster: "Hamster",
}

const formatSpecies = (species: string) => speciesLabels[species] ?? species

export default function OwnerPetsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [selectedSpecies, setSelectedSpecies] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPet, setEditingPet] = useState<PetResponse | null>(null)
  const [deletingPet, setDeletingPet] = useState<PetResponse | null>(null)

  const queryClient = useQueryClient()

  // Mở thẳng form thêm thú cưng khi vào với ?add=1 (vd: từ nút trên Tổng quan)
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setEditingPet(null)
      setIsModalOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete("add")
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data: pets, isLoading, error } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const deleteMutation = useMutation({
    mutationFn: (petId: string) => deletePetApi(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pets"] })
      setDeletingPet(null)
    },
  })

  const speciesOptions = [
    { value: "all", label: "Tất cả" },
    ...[
      ...new Set((pets ?? []).map((p) => p.species)),
    ].map((s) => ({
      value: s,
      label: s === "Dog" ? "Chó" : s === "Cat" ? "Mèo" : s,
    })),
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

  const handleAddPet = () => {
    setEditingPet(null)
    setIsModalOpen(true)
  }

  const handleEditPet = (pet: PetResponse) => {
    setEditingPet(pet)
    setIsModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (deletingPet) {
      deleteMutation.mutate(deletingPet.petId)
    }
  }

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
        <button
          onClick={handleAddPet}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
        >
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
                <button
                  onClick={handleAddPet}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover"
                >
                  <Plus className="size-4" />
                  Thêm thú cưng
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((pet) => (
              <PetCard
                key={pet.petId}
                pet={pet}
                onEdit={handleEditPet}
                onDelete={setDeletingPet}
                onView={() => navigate(`/dashboard/owner/pets/${pet.petId}`)}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Pet Create/Edit Modal */}
      <PetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pet={editingPet}
        onSuccess={(msg) => toast.success(msg)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingPet)}
        onClose={() => setDeletingPet(null)}
        onConfirm={handleDeleteConfirm}
        title={`Xóa ${deletingPet?.name ?? "thú cưng"}?`}
        description="Hồ sơ thú cưng sẽ bị xóa mềm và có thể khôi phục sau. Các lịch hẹn liên quan sẽ được giữ lại."
        confirmLabel="Xóa"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function PetCard({
  pet,
  onEdit,
  onDelete,
  onView,
}: {
  pet: PetResponse
  onEdit: (pet: PetResponse) => void
  onDelete: (pet: PetResponse) => void
  onView: () => void
}) {
  const age = formatAge(pet.dateOfBirth)
  const speciesLabel = formatSpecies(pet.species)

  return (
    <article className="group overflow-hidden rounded-[26px] bg-white shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-200/25">
      <div
        className="relative h-32 cursor-pointer bg-po-surface-muted"
        onClick={onView}
      >
        <div className="absolute inset-0 overflow-hidden">
          {pet.avatarUrl ? (
            <>
              <img
                src={pet.avatarUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-sm"
              />
              <img
                src={pet.avatarUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-75"
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,_rgba(245,158,11,0.26),_transparent_32%),linear-gradient(135deg,_#fff7ed,_#fff1e6)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,247,237,0.02),_rgba(255,247,237,0.72))]" />
        </div>

        <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(pet)
            }}
            className="grid size-9 place-items-center rounded-full bg-white/92 text-po-text shadow-sm ring-1 ring-po-border/80 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
            aria-label={`Sửa ${pet.name}`}
          >
            <PencilLine className="size-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(pet)
            }}
            className="grid size-9 place-items-center rounded-full bg-white/92 text-po-danger shadow-sm ring-1 ring-po-danger/15 backdrop-blur transition hover:-translate-y-0.5 hover:bg-po-danger-soft"
            aria-label={`Xóa ${pet.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onView}
          className="absolute bottom-0 left-4 z-10 translate-y-1/2 rounded-full text-left"
          aria-label={`Mở hồ sơ ${pet.name}`}
        >
          <Avatar
            src={pet.avatarUrl}
            alt={pet.name}
            size="xl"
            className="size-20 border-4 border-white bg-white shadow-lg shadow-orange-200/30 ring-1 ring-po-border/80"
          />
        </button>
      </div>

      <div className="cursor-pointer px-4 pb-4 pt-12" onClick={onView}>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight text-po-text">{pet.name}</p>
          <p className="mt-1 truncate text-sm text-po-text-muted">
            {speciesLabel}
            {pet.breed ? ` · ${pet.breed}` : ""}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-po-primary-soft/80 px-3 py-1 text-xs font-semibold text-po-primary">
            {speciesLabel}
          </span>
          {pet.color ? (
            <span className="rounded-full bg-po-surface-muted px-3 py-1 text-xs font-medium text-po-text-muted">
              {pet.color}
            </span>
          ) : null}
          {pet.gender && (
            <span className="rounded-full bg-po-surface-muted px-3 py-1 text-xs font-medium text-po-text-muted">
              {pet.gender === "Male" ? "Đực" : pet.gender === "Female" ? "Cái" : pet.gender}
            </span>
          )}
          {age && (
            <span className="rounded-full bg-po-surface-muted px-3 py-1 text-xs font-medium text-po-text-muted">
              {age}
            </span>
          )}
          {pet.isBirthDateEstimated && (
            <span className="rounded-full bg-po-warning-soft px-3 py-1 text-xs font-medium text-po-warning">
              Tuổi ước lượng
            </span>
          )}
          {pet.isNeutered && (
            <span className="rounded-full bg-po-success-soft px-3 py-1 text-xs font-medium text-po-success">
              {pet.isNeutered === "Yes" ? "Đã triệt sản" : "Chưa triệt sản"}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
