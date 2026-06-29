import { useMemo, useState } from "react"
import { Filter, MessageSquareText, Search, Star } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import AdminPageHeader from "@/components/dashboard/AdminPageHeader"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import { getAdminWebsiteFeedbacksApi } from "@/services/website-feedback.service"
import type { WebsiteFeedbackCategory } from "@/types"
import { cn } from "@/lib/utils"

const categories: Array<{ label: string; value: "all" | WebsiteFeedbackCategory }> = [
  { label: "Tat ca", value: "all" },
  { label: "Gop y chung", value: "General" },
  { label: "Bao loi", value: "Bug" },
  { label: "Tinh nang", value: "Feature" },
  { label: "UX", value: "UX" },
  { label: "Hieu nang", value: "Performance" },
]

const formatDate = (date: string) =>
  new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default function AdminWebsiteFeedbackPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<"all" | WebsiteFeedbackCategory>("all")
  const [page, setPage] = useState(1)
  const pageSize = 12

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-website-feedbacks", search, category, page, pageSize],
    queryFn: () =>
      getAdminWebsiteFeedbacksApi({
        search,
        category: category === "all" ? undefined : category,
        page,
        pageSize,
      }),
  })

  const items = data?.items ?? data?.Items ?? []
  const meta = data?.meta ?? data?.Meta

  const stats = useMemo(() => {
    const rated = items.filter((item) => item.rating != null)
    const average =
      rated.length === 0
        ? null
        : Math.round((rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length) * 10) / 10

    return {
      totalShown: items.length,
      totalRecords: meta?.totalRecords ?? items.length,
      average,
    }
  }, [items, meta?.totalRecords])

  return (
    <div className="grid gap-5 md:gap-6">
      <AdminPageHeader
        kicker="Product feedback"
        title="Feedback website"
        description="Theo doi gop y cua user ve loi, trai nghiem va tinh nang can cai thien tren PetOmi."
        icon={MessageSquareText}
        metrics={[
          { label: "Tong feedback", value: stats.totalRecords.toString(), icon: MessageSquareText },
          { label: "Dang hien thi", value: stats.totalShown.toString(), icon: Filter },
          { label: "Diem TB", value: stats.average?.toString() ?? "-", icon: Star },
        ]}
      />

      <section className="rounded-[28px] bg-white/92 p-4 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.6fr)_minmax(0,1fr)]">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Tim theo tieu de hoac noi dung..."
              className="h-11 w-full rounded-full border border-po-border bg-white px-4 pl-10 text-sm outline-none transition focus:border-po-primary focus:ring-2 focus:ring-po-primary-soft"
            />
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value)
                  setPage(1)
                }}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold transition",
                  category === item.value
                    ? "bg-po-primary text-white shadow-sm shadow-orange-200/40"
                    : "bg-po-surface-muted text-po-text-muted hover:text-po-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] bg-white/92 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={MessageSquareText}
              title="Chua co feedback"
              description="Khi user gui feedback website, danh sach se hien thi tai day."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-po-border/70 bg-po-surface-muted/50 text-[11px] uppercase tracking-[0.04em] text-po-text-subtle">
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-3 py-3 text-left font-semibold">Loai</th>
                  <th className="px-3 py-3 text-left font-semibold">Noi dung</th>
                  <th className="px-3 py-3 text-left font-semibold">Trang</th>
                  <th className="px-5 py-3 text-right font-semibold">Ngay gui</th>
                </tr>
              </thead>
              <tbody>
                {items.map((feedback) => (
                  <tr key={feedback.feedbackId} className="border-b border-po-border/50 last:border-b-0">
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-po-text">
                        {feedback.userFullName || "User"}
                      </p>
                      <p className="mt-1 text-xs text-po-text-muted">
                        {feedback.userEmail || feedback.userId}
                      </p>
                    </td>
                    <td className="px-3 py-4 align-top">
                      <span className="inline-flex rounded-full bg-po-primary-soft px-2.5 py-1 text-xs font-bold text-po-primary">
                        {feedback.category}
                      </span>
                      {feedback.rating ? (
                        <span className="mt-2 flex items-center gap-1 text-xs font-bold text-po-warning">
                          <Star className="size-3.5 fill-po-warning" />
                          {feedback.rating}/5
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[360px] px-3 py-4 align-top">
                      <p className="font-bold text-po-text">{feedback.subject}</p>
                      <p className="mt-1 line-clamp-3 text-sm leading-6 text-po-text-muted">
                        {feedback.message}
                      </p>
                      {feedback.browserInfo ? (
                        <p className="mt-2 line-clamp-1 text-[11px] text-po-text-subtle">
                          {feedback.browserInfo}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[220px] px-3 py-4 align-top">
                      {feedback.pageUrl ? (
                        <a
                          href={feedback.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-2 text-xs font-semibold text-po-primary hover:underline"
                        >
                          {feedback.pageUrl}
                        </a>
                      ) : (
                        <span className="text-xs text-po-text-subtle">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right align-top text-xs font-semibold text-po-text-muted">
                      {formatDate(feedback.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {meta ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-po-text-muted">
            Trang {meta.pageNumber} / {Math.max(meta.totalPages, 1)}
            {isFetching ? " - dang tai..." : ""}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta.hasPrevious}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-10 rounded-full bg-white px-4 text-sm font-bold text-po-text ring-1 ring-po-border transition hover:bg-po-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Truoc
            </button>
            <button
              type="button"
              disabled={!meta.hasNext}
              onClick={() => setPage((current) => current + 1)}
              className="h-10 rounded-full bg-po-primary px-4 text-sm font-bold text-white transition hover:bg-po-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
