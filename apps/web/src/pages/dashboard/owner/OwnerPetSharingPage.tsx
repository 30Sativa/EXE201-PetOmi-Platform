import { useState } from "react"
import { Link2, Plus, Trash2, UserPlus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import Avatar from "@/components/ui/Avatar"
import { getPetsApi } from "@/services/pets.service"
import { cn } from "@/lib/utils"

// Mock shared access data — backend chưa expose public API for this
const mockSharedAccess = [
  {
    petId: "pet-1",
    petName: "Mochi",
    petSpecies: "Dog",
    shares: [
      {
        accessId: "a1",
        email: "family@petomi.vn",
        role: "Viewer",
        isExpired: false,
        expiresAt: "2026-12-31",
      },
      {
        accessId: "a2",
        email: "vet@petomi.vn",
        role: "Editor",
        isExpired: false,
        expiresAt: null,
      },
    ],
  },
  {
    petId: "pet-2",
    petName: "Bim",
    petSpecies: "Cat",
    shares: [
      {
        accessId: "a3",
        email: "friend@petomi.vn",
        role: "Viewer",
        isExpired: false,
        expiresAt: "2026-06-30",
      },
    ],
  },
]

export default function OwnerPetSharingPage() {
  const [expandedPet, setExpandedPet] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: _pets, isLoading } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const getSpeciesEmoji = (species: string) => {
    const map: Record<string, string> = {
      Dog: "🐶",
      Cat: "🐱",
      Bird: "🐦",
      Fish: "🐟",
      default: "🐾",
    }
    return map[species] ?? map.default
  }

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return "Không hết hạn"
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const totalShares = mockSharedAccess.reduce(
    (sum, p) => sum + p.shares.length,
    0,
  )

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Chia sẻ thú cưng</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Chia sẻ quyền truy cập hồ sơ thú cưng với thành viên gia đình hoặc bác sĩ thú y.
          </p>
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
          <UserPlus className="size-4" />
          Mời người dùng
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Thú cưng được chia sẻ</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {mockSharedAccess.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Người được chia sẻ</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">{totalShares}</p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Quyền hạn</p>
          <p className="mt-2 text-sm font-semibold text-po-text">
            Viewer · Editor
          </p>
        </div>
      </div>

      {/* Sharing List */}
      <DashboardSection
        title="Quản lý chia sẻ"
        subtitle="Chọn thú cưng để xem và quản lý quyền truy cập."
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : mockSharedAccess.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Chưa có ai được chia sẻ quyền truy cập"
            description="Mời thành viên gia đình hoặc bác sĩ thú y để cùng theo dõi hồ sơ thú cưng."
            action={
              <button className="inline-flex h-10 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
                <UserPlus className="size-4" />
                Mời người dùng
              </button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {mockSharedAccess.map((pet) => (
              <div
                key={pet.petId}
                className="overflow-hidden rounded-2xl border border-po-border bg-white transition"
              >
                {/* Pet Header */}
                <div
                  onClick={() =>
                    setExpandedPet(expandedPet === pet.petId ? null : pet.petId)
                  }
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 transition hover:bg-po-surface-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSpeciesEmoji(pet.petSpecies)}</span>
                    <div>
                      <p className="font-bold text-po-text">{pet.petName}</p>
                      <p className="text-xs text-po-text-muted">
                        {pet.shares.length} người được chia sẻ
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text">
                    <Plus
                      className={cn(
                        "size-3 transition",
                        expandedPet === pet.petId && "rotate-45",
                      )}
                    />
                    Chia sẻ
                  </button>
                </div>

                {/* Access List */}
                {expandedPet === pet.petId && (
                  <div className="border-t border-po-border bg-po-surface-muted px-4 py-3">
                    {pet.shares.map((share) => (
                      <div
                        key={share.accessId}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={null}
                            alt={share.email}
                            fallback={share.email.slice(0, 2).toUpperCase()}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-semibold text-po-text">
                              {share.email}
                            </p>
                            <p className="text-xs text-po-text-muted">
                              {share.role} · Hết hạn: {formatExpiry(share.expiresAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {share.isExpired ? (
                            <span className="rounded-full bg-po-danger-soft px-2.5 py-0.5 text-xs font-semibold text-po-danger">
                              Đã hết hạn
                            </span>
                          ) : (
                            <span className="rounded-full bg-po-success-soft px-2.5 py-0.5 text-xs font-semibold text-po-success">
                              Hoạt động
                            </span>
                          )}
                          <button className="grid size-8 place-items-center rounded-full text-po-danger transition hover:bg-po-danger-soft">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-po-border py-2 text-xs font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-primary">
                      <Plus className="size-3" />
                      Thêm người dùng
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Info */}
      <div className="rounded-2xl border border-po-border bg-po-surface-muted p-4">
        <p className="text-sm font-semibold text-po-text">Về quyền truy cập</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-po-border bg-white p-3">
            <p className="text-sm font-bold text-po-text">👁 Viewer</p>
            <p className="mt-1 text-xs text-po-text-muted">
              Chỉ xem hồ sơ, lịch hẹn và lịch sử khám của thú cưng.
            </p>
          </div>
          <div className="rounded-xl border border-po-border bg-white p-3">
            <p className="text-sm font-bold text-po-text">✏️ Editor</p>
            <p className="mt-1 text-xs text-po-text-muted">
              Xem và cập nhật hồ sơ sức khỏe, ghi nhận cân nặng.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
