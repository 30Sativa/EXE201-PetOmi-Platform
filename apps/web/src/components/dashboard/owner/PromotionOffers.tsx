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
    (offers.trialEnabled && !offers.trialAlreadyUsed) ||
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
    <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-1 ring-amber-100">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-amber-500" />
        <h2 className="text-lg font-extrabold text-po-text">Ưu đãi dành cho bạn</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Free trial */}
        {offers.trialEnabled ? (
          <div className="flex flex-col rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Gift className="size-4" />
            </span>
            <p className="mt-3 text-sm font-extrabold text-po-text">
              Dùng thử {offers.trialDays} ngày miễn phí
            </p>
            <p className="mt-1 flex-1 text-xs text-po-text-muted">
              Trải nghiệm đầy đủ Premium, không cần thanh toán.
            </p>
            <button
              type="button"
              disabled={offers.trialAlreadyUsed || trialMutation.isPending}
              onClick={() => trialMutation.mutate()}
              className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white transition hover:bg-po-primary-hover disabled:opacity-50"
            >
              {trialMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {offers.trialAlreadyUsed ? "Đã sử dụng" : "Dùng thử ngay"}
            </button>
          </div>
        ) : null}

        {/* Early-bird discount */}
        {offers.earlyBirdEnabled ? (
          <div className="flex flex-col rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Percent className="size-4" />
            </span>
            <p className="mt-3 text-sm font-extrabold text-po-text">
              Giảm {offers.earlyBirdDiscountPercent}% cho Early Users
            </p>
            <p className="mt-1 flex-1 text-xs text-po-text-muted">
              Áp dụng trong {offers.earlyBirdCycles} kỳ thanh toán đầu tiên.
            </p>
            <span
              className={`mt-3 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold ${
                offers.earlyBirdEligible
                  ? "bg-amber-100 text-amber-700"
                  : "bg-po-surface-muted text-po-text-subtle"
              }`}
            >
              {offers.earlyBirdEligible ? "Bạn đủ điều kiện" : "Đã hết ưu đãi"}
            </span>
          </div>
        ) : null}

        {/* Referral */}
        {offers.referralEnabled ? (
          <div className="flex flex-col rounded-2xl bg-white/80 p-4 ring-1 ring-amber-100">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Users className="size-4" />
            </span>
            <p className="mt-3 text-sm font-extrabold text-po-text">
              Giới thiệu bạn bè → +{offers.referralBonusMessages} lượt AI
            </p>
            <p className="mt-1 flex-1 text-xs text-po-text-muted">
              Mỗi bạn đăng ký bằng mã của bạn, bạn được cộng thêm lượt trò chuyện.
              {referral
                ? ` Đã giới thiệu: ${referral.successfulReferrals} • Tổng thưởng: +${referral.totalBonusMessages} lượt.`
                : ""}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 truncate rounded-full bg-po-surface-muted px-3 py-2 text-center text-sm font-bold tracking-wider text-po-text">
                {referral?.referralCode || offers.referralCode}
              </code>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Sao chép mã"
                className="inline-flex size-9 items-center justify-center rounded-full bg-po-primary text-white transition hover:bg-po-primary-hover"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
