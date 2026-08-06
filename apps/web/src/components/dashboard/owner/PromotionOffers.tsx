import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, Gift, Loader2, Percent, Sparkles, Users } from "lucide-react"
import { toast } from "sonner"

import {
  activateTrialApi,
  getPromotionOffersApi,
  getReferralInfoApi,
} from "@/services/promotion.service"
import { getApiErrorMessage } from "@/services/api-response"

export default function PromotionOffers() {
  const queryClient = useQueryClient()

  const { data: offers } = useQuery({
    queryKey: ["promotion-offers"],
    queryFn: getPromotionOffersApi,
    staleTime: 60_000,
  })

  const { data: referral } = useQuery({
    queryKey: ["referral-info"],
    queryFn: getReferralInfoApi,
    staleTime: 60_000,
  })

  const trialMutation = useMutation({
    mutationFn: activateTrialApi,
    onSuccess: (res) => {
      toast.success(`Đã kích hoạt dùng thử Premium ${res.trialDays} ngày!`)
      queryClient.invalidateQueries({ queryKey: ["promotion-offers"] })
      queryClient.invalidateQueries({ queryKey: ["owner-chat-subscription"] })
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể kích hoạt dùng thử, vui lòng thử lại sau.",
        ),
      )
    },
  })

  if (!offers) return null

  const anyOffer =
    offers.trialEligible ||
    (offers.earlyBirdEnabled && offers.earlyBirdEligible) ||
    offers.referralEnabled
  if (!anyOffer) return null

  const copyCode = async () => {
    const code = referral?.referralCode || offers.referralCode
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Đã sao chép mã giới thiệu")
    } catch {
      toast.error("Không sao chép được, vui lòng copy thủ công")
    }
  }

  return (
    <section className="rounded-2xl bg-white px-4 py-3.5 ring-1 ring-po-border/80">
      <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-center">
        <div className="flex items-center gap-3 border-b border-po-border/70 pb-3 lg:border-r lg:border-b-0 lg:pb-0 lg:pr-4">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-po-text">Ưu đãi của bạn</h2>
            <p className="mt-0.5 text-xs text-po-text-muted">Quyền lợi đang áp dụng</p>
          </div>
        </div>

        <div
          className="grid gap-x-6 gap-y-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" }}
        >
          {/* Free trial */}
          {offers.trialEligible ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Gift className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-po-text">
                  Dùng thử Premium {offers.trialDays} ngày
                </p>
                <p className="mt-0.5 truncate text-xs text-po-text-muted">
                  Không cần thanh toán
                </p>
              </div>
              <button
                type="button"
                disabled={trialMutation.isPending}
                onClick={() => trialMutation.mutate()}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full bg-po-primary px-3 text-xs font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-50"
              >
                {trialMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Dùng thử
              </button>
            </div>
          ) : null}

          {/* Early-bird discount */}
          {offers.earlyBirdEnabled ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Percent className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-po-text">
                  Giảm {offers.earlyBirdDiscountPercent}% cho Early Users
                </p>
                <p className="mt-0.5 truncate text-xs text-po-text-muted">
                  Áp dụng trong {offers.earlyBirdCycles} kỳ đầu
                </p>
              </div>
              <span
                className={`inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[11px] font-semibold ${
                  offers.earlyBirdEligible
                    ? "bg-amber-100 text-amber-700"
                    : "bg-po-surface-muted text-po-text-subtle"
                }`}
              >
                {offers.earlyBirdEligible ? "Đủ điều kiện" : "Đã kết thúc"}
              </span>
            </div>
          ) : null}

          {/* Referral */}
          {offers.referralEnabled ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Users className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-po-text">Giới thiệu bạn bè</p>
                <p className="mt-0.5 truncate text-xs text-po-text-muted">
                  {referral?.successfulReferrals
                    ? `${referral.successfulReferrals} lượt giới thiệu thành công`
                    : "Nhận thêm mức sử dụng AI"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <code className="max-w-24 truncate rounded-full bg-po-surface-muted px-2.5 py-1.5 text-xs font-bold text-po-text">
                  {referral?.referralCode || offers.referralCode}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  aria-label="Sao chép mã giới thiệu"
                  title="Sao chép mã giới thiệu"
                  className="inline-flex size-8 items-center justify-center rounded-full bg-po-primary text-white transition hover:bg-po-primary-hover"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
