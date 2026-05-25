// Notification types for SignalR real-time
// Note: NotificationPayload is defined in src/lib/signalR.ts and re-exported here

import type { NotificationPayload } from "@/lib/signalR"

export interface NotificationState {
  notifications: NotificationPayload[]
  unreadCount: number
  isConnected: boolean
  isLoading: boolean
}
