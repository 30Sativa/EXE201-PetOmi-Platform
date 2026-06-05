export type SourceEntry = {
  url: string
  title: string
  snippet: string
}

export type ChatMessageResponse = {
  messageId: string
  conversationId: string
  senderRole: string
  status: string
  content: string
  intent?: string | null
  urgencyLevel?: string | null
  vetRecommendation?: string | null
  ragUsed: boolean
  chunksUsed: number
  model?: string | null
  tokensInput: number
  tokensOutput: number
  sources: SourceEntry[]
  isActive: boolean
  createdAt: string
}

export type SendChatMessageRequest = {
  content: string
  conversationId?: string
  petId?: string
}

export type SendChatMessageResponse = {
  messageId: string
  conversationId: string
  status: string
  createdAt: string
}

export type ChatConversationResponse = {
  conversationId: string
  userId: string
  petId?: string | null
  title?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}
