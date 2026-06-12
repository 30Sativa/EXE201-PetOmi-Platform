export type ChatSubscriptionPlanResponse = {
  planId: string
  code: string
  name: string
  description?: string | null
  priceMonthly: number
  billingCycleDays: number
  monthlyMessageQuota: number
  monthlyTokenQuota?: number | null
  priorityLevel: number
  deepRagEnabled: boolean
  imageUploadEnabled: boolean
  maxImageUploadsPerMonth: number
  isActive: boolean
  sortOrder: number
}

export type ChatSubscriptionUsageResponse = {
  usedMessages: number
  remainingMessages: number
  monthlyMessageQuota: number
  monthlyTokenQuota?: number | null
  usedTokens: number
  resetAt: string
}

export type ChatSubscriptionCapabilitiesResponse = {
  priorityLevel: number
  deepRagEnabled: boolean
  imageUploadEnabled: boolean
  maxImageUploadsPerMonth: number
}

export type OwnerPetChatSubscriptionResponse = {
  subscriptionId: string
  petId: string
  petName: string
  planCode: string
  planName: string
  status: string
  startsAt: string
  expiresAt: string
  isUsable: boolean
}

export type ChatSubscriptionStatusResponse = {
  currentPlanCode: string
  currentPlanName: string
  selectedPetId?: string | null
  subscriptionId?: string | null
  isPremium: boolean
  subscriptionExpiresAt?: string | null
  canSend: boolean
  blockReason?: string | null
  usage: ChatSubscriptionUsageResponse
  capabilities: ChatSubscriptionCapabilitiesResponse
  plans: ChatSubscriptionPlanResponse[]
  ownerPetSubscriptions: OwnerPetChatSubscriptionResponse[]
}

export type CreateChatSubscriptionPaymentRequest = {
  planCode: string
  petId: string
}

export type ChatSubscriptionPaymentResponse = {
  paymentId: string
  petId: string
  petName: string
  planCode: string
  planName: string
  status: string
  amount: number
  currency: string
  provider: string
  paymentReference: string
  qrCodeUrl: string
  bankAccountNo: string
  bankCode: string
  expiresAt: string
  paidAt?: string | null
  subscriptionId?: string | null
}

export type AdminChatSubscriptionItemResponse = {
  subscriptionId: string
  scopeType: string
  ownerUserId?: string | null
  ownerEmail?: string | null
  petId?: string | null
  petName?: string | null
  clinicId?: string | null
  clinicName?: string | null
  planCode: string
  planName: string
  status: string
  startsAt: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export type AdminChatSubscriptionPaymentItemResponse = {
  paymentId: string
  ownerUserId: string
  ownerEmail: string
  petId: string
  petName: string
  planCode: string
  planName: string
  status: string
  amount: number
  currency: string
  provider: string
  paymentReference: string
  providerTransactionId?: string | null
  paidAt?: string | null
  expiresAt: string
  createdAt: string
}

export type AdminChatSubscriptionsResponse = {
  plans: ChatSubscriptionPlanResponse[]
  subscriptions: AdminChatSubscriptionItemResponse[]
  payments: AdminChatSubscriptionPaymentItemResponse[]
}
