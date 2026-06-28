import { Navigate, createBrowserRouter } from "react-router-dom"

import App from "@/App"

import { RequireAuth } from "@/components/guards/RequireAuth"
import { DashboardRedirect } from "@/components/guards/DashboardRedirect"
import { RequireClinicPermission } from "@/components/guards/RequireClinicPermission"

import AdminDashboardLayout from "@/components/dashboard/AdminDashboardLayout"
import ClinicDashboardLayout from "@/components/dashboard/ClinicDashboardLayout"
import OwnerDashboardLayout from "@/components/dashboard/OwnerDashboardLayout"

import AuthPage from "@/pages/AuthPage"
import BlogListPage from "@/pages/BlogListPage"
import BlogPostPage from "@/pages/BlogPostPage"
import CompleteProfilePage from "@/pages/CompleteProfilePage"
import ErrorPage from "@/pages/ErrorPage"
import ForClinicsPage from "@/pages/ForClinicsPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import GoogleCallbackPage from "@/pages/GoogleCallbackPage"
import LandingPage from "@/pages/LandingPage"
import NotFoundPage from "@/pages/NotFoundPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import SetPasswordPage from "@/pages/SetPasswordPage"
import VerifyEmailPage from "@/pages/VerifyEmailPage"

import AdminDashboardPage from "@/pages/dashboard/AdminDashboardPage"
import AdminAiPage from "@/pages/dashboard/AdminAiPage"
import AdminAlertsPage from "@/pages/dashboard/AdminAlertsPage"
import AdminAuditLogsPage from "@/pages/dashboard/AdminAuditLogsPage"
import AdminChatSubscriptionsPage from "@/pages/dashboard/AdminChatSubscriptionsPage"
import AdminClinicsPage from "@/pages/dashboard/AdminClinicsPage"
import AdminCtaReportPage from "@/pages/dashboard/AdminCtaReportPage"
import AdminProfilePage from "@/pages/dashboard/AdminProfilePage"
import AdminRolesPage from "@/pages/dashboard/AdminRolesPage"
import AdminSettingsPage from "@/pages/dashboard/AdminSettingsPage"
import AdminUsersPage from "@/pages/dashboard/AdminUsersPage"
import ClinicDashboardPage from "@/pages/dashboard/ClinicDashboardPage"
import ClinicAppointmentsPage from "@/pages/dashboard/clinic/ClinicAppointmentsPage"
import ClinicBillingPage from "@/pages/dashboard/clinic/ClinicBillingPage"
import ClinicDoctorsPage from "@/pages/dashboard/clinic/ClinicDoctorsPage"
import ClinicInventoryPage from "@/pages/dashboard/clinic/ClinicInventoryPage"
import ClinicPaymentSettingsPage from "@/pages/dashboard/clinic/ClinicPaymentSettingsPage"
import ClinicPetIntakePage from "@/pages/dashboard/clinic/ClinicPetIntakePage"
import ClinicProfilePage from "@/pages/dashboard/clinic/ClinicProfilePage"
import ClinicReconciliationPage from "@/pages/dashboard/clinic/ClinicReconciliationPage"
import ClinicServicesPage from "@/pages/dashboard/clinic/ClinicServicesPage"
import ClinicVisitPage from "@/pages/dashboard/clinic/ClinicVisitPage"
import OwnerDashboardPage from "@/pages/dashboard/owner/OwnerDashboardPage"
import OwnerAppointmentsPage from "@/pages/dashboard/owner/OwnerAppointmentsPage"
import OwnerAiPlanPage from "@/pages/dashboard/owner/OwnerAiPlanPage"
import OwnerChatPage from "@/pages/dashboard/owner/OwnerChatPage"
import OwnerClinicRegistrationPage from "@/pages/dashboard/owner/OwnerClinicRegistrationPage"
import OwnerHistoryPage from "@/pages/dashboard/owner/OwnerHistoryPage"
import OwnerNotificationsPage from "@/pages/dashboard/owner/OwnerNotificationsPage"
import OwnerPetSharingPage from "@/pages/dashboard/owner/OwnerPetSharingPage"
import OwnerPetDetailPage from "@/pages/dashboard/owner/OwnerPetDetailPage"
import OwnerPetsPage from "@/pages/dashboard/owner/OwnerPetsPage"
import OwnerProfilePage from "@/pages/dashboard/owner/OwnerProfilePage"
import OwnerRemindersPage from "@/pages/dashboard/owner/OwnerRemindersPage"
import OwnerReviewsPage from "@/pages/dashboard/owner/OwnerReviewsPage"
import { CLINIC_PERMISSIONS } from "@/lib/clinicPermissions"

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
        path: "for-clinics",
        element: <ForClinicsPage />,
      },

      {
        path: "blog",
        element: <BlogListPage />,
      },

      {
        path: "blog/:slug",
        element: <BlogPostPage />,
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
        path: "auth/callback",
        element: <GoogleCallbackPage />,
      },

      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },

      {
        path: "set-password",
        element: (
          <RequireAuth>
            <SetPasswordPage />
          </RequireAuth>
        ),
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
        element: (
          <RequireAuth>
            <DashboardRedirect />
          </RequireAuth>
        ),
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
            path: "pets/:petId",
            element: <OwnerPetDetailPage />,
          },
          {
            path: "appointments",
            element: <OwnerAppointmentsPage />,
          },
          {
            path: "chat",
            element: <OwnerChatPage />,
          },
          {
            path: "ai-plan",
            element: <OwnerAiPlanPage />,
          },
          {
            path: "register-clinic",
            element: <OwnerClinicRegistrationPage />,
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
            path: "reminder-preferences",
            element: <Navigate to="/dashboard/owner/reminders" replace />,
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
          {
            path: "appointments",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.VIEW_APPOINTMENTS]}>
                <ClinicAppointmentsPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "pet-intake",
            element: <ClinicPetIntakePage />,
          },
          {
            path: "appointments/:appointmentId/visit",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.WRITE_MEDICAL_RECORD]}>
                <ClinicVisitPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "doctors",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.MANAGE_STAFF]}>
                <ClinicDoctorsPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "services",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.EDIT_INFO]}>
                <ClinicServicesPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "inventory",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.VIEW_INVENTORY]}>
                <ClinicInventoryPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "billing",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.VIEW_INVOICE]}>
                <ClinicBillingPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "billing/reconciliation",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.RECONCILE_PAYMENT]}>
                <ClinicReconciliationPage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "profile",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.EDIT_INFO]}>
                <ClinicProfilePage />
              </RequireClinicPermission>
            ),
          },
          {
            path: "payments",
            element: (
              <RequireClinicPermission permissions={[CLINIC_PERMISSIONS.CONFIGURE_PAYMENT]}>
                <ClinicPaymentSettingsPage />
              </RequireClinicPermission>
            ),
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
          {
            path: "ai",
            element: <AdminAiPage />,
          },
          {
            path: "chat-subscriptions",
            element: <AdminChatSubscriptionsPage />,
          },
          {
            path: "cta-report",
            element: <AdminCtaReportPage />,
          },
          {
            path: "clinics",
            element: <AdminClinicsPage />,
          },
          {
            path: "users",
            element: <AdminUsersPage />,
          },
          {
            path: "roles",
            element: <AdminRolesPage />,
          },
          {
            path: "alerts",
            element: <AdminAlertsPage />,
          },
          {
            path: "audit-logs",
            element: <AdminAuditLogsPage />,
          },
          {
            path: "settings",
            element: <AdminSettingsPage />,
          },
          {
            path: "profile",
            element: <AdminProfilePage />,
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
