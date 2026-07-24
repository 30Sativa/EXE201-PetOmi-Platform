import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  AdminChatSubscriptionsResponse,
  ChatSubscriptionPaymentResponse,
  ChatSubscriptionStatusResponse,
  ChatSubscriptionVoucherRequest,
  ChatSubscriptionVoucherResponse,
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

export const getAdminChatSubscriptionVouchersApi = async (
  take = 100,
): Promise<ChatSubscriptionVoucherResponse[]> => {
  const response = await api.get("/admin/chat-subscriptions/vouchers", {
    params: { take },
  })
  return unwrapResponse<ChatSubscriptionVoucherResponse[]>(response)
}

export const createAdminChatSubscriptionVoucherApi = async (
  request: ChatSubscriptionVoucherRequest,
): Promise<ChatSubscriptionVoucherResponse> => {
  const response = await api.post("/admin/chat-subscriptions/vouchers", request)
  return unwrapResponse<ChatSubscriptionVoucherResponse>(response)
}

export const updateAdminChatSubscriptionVoucherApi = async (
  voucherId: string,
  request: ChatSubscriptionVoucherRequest,
): Promise<ChatSubscriptionVoucherResponse> => {
  const response = await api.put(`/admin/chat-subscriptions/vouchers/${voucherId}`, request)
  return unwrapResponse<ChatSubscriptionVoucherResponse>(response)
}

export const toggleAdminChatSubscriptionVoucherApi = async (
  voucherId: string,
  isActive: boolean,
): Promise<ChatSubscriptionVoucherResponse> => {
  const response = await api.post(`/admin/chat-subscriptions/vouchers/${voucherId}/toggle`, {
    isActive,
  })
  return unwrapResponse<ChatSubscriptionVoucherResponse>(response)
}

export const deleteAdminChatSubscriptionVoucherApi = async (
  voucherId: string,
): Promise<void> => {
  await api.delete(`/admin/chat-subscriptions/vouchers/${voucherId}`)
}
