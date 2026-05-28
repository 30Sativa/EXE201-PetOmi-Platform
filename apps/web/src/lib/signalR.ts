import * as signalR from "@microsoft/signalr"

import { tokenStorage } from "./tokenStorage"

const HUB_URL =
  (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5273/api")
    .replace("/api", "")
    .replace(/\/+$/, "") + "/hubs/notifications"

let connection: signalR.HubConnection | null = null

export type NotificationPayload = {
  id: string
  type: "reminder" | "appointment" | "system" | "review"
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: string
  isRead: boolean
}

type SignalREventHandlers = {
  onReceiveReminder: (payload: NotificationPayload) => void
  onConnectionChange: (connected: boolean) => void
}

const handlers: SignalREventHandlers = {
  onReceiveReminder: () => {},
  onConnectionChange: () => {},
}

export const signalREvents = handlers

export const startSignalRConnection = (userId: string) => {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    return
  }

  const token = tokenStorage.getAccessToken()

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => token ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.on("ReceiveReminder", (payload: NotificationPayload) => {
    handlers.onReceiveReminder(payload)
  })

  connection.onreconnecting(() => {
    handlers.onConnectionChange(false)
  })

  connection.onreconnected(() => {
    connection?.invoke("JoinUserGroup", userId).catch(() => {})
    handlers.onConnectionChange(true)
  })

  connection.onclose(() => {
    handlers.onConnectionChange(false)
  })

  connection
    .start()
    .then(() => {
      connection?.invoke("JoinUserGroup", userId).catch(() => {})
      handlers.onConnectionChange(true)
    })
    .catch((err) => {
      console.warn("[SignalR] Failed to connect:", err)
      handlers.onConnectionChange(false)
    })
}

export const stopSignalRConnection = () => {
  connection?.stop()
  connection = null
  handlers.onConnectionChange(false)
}

export const getSignalRConnectionState = () => {
  if (!connection) return "Disconnected"
  switch (connection.state) {
    case signalR.HubConnectionState.Connected:
      return "Connected"
    case signalR.HubConnectionState.Connecting:
      return "Connecting"
    case signalR.HubConnectionState.Reconnecting:
      return "Reconnecting"
    default:
      return "Disconnected"
  }
}

export const isSignalRConnected = () =>
  connection?.state === signalR.HubConnectionState.Connected
