import * as signalR from "@microsoft/signalr"

import { tokenStorage } from "@/lib/tokenStorage"
import type { ChatMessageResponse } from "@/types"

const CHAT_HUB_URL =
  (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5273/api")
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "") + "/hubs/chat"

export const createChatConnection = (
  userId: string,
  onAiResponse: (payload: ChatMessageResponse) => void,
  onConnectionChange: (connected: boolean) => void,
) => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(CHAT_HUB_URL, {
      accessTokenFactory: () => tokenStorage.getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.on("ai-response", onAiResponse)

  connection.onreconnecting(() => {
    onConnectionChange(false)
  })

  connection.onreconnected(() => {
    connection.invoke("JoinUserGroup", userId).catch(() => {})
    onConnectionChange(true)
  })

  connection.onclose(() => {
    onConnectionChange(false)
  })

  return connection
}
