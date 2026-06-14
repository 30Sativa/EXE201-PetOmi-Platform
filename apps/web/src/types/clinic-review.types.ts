// Clinic review types matching backend DTOs

export interface ClinicReviewResponse {
  reviewId: string
  clinicId: string
  ownerUserId: string
  appointmentId: string | null
  rating: number
  reviewContent: string
  status: string
  createdAt: string
  updatedAt: string | null
}

export interface ClinicReviewSummaryResponse {
  totalReviews: number
  averageRating: number
  reviews: ClinicReviewResponse[]
}

export interface CreateClinicReviewRequest {
  clinicId: string
  appointmentId?: string | null
  rating: number
  reviewContent: string
}
