export type WebsiteFeedbackCategory = "General" | "Bug" | "Feature" | "UX" | "Performance"

export interface CreateWebsiteFeedbackRequest {
  category: WebsiteFeedbackCategory
  rating?: number | null
  subject: string
  message: string
  pageUrl?: string | null
  browserInfo?: string | null
}

export interface WebsiteFeedbackResponse {
  feedbackId: string
  userId: string
  userEmail: string | null
  userFullName: string | null
  category: WebsiteFeedbackCategory | string
  rating: number | null
  subject: string
  message: string
  pageUrl: string | null
  browserInfo: string | null
  status: string
  createdAt: string
}
