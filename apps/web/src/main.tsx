import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { SignalRConnector } from "@/components/SignalRConnector"
import router from "@/routes"

import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <SignalRConnector />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "inherit",
                fontWeight: "600",
                fontSize: "15px",
                padding: "14px 20px",
                borderRadius: "16px",
              },
            }}
          />
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
