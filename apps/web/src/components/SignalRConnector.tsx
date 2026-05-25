import { useEffect } from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"

/**
 * Auto-connects SignalR when user logs in,
 * disconnects when user logs out.
 * Must be rendered inside both AuthProvider and NotificationProvider.
 */
export function SignalRConnector() {
  const { user, isAuthenticated } = useAuth()
  const { connect, disconnect } = useNotifications()

  const userId = user?.id

  useEffect(() => {
    // Only connect when user is authenticated AND has a real userId
    // (userId is empty string on initial load, so skip)
    if (isAuthenticated && userId && userId.length > 0) {
      connect(userId)
    } else if (!isAuthenticated || !userId) {
      disconnect()
    }
  }, [isAuthenticated, userId, connect, disconnect])

  return null
}
