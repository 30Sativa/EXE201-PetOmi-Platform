import { useState } from "react"
import { Link2, Plus, Trash2, UserPlus, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import Avatar from "@/components/ui/Avatar"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import {
  getPetsApi,
  getPetAccessApi,
  revokePetAccessApi,
  sharePetAccessApi,
} from "@/services/pets.service"
import type {
  PetResponse,
  PetUserAccessResponse,
} from "@/types"
import { cn } from "@/lib/utils"

const speciesEmoji: Record<string, string> = {
  Dog: "🐶",
  Cat: "🐱",
  default: "🐾",
}

const getSpeciesEmoji = (species: string) =>
  speciesEmoji[species] ?? speciesEmoji.default

export default function OwnerPetSharingPage() {
  const queryClient = useQueryClient()
  const [expandedPet, setExpandedPet] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<PetUserAccessResponse | null>(null)
  const [invitingPetId, setInvitingPetId] = useState<string | null>(null)

  const { data: pets, isLoading: loadingPets } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const revokeMutation = useMutation({
    mutationFn: ({ petId, accessId }: { petId: string; accessId: string }) =>
      revokePetAccessApi(petId, accessId),
    onSuccess: (_, { petId }) => {
      queryClient.invalidateQueries({ queryKey: ["pet-access", petId] })
      setRevoking(null)
    },
  })


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
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Thú cưng</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {(pets ?? []).length}
          </p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Quyền hạn</p>
          <p className="mt-2 text-sm font-bold text-po-text">
            Viewer · Editor
          </p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Mời người dùng</p>
          <button
            onClick={() => pets && pets.length > 0 && setInvitingPetId(pets[0].petId)}
            disabled={!pets || pets.length === 0}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
          >
            <UserPlus className="size-3" />
            Mời
          </button>
        </div>
      </div>

      {/* Sharing List */}
      <DashboardSection
        title="Quản lý chia sẻ"
        subtitle="Chọn thú cưng để xem và quản lý quyền truy cập."
      >
        {loadingPets ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !pets || pets.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Chưa có thú cưng nào"
            description="Hãy thêm thú cưng trước để có thể chia sẻ quyền truy cập."
          />
        ) : (
          <div className="grid gap-3">
            {pets.map((pet) => (
              <PetAccessCard
                key={pet.petId}
                pet={pet}
                isExpanded={expandedPet === pet.petId}
                onToggle={() =>
                  setExpandedPet(
                    expandedPet === pet.petId ? null : pet.petId,
                  )
                }
                onInvite={() => setInvitingPetId(pet.petId)}
                onRevoke={(access) => setRevoking(access)}
              />
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

      {/* Invite Modal */}
      {invitingPetId && (
        <InviteModal
          petId={invitingPetId}
          onClose={() => setInvitingPetId(null)}
        />
      )}

      {/* Revoke Dialog */}
      <ConfirmDialog
        isOpen={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) {
            revokeMutation.mutate({ petId: revoking.petId, accessId: revoking.petUserAccessId })
          }
        }}
        title="Thu hồi quyền truy cập?"
        description="Người dùng sẽ không còn có thể truy cập vào hồ sơ của thú cưng này."
        confirmLabel="Thu hồi"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </div>
  )
}

// ==================== PET ACCESS CARD ====================

function PetAccessCard({
  pet,
  isExpanded,
  onToggle,
  onInvite,
  onRevoke,
}: {
  pet: PetResponse
  isExpanded: boolean
  onToggle: () => void
  onInvite: () => void
  onRevoke: (access: PetUserAccessResponse) => void
}) {
  const { data: accessList, isLoading } = useQuery({
    queryKey: ["pet-access", pet.petId],
    queryFn: () => getPetAccessApi(pet.petId),
    enabled: isExpanded,
  })

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

  return (
    <div className="overflow-hidden rounded-2xl border border-po-border bg-white transition">
      {/* Pet Header */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-4 transition hover:bg-po-surface-muted"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
          <div>
            <p className="font-bold text-po-text">{pet.name}</p>
            <p className="text-xs text-po-text-muted">
              {(accessList ?? []).length} người được chia sẻ
            </p>
          </div>
        </div>
        <button className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text">
          <Plus
            className={cn("size-3 transition", isExpanded && "rotate-45")}
          />
          Chia sẻ
        </button>
      </div>

      {/* Access List */}
      {isExpanded && (
        <div className="border-t border-po-border bg-po-surface-muted px-4 py-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : !accessList || accessList.length === 0 ? (
            <div className="py-3 text-center">
              <p className="text-sm text-po-text-muted">
                Chưa có ai được chia sẻ quyền truy cập.
              </p>
              <button
                onClick={onInvite}
                className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
              >
                <UserPlus className="size-3" />
                Mời người dùng
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              {accessList.map((access) => (
                <div
                  key={access.petUserAccessId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      fallback={access.userId.slice(0, 2).toUpperCase()}
                      size="sm"
                      alt={access.userId}
                    />
                    <div>
                      <p className="text-sm font-semibold text-po-text">
                        {access.userId}
                      </p>
                      <p className="text-xs text-po-text-muted">
                        {access.accessRole} · Hết hạn: {formatExpiry(access.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {access.isExpired ? (
                      <span className="rounded-full bg-po-danger-soft px-2.5 py-0.5 text-xs font-semibold text-po-danger">
                        Đã hết hạn
                      </span>
                    ) : (
                      <span className="rounded-full bg-po-success-soft px-2.5 py-0.5 text-xs font-semibold text-po-success">
                        Hoạt động
                      </span>
                    )}
                    {!access.isExpired && (
                      <button
                        onClick={() => onRevoke(access)}
                        className="grid size-8 place-items-center rounded-full text-po-danger transition hover:bg-po-danger-soft"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={onInvite}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-po-border py-2 text-xs font-semibold text-po-text-muted transition hover:border-po-primary hover:text-po-primary"
              >
                <Plus className="size-3" />
                Thêm người dùng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== INVITE MODAL ====================

function InviteModal({
  petId,
  onClose,
}: {
  petId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Viewer")
  const [expiry, setExpiry] = useState("")

  const mutation = useMutation({
    mutationFn: (data: { userEmail: string; accessRole: string; expiresAt?: string }) =>
      sharePetAccessApi(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-access", petId] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    mutation.mutate({
      userEmail: email.trim(),
      accessRole: role,
      expiresAt: expiry || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 animate-dialog-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="m-auto w-[min(480px,100%)] rounded-[28px] border border-po-border bg-white p-6 shadow-2xl shadow-black/20 animate-dialog-content-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-po-text">
              Mời người dùng
            </h3>
            <p className="mt-1 text-sm text-po-text-muted">
              Chia sẻ quyền truy cập với người khác.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="shrink-0 rounded-full p-1 text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text disabled:opacity-40"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">
              Email người được mời <span className="text-po-danger">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: nguyenvana@gmail.com"
              required
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text placeholder:text-po-text-subtle focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-po-text">Quyền hạn</label>
            <div className="flex gap-2">
              {["Viewer", "Editor"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  disabled={mutation.isPending}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-xl border py-2.5 text-sm font-semibold transition",
                    role === r
                      ? "border-po-primary bg-po-primary/10 text-po-primary"
                      : "border-po-border bg-white text-po-text-muted hover:border-po-border-strong",
                    mutation.isPending && "opacity-60",
                  )}
                >
                  {r === "Viewer" ? "👁 Viewer" : "✏️ Editor"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="invite-expiry" className="text-sm font-semibold text-po-text">
              Ngày hết hạn (tùy chọn)
            </label>
            <input
              id="invite-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              disabled={mutation.isPending}
              className="h-11 w-full rounded-xl border border-po-border bg-white px-4 text-sm text-po-text focus:border-po-primary focus:outline-none focus:ring-2 focus:ring-po-primary/20 disabled:opacity-60"
            />
          </div>

          {mutation.error && (
            <div className="rounded-xl border border-po-danger/30 bg-po-danger/10 px-4 py-3 text-sm text-po-danger">
              Đã xảy ra lỗi. Vui lòng kiểm tra lại email.
            </div>
          )}

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="inline-flex h-11 items-center rounded-full border border-po-border bg-white px-6 text-sm font-semibold text-po-text-muted transition hover:bg-po-surface-muted disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !email.trim()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-6 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-60"
            >
          {mutation.isPending ? "Đang xử lý..." : "Mời chia sẻ"}
          </button>
        </div>
        </form>
      </div>
    </div>
  )
}
