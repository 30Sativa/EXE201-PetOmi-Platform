import { api } from "@/lib/axios"
import { unwrapResponse } from "@/services/api-response"
import type {
  ChatConversationResponse,
  ChatMessageResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from "@/types"

export const sendChatMessageApi = async (
  request: SendChatMessageRequest,
  signal?: AbortSignal,
): Promise<SendChatMessageResponse> => {
  const response = await api.post("/chat/messages", request, { signal })
  return unwrapResponse<SendChatMessageResponse>(response)
}

export const cancelChatMessageApi = async (
  messageId: string,
): Promise<boolean> => {
  const response = await api.post(`/chat/messages/${messageId}/cancel`)
  return unwrapResponse<boolean>(response)
}

export const getConversationMessagesApi = async (
  conversationId: string,
  skip = 0,
  take = 50,
): Promise<ChatMessageResponse[]> => {
  const response = await api.get(
    `/chat/conversations/${conversationId}/messages`,
    {
      params: { skip, take },
    },
  )

  const messages = unwrapResponse<ChatMessageResponse[]>(response)
  return Array.isArray(messages) ? messages : []
}

export const getChatConversationsApi = async (
  take = 50,
): Promise<ChatConversationResponse[]> => {
  const response = await api.get("/chat/conversations", {
    params: { take },
  })

  const conversations = unwrapResponse<ChatConversationResponse[]>(response)
  return Array.isArray(conversations) ? conversations : []
}
