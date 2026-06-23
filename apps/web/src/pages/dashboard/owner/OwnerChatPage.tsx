import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import axios from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronDown,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Crown,
  ExternalLink,
  History,
  Loader2,
  MessageSquare,
  PawPrint,
  Plus,
  Send,
  Sparkles,
  Square,
  Syringe,
  Utensils,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { createChatConnection } from "@/lib/chatSignalR"
import { cn } from "@/lib/utils"
import { getPetsApi } from "@/services/pets.service"
import {
  cancelChatMessageApi,
  getChatConversationsApi,
  getConversationMessagesApi,
  sendChatMessageApi,
} from "@/services/chat.service"
import {
  getChatSubscriptionStatusApi,
} from "@/services/chat-subscription.service"
import type {
  ChatConversationResponse,
  ChatMessageResponse,
  SendChatMessageRequest,
  SourceEntry,
} from "@/types"

const CHAT_CONVERSATION_KEY = "petomi:owner-chat:conversation-id"

const questionSuggestions = [
  {
    text: "Bé nhà mình bỏ ăn từ sáng, mình nên theo dõi dấu hiệu nào?",
    icon: Utensils,
  },
  {
    text: "Lịch tiêm phòng cơ bản cho chó con gồm những mũi nào?",
    icon: Syringe,
  },
  {
    text: "Trước khi đưa thú cưng đi khám cần chuẩn bị gì?",
    icon: CalendarCheck,
  },
]

const statusLabel = (status: string) => {
  const normalized = status.toLowerCase()
  const map: Record<string, string> = {
    pending: "Đang xử lý",
    processing: "Đang phân tích",
    completed: "Đã xong",
    failed: "Lỗi",
    cancelled: "Đã dừng",
  }

  return map[normalized] ?? status
}

const isAiMessage = (senderRole: string) => {
  const normalized = senderRole.toLowerCase()
  return normalized === "ai" || normalized === "assistant"
}

const mergeMessages = (
  current: ChatMessageResponse[],
  incoming: ChatMessageResponse,
) => {
  if (current.some((message) => message.messageId === incoming.messageId)) {
    return current.map((message) =>
      message.messageId === incoming.messageId ? { ...message, ...incoming } : message,
    )
  }

  return [...current, incoming].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa có thời gian"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian"

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as {
      errors?: string[]
      message?: string
    } | undefined
    return data?.errors?.[0] ?? data?.message ?? fallback
  }

  return fallback
}

const getConversationTitle = (conversation: ChatConversationResponse) => {
  const title = conversation.title?.trim()
  return title && title !== "New conversation"
    ? title
    : "Cuộc trò chuyện mới"
}

const vetBadgeConfig = (vetRecommendation: string | null | undefined) => {
  if (!vetRecommendation) return null
  const normalized = vetRecommendation.toLowerCase()
  if (normalized === "urgent") {
    return {
      label: "Khẩn cấp — gặp bác sĩ ngay",
      bg: "bg-po-danger-soft",
      text: "text-po-danger",
      ring: "ring-po-danger-soft",
      icon: AlertTriangle,
    }
  }
  if (normalized === "watch") {
    return {
      label: "Theo dõi sát",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      ring: "ring-yellow-200",
      icon: AlertTriangle,
    }
  }
  if (normalized === "monitor") {
    return {
      label: "Nên đi khám",
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-200",
      icon: AlertTriangle,
    }
  }
  return null
}

const VetBadge = ({ vetRecommendation }: { vetRecommendation: string | null | undefined }) => {
  const config = vetBadgeConfig(vetRecommendation)
  if (!config) return null
  const Icon = config.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ring-1",
        config.bg,
        config.text,
        config.ring,
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  )
}

