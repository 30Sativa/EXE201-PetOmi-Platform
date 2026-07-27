import { useState } from "react"
import { Clipboard, Link2, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import ConfirmDialog from "@/components/ui/ConfirmDialog"
import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import {
  getPetHealthSharesApi,
  revokePetHealthShareApi,
} from "@/services/pet-health-share.service"
import type { PetHealthShareResponse } from "@/types"
import { cn } from "@/lib/utils"

interface PetHealthShareListProps {
  petId: string
  petName: string
  onCreateShare: () => void
}

const scopeLabels: Record<string, string> = {
  EmergencySummary: "Tóm tắt khẩn cấp",
  ClinicVisit: "Lần khám tại phòng khám",
  FullHealthProfile: "Toàn bộ hồ sơ sức khỏe",
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

const isShareActive = (share: PetHealthShareResponse) =>
  !share.isExpired && !share.isRevoked && !share.hasReachedMaxUses

const getShareLink = (code: string) => {
  const origin = typeof window === "undefined" ? "" : window.location.origin
  return `${origin}/dashboard/clinic/pet-intake?shareCode=${encodeURIComponent(code)}`
}

const copyText = async (text: string, successMessage: string) => {
  await navigator.clipboard.writeText(text)
  toast.success(successMessage)
}

export default function PetHealthShareList({
  petId,
  petName,
  onCreateShare,
}: PetHealthShareListProps) {
  const queryClient = useQueryClient()
  const [revoking, setRevoking] = useState<PetHealthShareResponse | null>(null)

  const { data: shares, isLoading } = useQuery({
    queryKey: ["pet-health-shares", petId],
    queryFn: () => getPetHealthSharesApi(petId),
  })

  const revokeMutation = useMutation({
    mutationFn: (shareTokenId: string) =>
      revokePetHealthShareApi(petId, shareTokenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pet-health-shares", petId] })
      setRevoking(null)
      toast.success("Đã thu hồi mã chia sẻ sức khỏe.")
    },
    onError: () => {
      toast.error("Không thể thu hồi mã chia sẻ sức khỏe.")
    },
  })

  const activeShares = (shares ?? []).filter(isShareActive)

  return (
    <>
      <DashboardSection
        title={`Mã chia sẻ sức khỏe của ${petName}`}
        subtitle="Tạo mã có thời hạn để phòng khám xem hồ sơ sức khỏe của bé."
        action={
          <button
            type="button"
            onClick={onCreateShare}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
          >
            <Plus className="size-3.5" />
            Tạo mã
          </button>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        ) : !shares || shares.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Chưa có mã chia sẻ sức khỏe"
            description="Tạo mã có thời hạn khi phòng khám cần xem thông tin y tế của bé."
          />
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <ShareMetric label="Mã đang hoạt động" value={String(activeShares.length)} />
              <ShareMetric label="Tổng số mã" value={String(shares.length)} />
              <ShareMetric
                label="Lần dùng gần nhất"
                value={formatDateTime(
                  shares.find((share) => share.lastUsedAt)?.lastUsedAt ?? null,
                )}
              />
            </div>

            {shares.map((share) => {
              const active = isShareActive(share)

              return (
                <div
                  key={share.shareTokenId}
                  className={cn(
                    "grid gap-3 rounded-2xl border px-4 py-3",
                    active
                      ? "border-po-border bg-white"
                      : "border-po-border bg-po-surface-muted opacity-75",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-lg font-extrabold tracking-wide text-po-text">
                          {share.displayCode}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            active
                              ? "bg-po-success-soft text-po-success"
                              : "bg-po-danger-soft text-po-danger",
                          )}
                        >
                          {active ? "Đang hoạt động" : "Không còn hiệu lực"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-po-text-muted">
                        {scopeLabels[share.scope] ?? share.scope} · {share.accessMode === "OneTime" ? "Dùng một lần" : "Có thời hạn"} · hết hạn {formatDateTime(share.expiresAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(share.displayCode, "Đã sao chép mã.")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
                      >
                        <Clipboard className="size-3.5" />
                        Mã
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(getShareLink(share.displayCode), "Đã sao chép liên kết.")
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
                      >
                        <Link2 className="size-3.5" />
                        Liên kết
                      </button>
                      {active ? (
                        <button
                          type="button"
                          onClick={() => setRevoking(share)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-danger/30 bg-white px-3 text-xs font-semibold text-po-danger transition hover:bg-po-danger/10"
                        >
                          <Trash2 className="size-3.5" />
                          Thu hồi
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-po-text-muted">
                    <span>Đã dùng {share.usedCount}{share.maxUses ? `/${share.maxUses}` : ""}</span>
                    <span>Tạo lúc {formatDateTime(share.createdAt)}</span>
                    {share.lastUsedAt ? (
                      <span>Dùng gần nhất {formatDateTime(share.lastUsedAt)}</span>
                    ) : null}
                    {share.note ? <span>Ghi chú: {share.note}</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardSection>

      <ConfirmDialog
        isOpen={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={() => {
          if (revoking) revokeMutation.mutate(revoking.shareTokenId)
        }}
        title="Thu hồi mã chia sẻ sức khỏe?"
        description="Phòng khám sẽ không thể dùng mã này để xem hồ sơ sức khỏe riêng tư nữa."
        confirmLabel="Thu hồi"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />
    </>
  )
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-po-border bg-po-surface-muted p-4">
      <p className="text-xs font-semibold text-po-text-muted">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-po-text">{value}</p>
    </div>
  )
}
