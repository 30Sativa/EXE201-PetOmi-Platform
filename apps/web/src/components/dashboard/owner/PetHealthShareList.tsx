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
  EmergencySummary: "Emergency summary",
  ClinicVisit: "Clinic visit",
  FullHealthProfile: "Full health profile",
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
      toast.success("Health share code revoked.")
    },
    onError: () => {
      toast.error("Could not revoke health share code.")
    },
  })

  const activeShares = (shares ?? []).filter(isShareActive)

  return (
    <>
      <DashboardSection
        title={`Health shares for ${petName}`}
        subtitle="Create short-lived codes for clinics to view this pet's health profile."
        action={
          <button
            type="button"
            onClick={onCreateShare}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-xs font-semibold text-white transition hover:bg-po-primary-hover"
          >
            <Plus className="size-3.5" />
            Create code
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
            title="No health share codes yet"
            description="Create a time-limited code when a clinic needs access to this pet's medical summary."
          />
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <ShareMetric label="Active codes" value={String(activeShares.length)} />
              <ShareMetric label="Total codes" value={String(shares.length)} />
              <ShareMetric
                label="Last used"
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
                          {active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-po-text-muted">
                        {scopeLabels[share.scope] ?? share.scope} · {share.accessMode} · expires {formatDateTime(share.expiresAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(share.displayCode, "Code copied.")}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
                      >
                        <Clipboard className="size-3.5" />
                        Code
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(getShareLink(share.displayCode), "Share link copied.")
                        }
                        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-border bg-white px-3 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text"
                      >
                        <Link2 className="size-3.5" />
                        Link
                      </button>
                      {active ? (
                        <button
                          type="button"
                          onClick={() => setRevoking(share)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-po-danger/30 bg-white px-3 text-xs font-semibold text-po-danger transition hover:bg-po-danger/10"
                        >
                          <Trash2 className="size-3.5" />
                          Revoke
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-po-text-muted">
                    <span>Used {share.usedCount}{share.maxUses ? `/${share.maxUses}` : ""}</span>
                    <span>Created {formatDateTime(share.createdAt)}</span>
                    {share.lastUsedAt ? (
                      <span>Last used {formatDateTime(share.lastUsedAt)}</span>
                    ) : null}
                    {share.note ? <span>Note: {share.note}</span> : null}
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
        title="Revoke health share code?"
        description="The clinic will no longer be able to use this code for private health access."
        confirmLabel="Revoke"
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
