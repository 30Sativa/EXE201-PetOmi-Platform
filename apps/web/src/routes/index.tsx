import { createBrowserRouter } from "react-router-dom"

import App from "@/App"
import AuthPage from "@/pages/AuthPage"
import ErrorPage from "@/pages/ErrorPage"
import ForgotPasswordPage from "@/pages/ForgotPasswordPage"
import LandingPage from "@/pages/LandingPage"
import NotFoundPage from "@/pages/NotFoundPage"

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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
])

export default router