const SourcesSection = ({ sources }: { sources: SourceEntry[] }) => {
  const [isOpen, setIsOpen] = useState(false)
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 rounded-2xl border border-po-border/70 bg-po-surface-muted/40 p-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-po-text-muted">
          Nguồn tham khảo ({sources.length})
        </span>
        <ChevronRight
          className={cn(
            "size-3.5 text-po-text-subtle transition-transform",
            isOpen ? "rotate-90" : "",
          )}
        />
      </button>
      {isOpen && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {sources.map((source, index) => (
            <li key={index}>
              <a
                href={source.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 text-left text-xs font-medium text-po-text transition hover:bg-po-primary-soft hover:text-po-primary"
              >
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded bg-po-surface-muted text-po-text-subtle">
                  <ExternalLink className="size-2.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-extrabold">{source.title}</span>
                  {source.snippet && (
                    <span className="mt-0.5 block line-clamp-2 text-po-text-muted">
                      {source.snippet}
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function OwnerChatPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [conversationId, setConversationId] = useState<string | null>(() =>
    window.localStorage.getItem(CHAT_CONVERSATION_KEY),
  )
  const [selectedPetId, setSelectedPetId] = useState("")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessageResponse[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isWaitingForAi, setIsWaitingForAi] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [isPetPickerOpen, setIsPetPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const petPickerRef = useRef<HTMLDivElement | null>(null)
  const sendAbortControllerRef = useRef<AbortController | null>(null)
  const conversationIdRef = useRef<string | null>(conversationId)

  const { data: pets = [] } = useQuery({
    queryKey: ["owner-pets"],
    queryFn: getPetsApi,
  })

  const { data: conversations = [], isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ["owner-chat-conversations"],
      queryFn: () => getChatConversationsApi(30),
    })

  const chatMessagesQueryKey = useMemo(
    () => ["owner-chat-messages", conversationId] as const,
    [conversationId],
  )

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return

    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  const {
    data: history = [],
    isLoading: isLoadingHistory,
    isError: isHistoryError,
  } = useQuery({
    queryKey: chatMessagesQueryKey,
    queryFn: () => getConversationMessagesApi(conversationId ?? ""),
    enabled: Boolean(conversationId),
  })

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.conversationId === conversationId,
      ),
    [conversations, conversationId],
  )

  const subscriptionPetId = selectedConversation?.petId ?? (selectedPetId || null)

  const canChangePet = !conversationId || !selectedConversation?.petId

  const currentPetLabel = useMemo(() => {
    const petId = selectedConversation?.petId ?? selectedPetId
    if (!petId) return "chưa chọn thú cưng"

    return pets.find((pet) => pet.petId === petId)?.name ?? "thú cưng đã chọn"
  }, [pets, selectedConversation?.petId, selectedPetId])

  const petPickerLabel = useMemo(() => {
    if (conversationId) return currentPetLabel
    if (!selectedPetId) return "Chưa chọn thú cưng"

    return pets.find((pet) => pet.petId === selectedPetId)?.name ?? "Thú cưng đã chọn"
  }, [conversationId, currentPetLabel, pets, selectedPetId])

  const {
    data: subscriptionStatus,
  } = useQuery({
    queryKey: ["owner-chat-subscription", subscriptionPetId],
    queryFn: () => getChatSubscriptionStatusApi(subscriptionPetId),
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    setMessages(history)
    const pendingUserMessage = history.find(
      (message) =>
        !isAiMessage(message.senderRole) &&
        ["pending", "processing"].includes(message.status.toLowerCase()),
    )

    setActiveMessageId(pendingUserMessage?.messageId ?? null)
    setIsWaitingForAi(Boolean(pendingUserMessage))
  }, [history])

  useEffect(() => {
    if (selectedPetId || pets.length !== 1 || selectedConversation?.petId) return
    setSelectedPetId(pets[0].petId)
  }, [pets, selectedConversation?.petId, selectedPetId])

  useEffect(() => {
    return () => {
      sendAbortControllerRef.current?.abort()
    }
  }, [])

  const sendMessageMutation = useMutation({
    mutationFn: ({
      request,
      signal,
    }: {
      request: SendChatMessageRequest
      signal: AbortSignal
    }) => sendChatMessageApi(request, signal),
    onSuccess: (response, { request }) => {
      sendAbortControllerRef.current = null
      const nextConversationId = response.conversationId
      conversationIdRef.current = nextConversationId
      setConversationId(nextConversationId)
      window.localStorage.setItem(CHAT_CONVERSATION_KEY, nextConversationId)
      setActiveMessageId(response.messageId)

      setMessages((current) =>
        mergeMessages(current, {
          messageId: response.messageId,
          conversationId: response.conversationId,
          senderRole: "User",
          status: response.status,
          content: request.content,
          ragUsed: false,
          chunksUsed: 0,
          tokensInput: 0,
          tokensOutput: 0,
          sources: [],
          isActive: true,
          createdAt: response.createdAt,
        }),
      )
      setIsWaitingForAi(true)
      setError(null)
      void queryClient.invalidateQueries({
        queryKey: ["owner-chat-conversations"],
      })
      void queryClient.invalidateQueries({
        queryKey: ["owner-chat-messages", nextConversationId],
      })
      void queryClient.invalidateQueries({
        queryKey: ["owner-chat-subscription"],
      })
    },
    onError: (mutationError) => {
      sendAbortControllerRef.current = null

      if (axios.isCancel(mutationError)) {
        setError(null)
      } else {
        setError(
          getApiErrorMessage(
            mutationError,
            "Không gửi được tin nhắn. Vui lòng thử lại sau.",
          ),
        )
      }

      setActiveMessageId(null)
      setIsWaitingForAi(false)
    },
  })

  const isAiBusy = sendMessageMutation.isPending || isWaitingForAi
  const quotaBlocked = Boolean(subscriptionStatus && !subscriptionStatus.canSend)

  const abortPendingSend = () => {
    sendAbortControllerRef.current?.abort()
    sendAbortControllerRef.current = null
    sendMessageMutation.reset()
  }

  const stopCurrentResponse = () => {
    sendAbortControllerRef.current?.abort()
    sendAbortControllerRef.current = null

    if (activeMessageId) {
      void cancelChatMessageApi(activeMessageId).catch(() => {})
      setMessages((current) =>
        current.map((message) =>
          message.messageId === activeMessageId
            ? { ...message, status: "cancelled" }
            : message,
        ),
      )
    }

    setActiveMessageId(null)
    setIsWaitingForAi(false)
    setError(null)
    sendMessageMutation.reset()
  }

  useEffect(() => {
    if (!isPetPickerOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        petPickerRef.current &&
        !petPickerRef.current.contains(event.target as Node)
      ) {
        setIsPetPickerOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPetPickerOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isPetPickerOpen])

  useEffect(() => {
    if (!user?.id) return

    const connection = createChatConnection(
      user.id,
      (payload) => {
        const isCurrentConversation =
          payload.conversationId === conversationIdRef.current

        if (isCurrentConversation) {
          setMessages((current) => mergeMessages(current, payload))
          setActiveMessageId(null)
          setIsWaitingForAi(false)
        }

        void queryClient.invalidateQueries({
          queryKey: ["owner-chat-messages", payload.conversationId],
        })
        void queryClient.invalidateQueries({
          queryKey: ["owner-chat-conversations"],
        })
      },
      setIsConnected,
    )

    connection
      .start()
      .then(() => {
        connection.invoke("JoinUserGroup", user.id).catch(() => {})
        setIsConnected(true)
      })
      .catch(() => {
        setIsConnected(false)
      })

    return () => {
      connection.stop().catch(() => {})
    }
  }, [queryClient, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isWaitingForAi])


  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const content = input.trim()
    if (!content || isAiBusy) return
    if (quotaBlocked) {
      setError(
        subscriptionStatus?.blockReason ??
          "Ban da dung het quota PetOmi AI trong chu ky hien tai.",
      )
      return
    }

    const abortController = new AbortController()
    sendAbortControllerRef.current = abortController
    setInput("")
    setError(null)
    sendMessageMutation.mutate({
      request: {
        content,
        conversationId: conversationId ?? undefined,
        petId: selectedConversation?.petId ?? (selectedPetId || undefined),
      },
      signal: abortController.signal,
    })
  }

  const handleNewConversation = () => {
    abortPendingSend()
    conversationIdRef.current = null
    setConversationId(null)
    setMessages([])
    setInput("")
    setError(null)
    setActiveMessageId(null)
    setIsWaitingForAi(false)
    window.localStorage.removeItem(CHAT_CONVERSATION_KEY)
  }

  const handleSelectConversation = (nextConversationId: string) => {
    if (nextConversationId === conversationId) return

    abortPendingSend()
    conversationIdRef.current = nextConversationId
    setConversationId(nextConversationId)
    setMessages([])
    setInput("")
    setError(null)
    setActiveMessageId(null)
    setIsWaitingForAi(false)
    window.localStorage.setItem(CHAT_CONVERSATION_KEY, nextConversationId)
  }

  return (
    <div className="grid gap-5 xl:h-[calc(100dvh-190px)] xl:min-h-[640px] xl:grid-cols-[302px_minmax(0,1fr)]">
      <aside className="order-2 flex min-h-[360px] flex-col overflow-hidden rounded-[24px] bg-white/88 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 xl:order-1 xl:min-h-0">
        <div className="flex items-center justify-between gap-3 border-b border-po-border/80 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <History className="size-4 text-po-primary" />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-po-text-muted">
                Lịch sử chat
              </h3>
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-po-text-subtle">
              Chọn một cuộc trò chuyện cũ
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewConversation}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-po-primary px-3 text-xs font-bold text-white shadow-sm shadow-orange-200/40 transition hover:-translate-y-0.5 hover:bg-po-primary-hover active:translate-y-0"
            aria-label="Tạo cuộc trò chuyện mới"
            title="Tạo cuộc trò chuyện mới"
          >
            <Plus className="size-4" />
            Chat mới
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 xl:max-h-none">
          {isLoadingConversations ? (
            <div className="grid gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl bg-po-surface-muted"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center px-5 text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-po-surface-muted text-po-text-muted ring-1 ring-po-border/70">
                  <MessageSquare className="size-7" />
                </div>
                <h4 className="mt-5 text-base font-extrabold text-po-text">
                  Chưa có lịch sử chat
                </h4>
                <p className="mt-2 text-sm leading-6 text-po-text-muted">
                  Gửi câu hỏi đầu tiên để PetOmi lưu lại cuộc trò chuyện của bạn.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {conversations.map((conversation) => {
                const isActive = conversation.conversationId === conversationId
                const pet = conversation.petId
                  ? pets.find((item) => item.petId === conversation.petId)
                  : null

                return (
                  <button
                    key={conversation.conversationId}
                    type="button"
                    onClick={() =>
                      handleSelectConversation(conversation.conversationId)
                    }
                    className={cn(
                      "group min-w-0 rounded-2xl p-3 text-left transition",
                      isActive
                        ? "bg-po-primary text-white shadow-sm shadow-orange-200/40"
                        : "bg-white text-po-text ring-1 ring-po-border/70 hover:bg-po-surface-muted",
                    )}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 text-sm font-extrabold leading-5">
                        {getConversationTitle(conversation)}
                      </p>
                      <ChevronRight
                        className={cn(
                          "mt-0.5 size-4 shrink-0 transition group-hover:translate-x-0.5",
                          isActive ? "text-white/80" : "text-po-text-subtle",
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        "mt-3 flex items-center gap-2 text-xs font-semibold",
                        isActive ? "text-white/78" : "text-po-text-subtle",
                      )}
                    >
                      <Clock3 className="size-3.5 shrink-0" />
                      <span>{formatDateTime(conversation.createdAt)}</span>
                    </div>
                    <p
                      className={cn(
                        "mt-1 truncate text-xs font-semibold",
                        isActive ? "text-white/78" : "text-po-text-muted",
                      )}
                    >
                      {pet?.name ?? "Không gắn thú cưng"}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      <section className="order-1 flex min-h-[640px] min-w-0 flex-col overflow-hidden rounded-[24px] bg-white/92 shadow-sm shadow-orange-200/20 ring-1 ring-po-border/80 xl:order-2 xl:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-po-border/80 px-5 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary shadow-sm shadow-orange-200">
              <Bot className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="mb-1 inline-flex rounded-md bg-po-primary-soft px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-po-primary">
                PetOmi AI
              </p>
              <h2 className="truncate text-xl font-extrabold text-po-text">
                Tư vấn chăm sóc thú cưng
              </h2>
              <p className="mt-1 text-sm font-medium text-po-text-muted">
                Chat gọn như trợ lý AI, không trộn phần gói dịch vụ vào hội thoại.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Link
              to="/dashboard/owner/ai-plan"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-po-primary-soft px-3 text-sm font-extrabold text-po-primary ring-1 ring-po-border/70 transition hover:bg-po-primary hover:text-white"
            >
              <Crown className="size-4" />
              AI Plan
            </Link>

            <div ref={petPickerRef} className="relative z-30 min-w-[220px] flex-1 sm:w-64 sm:flex-none">
              <button
                type="button"
                onClick={() => {
                  if (canChangePet) {
                    setIsPetPickerOpen((current) => !current)
                  }
                }}
                className={cn(
                  "flex h-10 w-full items-center justify-between gap-3 rounded-full border bg-white px-4 text-left text-sm font-semibold text-po-text shadow-sm shadow-orange-100/40 outline-none transition",
                  isPetPickerOpen
                    ? "border-po-primary ring-[var(--po-focus-ring)]"
                    : "border-po-border hover:border-po-border-strong hover:bg-po-surface-muted/40",
                  !canChangePet
                    ? "cursor-not-allowed bg-po-surface-muted/70 text-po-text-muted"
                    : "",
                )}
                aria-haspopup="listbox"
                aria-expanded={isPetPickerOpen}
                disabled={!canChangePet}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <PawPrint className="size-4 shrink-0 text-po-primary" />
                  <span className="min-w-0 truncate">{petPickerLabel}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-po-text-subtle transition",
                    isPetPickerOpen ? "rotate-180 text-po-primary" : "",
                  )}
                />
              </button>

              {isPetPickerOpen ? (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-po-border bg-white p-1 shadow-xl shadow-orange-200/30"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={!selectedPetId}
                    onClick={() => {
                      setSelectedPetId("")
                      setIsPetPickerOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                      !selectedPetId
                        ? "bg-po-primary-soft text-po-primary"
                        : "text-po-text-muted hover:bg-po-surface-muted hover:text-po-text",
                    )}
                  >
                    <span>Chưa chọn thú cưng</span>
                    {!selectedPetId ? <Check className="size-4" /> : null}
                  </button>

                  {pets.length === 0 ? (
                    <div className="px-3 py-3 text-sm font-medium text-po-text-muted">
                      Bạn chưa có thú cưng nào.
                    </div>
                  ) : (
                    pets.map((pet) => {
                      const isSelected = selectedPetId === pet.petId

                      return (
                        <button
                          key={pet.petId}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedPetId(pet.petId)
                            setIsPetPickerOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition",
                            isSelected
                              ? "bg-po-primary text-white"
                              : "text-po-text hover:bg-po-surface-muted",
                          )}
                        >
                          <span className="min-w-0 truncate">{pet.name}</span>
                          {isSelected ? <Check className="size-4" /> : null}
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            <span
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.08em] ring-1",
                isConnected
                  ? "bg-po-accent-soft/70 text-po-success ring-po-accent-soft"
                  : "bg-po-surface-muted text-po-text-muted ring-po-border",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isConnected ? "bg-po-success" : "bg-po-text-subtle",
                )}
              />
              {isConnected ? "Realtime" : "Đang kết nối"}
            </span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-white to-po-surface-muted/20 px-4 py-6 sm:px-6">
          <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 opacity-40 [background-image:radial-gradient(var(--po-color-border)_1px,transparent_1px)] [background-size:14px_14px]" />
          {isLoadingHistory ? (
            <div className="grid flex-1 content-center gap-3">
              <div className="h-16 w-3/4 animate-pulse rounded-[22px] bg-po-surface-muted" />
              <div className="ml-auto h-16 w-2/3 animate-pulse rounded-[22px] bg-po-primary-soft" />
              <div className="h-20 w-4/5 animate-pulse rounded-[22px] bg-po-surface-muted" />
            </div>
          ) : isHistoryError ? (
            <div className="relative mx-auto grid w-full max-w-2xl flex-1 content-center">
              <div className="rounded-[22px] bg-po-danger-soft p-5 text-sm font-semibold leading-6 text-po-danger ring-1 ring-po-danger-soft">
                Không tải được lịch sử chat. Vui lòng thử chọn lại cuộc trò chuyện hoặc đăng nhập lại.
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="relative mx-auto grid w-full max-w-3xl flex-1 content-center">
              <div className="rounded-[26px] bg-white/88 p-5 ring-1 ring-po-border/80 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-po-primary-soft text-po-primary">
                    <Sparkles className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-extrabold leading-tight text-po-text">
                      Bắt đầu bằng một câu hỏi rõ ràng
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-po-text-muted">
                      Hỏi về dinh dưỡng, lịch tiêm phòng, dấu hiệu bất thường
                      hoặc cách chuẩn bị trước khi đưa thú cưng đi khám.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  {questionSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.text}
                      type="button"
                      onClick={() => setInput(suggestion.text)}
                      className="group flex min-w-0 items-center gap-3 rounded-2xl bg-po-surface-muted/70 px-3 py-3 text-left text-sm font-semibold leading-6 text-po-text transition hover:bg-po-primary-soft hover:text-po-primary"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-po-primary shadow-sm shadow-orange-100/60">
                        <suggestion.icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">{suggestion.text}</span>
                      <ChevronRight className="size-4 shrink-0 text-po-text-subtle transition group-hover:translate-x-0.5 group-hover:text-po-primary" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const fromAi = isAiMessage(message.senderRole)
              const isFailed = message.status.toLowerCase() === "failed"

              return (
                <div
                  key={message.messageId}
                  className={cn(
                    "relative flex gap-3",
                    fromAi ? "justify-start" : "justify-end",
                  )}
                >
                  {fromAi ? (
                    <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-2xl bg-po-accent-soft text-po-success">
                      <Bot className="size-4" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 shadow-sm",
                      fromAi
                        ? isFailed
                          ? "bg-po-danger-soft ring-1 ring-po-danger-soft"
                          : "bg-white text-po-text ring-1 ring-po-border/70"
                        : "bg-po-primary text-white",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>

                    {isFailed && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-po-danger">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>Yêu cầu gặp sự cố. PetOmi sẽ sớm phản hồi lại.</span>
                      </div>
                    )}

                    {fromAi && !isFailed && <VetBadge vetRecommendation={message.vetRecommendation} />}

                    {fromAi && !isFailed && message.sources && message.sources.length > 0 && (
                      <SourcesSection sources={message.sources} />
                    )}

                    <div
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold",
                        fromAi ? "text-po-text-subtle" : "text-white/78",
                      )}
                    >
                      <span>{statusLabel(message.status)}</span>
                      {message.intent ? <span>{message.intent}</span> : null}
                      {message.urgencyLevel && !isFailed ? (
                        <span>{message.urgencyLevel}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {isWaitingForAi ? (
            <div className="relative flex justify-start gap-3">
              <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-2xl bg-po-accent-soft text-po-success">
                <Bot className="size-4" />
              </span>
              <div className="inline-flex items-center gap-2 rounded-[22px] bg-white px-4 py-3 text-sm font-semibold text-po-text-muted ring-1 ring-po-border/70">
                <Loader2 className="size-4 animate-spin" />
                PetOmi đang chuẩn bị câu trả lời
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-po-border/80 bg-white/90 px-4 py-4 sm:px-5"
        >
          {error ? (
            <p className="mb-3 rounded-2xl bg-po-danger-soft px-4 py-2 text-sm font-semibold text-po-danger">
              {error}
            </p>
          ) : null}

          {quotaBlocked ? (
            <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-po-danger-soft px-4 py-3 text-sm font-semibold text-po-danger sm:flex-row sm:items-center sm:justify-between">
              <span>
                {subscriptionStatus?.blockReason ??
                  "Bạn đã dùng hết lượt nhắn với PetOmi AI tháng này rồi."}
              </span>
              <Link
                to="/dashboard/owner/ai-plan"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-po-primary ring-1 ring-po-border"
              >
                <Crown className="size-3.5" />
                Xem các gói
              </Link>
            </div>
          ) : null}

          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={1}
              maxLength={10000}
              disabled={!isAiBusy && quotaBlocked}
              placeholder={
                quotaBlocked
                  ? "Bạn đã hết lượt nhắn tháng này. Xem các gói để dùng tiếp nhé."
                  : "Nhập câu hỏi cho PetOmi AI..."
              }
              className="max-h-40 min-h-14 w-full resize-none overflow-y-auto rounded-2xl border border-po-border bg-white px-4 py-3 pr-16 text-sm leading-6 text-po-text outline-none transition placeholder:text-po-text-subtle focus:border-po-primary focus:ring-[var(--po-focus-ring)] disabled:cursor-not-allowed disabled:bg-po-surface-muted/70"
            />
            <button
              type={isAiBusy ? "button" : "submit"}
              onClick={isAiBusy ? stopCurrentResponse : undefined}
              disabled={!isAiBusy && (!input.trim() || quotaBlocked)}
              className={cn(
                "absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full text-white shadow-lg shadow-orange-200/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-0",
                isAiBusy
                  ? "bg-po-text hover:bg-po-text-muted"
                  : "bg-po-primary hover:bg-po-primary-hover",
              )}
              aria-label={isAiBusy ? "Dừng phản hồi" : "Gửi tin nhắn"}
              title={isAiBusy ? "Dừng phản hồi" : "Gửi tin nhắn"}
            >
              {isAiBusy ? (
                <Square className="size-4 fill-current" />
              ) : (
                <Send className="size-5" />
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-xs font-medium text-po-text-subtle">
            PetOmi AI có thể mắc lỗi. Vui lòng xác minh thông tin quan trọng
            với bác sĩ thú y.
          </p>
        </form>
      </section>
    </div>
  )
}
