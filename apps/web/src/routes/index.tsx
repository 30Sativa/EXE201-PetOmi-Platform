import { Navigate, createBrowserRouter } from "react-router-dom"

import App from "@/App"

import { RequireAuth } from "@/components/guards/RequireAuth"

import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout"
import ClinicDashboardLayout from "@/components/dashboard/ClinicDashboardLayout"
import OwnerDashboardLayout from "@/components/dashboard/OwnerDashboardLayout"

import AuthPage from "@/pages/AuthPage"
import CompleteProfilePage from "@/pages/CompleteProfilePage"
import ErrorPage from "@/pages/ErrorPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import LandingPage from "@/pages/LandingPage"
import NotFoundPage from "@/pages/NotFoundPage"
import VerifyEmailPage from "@/pages/VerifyEmailPage"

import AdminDashboardPage from "@/pages/dashboard/AdminDashboardPage"
import ClinicDashboardPage from "@/pages/dashboard/ClinicDashboardPage"
import OwnerDashboardPage from "@/pages/dashboard/owner/OwnerDashboardPage"
import OwnerAppointmentsPage from "@/pages/dashboard/owner/OwnerAppointmentsPage"
import OwnerHistoryPage from "@/pages/dashboard/owner/OwnerHistoryPage"
import OwnerNotificationsPage from "@/pages/dashboard/owner/OwnerNotificationsPage"
import OwnerPetSharingPage from "@/pages/dashboard/owner/OwnerPetSharingPage"
import OwnerPetsPage from "@/pages/dashboard/owner/OwnerPetsPage"
import OwnerProfilePage from "@/pages/dashboard/owner/OwnerProfilePage"
import OwnerRemindersPage from "@/pages/dashboard/owner/OwnerRemindersPage"
import OwnerReviewsPage from "@/pages/dashboard/owner/OwnerReviewsPage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,

    children: [
      {
        index: true,
        element: <LandingPage />,
      },

      {
        path: "auth",
        element: <Navigate to="/login" replace />,
      },

      {
        path: "login",
        element: <AuthPage initialMode="login" />,
      },

      {
        path: "register",
        element: <AuthPage initialMode="register" />,
      },

      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },

      {
        path: "verify-email",
        element: <VerifyEmailPage />,
      },

      {
        path: "complete-profile",
        element: (
          <RequireAuth>
            <CompleteProfilePage />
          </RequireAuth>
        ),
      },

      {
        path: "dashboard",
        element: <Navigate to="/dashboard/owner" replace />,
      },

      {
        path: "dashboard/owner",
        element: (
          <RequireAuth>
            <OwnerDashboardLayout />
          </RequireAuth>
        ),

        children: [
          {
            index: true,
            element: <OwnerDashboardPage />,
          },
          {
            path: "pets",
            element: <OwnerPetsPage />,
          },
          {
            path: "appointments",
            element: <OwnerAppointmentsPage />,
          },
          {
            path: "history",
            element: <OwnerHistoryPage />,
          },
          {
            path: "reviews",
            element: <OwnerReviewsPage />,
          },
          {
            path: "reminders",
            element: <OwnerRemindersPage />,
          },
          {
            path: "sharing",
            element: <OwnerPetSharingPage />,
          },
          {
            path: "notifications",
            element: <OwnerNotificationsPage />,
          },
          {
            path: "profile",
            element: <OwnerProfilePage />,
          },
        ],
      },

      {
        path: "dashboard/clinic",
        element: (
          <RequireAuth>
            <ClinicDashboardLayout />
          </RequireAuth>
        ),

        children: [
          {
            index: true,
            element: <ClinicDashboardPage />,
          },
        ],
      },

      {
        path: "dashboard/admin",
        element: (
          <RequireAuth>
            <AdminDashboardLayout />
          </RequireAuth>
        ),

        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
        ],
      },

      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
])

export default router