import { useState } from "react"
import { MessageSquare, Star, Plus } from "lucide-react"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"

// Mock reviews — backend chưa có owner review endpoint riêng
const mockReviews = [
  {
    clinicId: "1",
    clinicName: "PetOmi Clinic Q2",
    clinicAvatar: null,
    rating: 5.0,
    comment: "Bác sĩ tư vấn rất kỹ, quy trình nhanh chóng. Thú cưng được chăm sóc tốt.",
    date: "2026-05-02",
    appointmentType: "Khám da liễu",
  },
  {
    clinicId: "2",
    clinicName: "Happy Vet Center",
    clinicAvatar: null,
    rating: 4.7,
    comment: "Nhắc lịch rất chu đáo, khu vực chờ sạch sẽ và thoải mái.",
    date: "2026-03-12",
    appointmentType: "Tiêm phòng",
  },
  {
    clinicId: "3",
    clinicName: "Sunrise Vet Clinic",
    clinicAvatar: null,
    rating: 4.5,
    comment: "Bác sĩ nhiệt tình, giá hợp lý. Sẽ quay lại lần sau.",
    date: "2026-02-28",
    appointmentType: "Kiểm tra tổng quát",
  },
  {
    clinicId: "4",
    clinicName: "PetOmi Clinic Q2",
    clinicAvatar: null,
    rating: 4.8,
    comment: "Dịch vụ rất chuyên nghiệp. Hệ thống đặt lịch trực tuyến tiện lợi.",
    date: "2026-01-15",
    appointmentType: "Tẩy giun",
  },
]

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star
        const halfFilled = !filled && rating >= star - 0.5
        return (
          <span key={star} className="text-base">
            {filled ? (
              <Star className="size-4 fill-po-warning text-po-warning" />
            ) : halfFilled ? (
              <Star className="size-4 fill-po-warning/50 text-po-warning" />
            ) : (
              <Star className="size-4 text-po-border-strong" />
            )}
          </span>
        )
      })}
    </div>
  )
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

export default function OwnerReviewsPage() {
  const [search, setSearch] = useState("")

  const filtered = mockReviews.filter(
    (r) =>
      search === "" ||
      r.clinicName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()),
  )

  const avgRating =
    mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-po-text">Đánh giá của tôi</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Xem và quản lý các đánh giá bạn đã gửi cho phòng khám.
          </p>
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-po-primary px-5 text-sm font-semibold text-white transition hover:bg-po-primary-hover">
          <Plus className="size-4" />
          Viết đánh giá
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Đánh giá đã gửi</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {mockReviews.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Điểm trung bình</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-extrabold text-po-text">
              {avgRating.toFixed(1)}
            </p>
            <Star className="size-5 fill-po-warning text-po-warning" />
          </div>
        </div>
        <div className="rounded-[24px] border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Phòng khám đã đánh giá</p>
          <p className="mt-2 text-2xl font-extrabold text-po-text">
            {new Set(mockReviews.map((r) => r.clinicId)).size}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Tìm kiếm đánh giá..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-full border border-po-border bg-white px-4 pl-10 text-sm"
        />
        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-po-text-subtle" />
      </div>

      {/* Review List */}
      <DashboardSection title={`${filtered.length} đánh giá`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Không tìm thấy đánh giá nào"
            description="Thử tìm kiếm với từ khóa khác."
          />
        ) : (
          <div className="grid gap-4">
            {filtered.map((review) => (
              <div
                key={`${review.clinicId}-${review.date}`}
                className="rounded-2xl border border-po-border bg-white p-4 transition hover:border-po-border-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-po-text">{review.clinicName}</p>
                    <p className="mt-0.5 text-xs text-po-text-muted">
                      {review.appointmentType} · {formatDate(review.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-po-warning">
                      {review.rating.toFixed(1)}
                    </span>
                    {renderStars(review.rating)}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-po-text-muted">{review.comment}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-full border border-po-border px-3 py-1 text-xs font-semibold text-po-text-muted transition hover:bg-po-surface-muted hover:text-po-text">
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  )
}
