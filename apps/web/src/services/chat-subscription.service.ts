import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  AdminChatSubscriptionsResponse,
  ChatSubscriptionPaymentResponse,
  ChatSubscriptionStatusResponse,
  CreateChatSubscriptionPaymentRequest,
} from "@/types"

export const getChatSubscriptionStatusApi = async (
  petId?: string | null,
): Promise<ChatSubscriptionStatusResponse> => {
  const response = await api.get("/chat/subscription/status", {
    params: petId ? { petId } : undefined,
  })
  return unwrapResponse<ChatSubscriptionStatusResponse>(response)
}

export const createChatSubscriptionPaymentApi = async (
  request: CreateChatSubscriptionPaymentRequest,
): Promise<ChatSubscriptionPaymentResponse> => {
  const response = await api.post("/chat/subscription/payments", request)
  return unwrapResponse<ChatSubscriptionPaymentResponse>(response)
}

export const getChatSubscriptionPaymentStatusApi = async (
  paymentId: string,
): Promise<ChatSubscriptionPaymentResponse> => {
  const response = await api.get(`/chat/subscription/payments/${paymentId}`)
  return unwrapResponse<ChatSubscriptionPaymentResponse>(response)
}

export const getAdminChatSubscriptionsApi = async (
  take = 50,
): Promise<AdminChatSubscriptionsResponse> => {
  const response = await api.get("/admin/chat-subscriptions", {
    params: { take },
  })
  return unwrapResponse<AdminChatSubscriptionsResponse>(response)
}
