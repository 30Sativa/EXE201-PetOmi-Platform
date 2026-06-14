import { useMemo, useState } from "react"
import { MessageSquare, Search, Star } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import DashboardSection from "@/components/dashboard/DashboardSection"
import EmptyState from "@/components/ui/EmptyState"
import { LoadingSpinner } from "@/components/ui/LoadingStates"
import StatusBadge from "@/components/ui/StatusBadge"
import ClinicReviewModal from "@/components/dashboard/owner/ClinicReviewModal"
import { cn } from "@/lib/utils"
import { getOwnerAppointmentsApi } from "@/services/appointments.service"
import { getPetsApi } from "@/services/pets.service"
import { getMyClinicReviewsApi } from "@/services/clinic-review.service"

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

type ReviewTarget = {
  clinicId: string
  appointmentId: string
  label: string
}

export default function OwnerReviewsPage() {
  const [search, setSearch] = useState("")
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)

  const { data: appointments, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ["owner-appointments"],
    queryFn: () => getOwnerAppointmentsApi(),
  })

  const { data: pets, isLoading: isPetsLoading } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const { data: myReviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["my-clinic-reviews"],
    queryFn: getMyClinicReviewsApi,
  })

  const getPetName = (petId: string) =>
    pets?.find((pet) => pet.petId === petId)?.name ?? "Không rõ"

  const reviewedClinicIds = useMemo(
    () => new Set((myReviews ?? []).map((review) => review.clinicId)),
    [myReviews],
  )

  const completedAppointments = (appointments ?? [])
    .filter((appointment) => appointment.status.toLowerCase() === "completed")
    .map((appointment) => ({
      ...appointment,
      petName: getPetName(appointment.petId),
    }))

  const filteredAppointments = completedAppointments.filter(
    (appointment) =>
      search === "" ||
      appointment.petName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.appointmentType.toLowerCase().includes(search.toLowerCase()),
  )

  const averageRating = useMemo(() => {
    if (!myReviews || myReviews.length === 0) return null
    const sum = myReviews.reduce((total, review) => total + review.rating, 0)
    return Math.round((sum / myReviews.length) * 10) / 10
  }, [myReviews])

  const isLoading = isAppointmentsLoading || isPetsLoading || isReviewsLoading

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-po-text">Đánh giá của tôi</h2>
          <p className="mt-1 text-sm text-po-text-muted">
            Đánh giá phòng khám sau khi lượt khám của bé đã hoàn tất.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Đánh giá đã gửi</p>
          <p className="mt-2 text-2xl font-bold text-po-text">{myReviews?.length ?? 0}</p>
        </div>
        <div className="rounded-3xl border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Điểm trung bình</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-po-text">{averageRating ?? "-"}</p>
            <Star
              className={cn(
                "size-5",
                averageRating ? "fill-po-warning text-po-warning" : "text-po-border-strong",
              )}
            />
          </div>
        </div>
        <div className="rounded-3xl border border-po-border bg-po-surface-muted p-4">
          <p className="text-sm font-semibold text-po-text-muted">Lượt khám đủ điều kiện</p>
          <p className="mt-2 text-2xl font-bold text-po-text">
            {completedAppointments.length}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Tìm kiếm lượt khám..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 w-full rounded-full border border-po-border bg-white px-4 pl-10 text-sm"
        />
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-po-text-subtle" />
      </div>

      <DashboardSection title={`${filteredAppointments.length} lượt khám`}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Chưa có lượt khám đủ điều kiện"
            description="Bạn có thể đánh giá sau khi lịch khám được hoàn tất."
          />
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => {
              const reviewed = reviewedClinicIds.has(appointment.clinicId)
              return (
                <div
                  key={appointment.appointmentId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-po-border bg-white p-4 transition hover:border-po-border-strong"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-po-text">{appointment.appointmentType}</p>
                    <p className="mt-0.5 text-xs text-po-text-muted">
                      {appointment.petName} · {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge variant="success" label="Đã khám" />
                    {reviewed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-po-success-soft px-3 py-1.5 text-xs font-bold text-po-success">
                        <Star className="size-3.5 fill-po-success" />
                        Đã đánh giá
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewTarget({
                            clinicId: appointment.clinicId,
                            appointmentId: appointment.appointmentId,
                            label: `${appointment.appointmentType} · ${appointment.petName} · ${formatDate(appointment.appointmentDate)}`,
                          })
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-po-primary px-4 text-xs font-bold text-white transition hover:bg-po-primary-hover"
                      >
                        <Star className="size-3.5" />
                        Đánh giá
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DashboardSection>

      {(myReviews?.length ?? 0) > 0 ? (
        <DashboardSection title="Đánh giá đã gửi">
          <div className="grid gap-3">
            {(myReviews ?? []).map((review) => (
              <div
                key={review.reviewId}
                className="rounded-2xl border border-po-border bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={cn(
                          "size-4",
                          value <= review.rating
                            ? "fill-po-warning text-po-warning"
                            : "text-po-border-strong",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-po-text-subtle">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-po-text">{review.reviewContent}</p>
              </div>
            ))}
          </div>
        </DashboardSection>
      ) : null}

      <ClinicReviewModal
        isOpen={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        clinicId={reviewTarget?.clinicId ?? ""}
        appointmentId={reviewTarget?.appointmentId}
        appointmentLabel={reviewTarget?.label}
      />
    </div>
  )
}
