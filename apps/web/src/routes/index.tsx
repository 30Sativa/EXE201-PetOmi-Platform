import { Navigate, createBrowserRouter } from "react-router-dom"

import App from "@/App"
import DashboardLayout from "@/components/dashboard/DashboardLayout"
import AuthPage from "@/pages/AuthPage"
import ErrorPage from "@/pages/ErrorPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import LandingPage from "@/pages/LandingPage"
import NotFoundPage from "@/pages/NotFoundPage"
import AdminDashboardPage from "@/pages/dashboard/AdminDashboardPage"
import ClinicDashboardPage from "@/pages/dashboard/ClinicDashboardPage"
import OwnerDashboardPage from "@/pages/dashboard/OwnerDashboardPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <AuthPage initialMode="login" /> },
      { path: "register", element: <AuthPage initialMode="register" /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="owner" replace /> },
          { path: "owner", element: <OwnerDashboardPage /> },
          { path: "clinic", element: <ClinicDashboardPage /> },
          { path: "admin", element: <AdminDashboardPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

export default router
