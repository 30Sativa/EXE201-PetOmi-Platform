import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { AlertTriangle, CheckCircle2, Info } from "lucide-react"

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
            position="top-right"
            offset={88}
            mobileOffset={12}
            visibleToasts={3}
            closeButton
            toastOptions={{
              duration: 4200,
              classNames: {
                toast: "po-toast",
                success: "po-toast-success",
                error: "po-toast-error",
                warning: "po-toast-warning",
                info: "po-toast-info",
                title: "po-toast-title",
                description: "po-toast-description",
                content: "po-toast-content",
                icon: "po-toast-icon",
              },
            }}
            icons={{
              success: <CheckCircle2 className="size-5" />,
              error: <AlertTriangle className="size-5" />,
              warning: <AlertTriangle className="size-5" />,
              info: <Info className="size-5" />,
            }}
          />
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
