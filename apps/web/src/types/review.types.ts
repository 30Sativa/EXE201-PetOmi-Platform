// Review related types reserved for the owner review API.

export interface OwnerReviewItem {
  clinicId: string
  clinicName: string
  clinicAvatarUrl: string | null
  rating: number
  comment: string | null
  createdAt: string
  appointmentId: string | null
  petName: string | null
}

export interface CreateOwnerReviewRequest {
  clinicId: string
  appointmentId?: string
  rating: number
  comment?: string
}

// Clinic review summary
export interface ClinicReviewSummary {
  clinicId: string
  clinicName: string
  averageRating: number
  totalReviews: number
  recentReviews: OwnerReviewItem[]
}
