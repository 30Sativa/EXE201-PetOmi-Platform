import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  signalREvents,
  startSignalRConnection,
  stopSignalRConnection,
  type NotificationPayload,
} from "@/lib/signalR"

interface NotificationContextValue {
  notifications: NotificationPayload[]
  unreadCount: number
  isConnected: boolean
  addNotification: (notification: NotificationPayload) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  connect: (userId: string) => void
  disconnect: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined,
)

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const addNotification = useCallback((notification: NotificationPayload) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === notification.id)
      if (exists) return prev
      return [notification, ...prev]
    })
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const connect = useCallback((userId: string) => {
    if (userIdRef.current === userId) return
    userIdRef.current = userId

    // Register event handlers
    signalREvents.onReceiveReminder = addNotification
    signalREvents.onConnectionChange = setIsConnected

    startSignalRConnection(userId)
  }, [addNotification])

  const disconnect = useCallback(() => {
    stopSignalRConnection()
    signalREvents.onReceiveReminder = () => {}
    signalREvents.onConnectionChange = () => {}
    userIdRef.current = null
    setIsConnected(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      signalREvents.onReceiveReminder = () => {}
      signalREvents.onConnectionChange = () => {}
    }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isConnected,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      connect,
      disconnect,
    }),
    [
      notifications,
      unreadCount,
      isConnected,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      connect,
      disconnect,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    )
  }
  return context
}
