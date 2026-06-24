import { useQuery } from "@tanstack/react-query"
import { Crown, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { getChatSubscriptionStatusApi } from "@/services/chat-subscription.service"

/**
 * Banner "Abandoned Upgrade": hien khi user dang dung goi Free da HET quota luot nhan
 * AI thang nay nhung CHUA nang cap Premium.
 *
 * Yeu cau nghiep vu:
 *  - Moi lan dang nhap nhac lai 1 lan (du user da tat nhac o cai dat).
 *  - Trong cung 1 phien (sau khi bam "de sau"), khong hien lai de tranh phien.
 *
 * Cach lam "1 lan / login": dung sessionStorage (xoa khi dong tab / dang xuat lam moi phien),
 * key gan voi userId. Khi user dang nhap lai -> phien moi -> banner hien lai.
 */

function dismissKey(userId: string | undefined) {
  return `petomi.abandonedUpgrade.dismissed.${userId ?? "anon"}`
}

export default function AbandonedUpgradeBanner() {
  const { user, isAuthenticated } = useAuth()
  const { notifications } = useNotifications()
  const [dismissed, setDismissed] = useState(false)

  // In-app pop-up (SignalR): khi background job day reminder AbandonedUpgrade real-time,
  // no chay vao notifications -> hien toast 1 lan.
  const toastedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const n of notifications) {
      const rt = (n.data?.reminderType as string | undefined) ?? ""
      if (rt !== "AbandonedUpgrade") continue
      if (toastedRef.current.has(n.id)) continue
      toastedRef.current.add(n.id)
      toast(n.title || "Bạn đã bỏ dở nâng cấp Premium", {
        description: n.message,
        action: {
          label: "Nâng cấp",
          onClick: () => {
            window.location.href = "/dashboard/owner/ai-plan"
          },
        },
      })
    }
  }, [notifications])

  // Doc trang thai "da bo qua trong phien nay".
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(dismissKey(user?.id))
      setDismissed(v === "1")
    } catch {
      setDismissed(false)
    }
  }, [user?.id])

  const { data: status } = useQuery({
    queryKey: ["owner-chat-subscription", "account"],
    queryFn: () => getChatSubscriptionStatusApi(null),
    enabled: isAuthenticated,
    staleTime: 60_000,
  })

  const shouldShow = useMemo(() => {
    if (!status) return false
    const remaining = status.usage?.remainingMessages ?? 0
    return !status.isPremium && remaining <= 0
  }, [status])

  if (!shouldShow || dismissed) return null

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(dismissKey(user?.id), "1")
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-[24px] border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 shadow-sm shadow-orange-200/30 ring-1 ring-amber-100"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Crown className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-po-text">
          Bạn đã bỏ dở nâng cấp Premium
        </p>
        <p className="mt-0.5 text-xs font-medium text-po-text-muted">
          {status?.blockReason ||
            "Bạn đã dùng hết lượt trò chuyện miễn phí với PetOmi AI tháng này. Nâng cấp Premium để tiếp tục tư vấn không giới hạn."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/dashboard/owner/ai-plan"
          className="inline-flex h-9 items-center gap-2 rounded-full bg-po-primary px-4 text-sm font-semibold text-white shadow-sm shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover"
        >
          Tiếp tục ngay
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Để sau"
          className="inline-flex size-9 items-center justify-center rounded-full text-po-text-subtle transition hover:bg-white/70 hover:text-po-text"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
