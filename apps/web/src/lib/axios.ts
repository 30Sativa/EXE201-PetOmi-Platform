import axios from "axios"

import { tokenStorage } from "./tokenStorage"

export const AUTH_EVENTS = {
  TOKEN_REFRESHED: "auth:tokenRefreshed",
  LOGOUT: "auth:logout",
} as const

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5273/api"

export const api = axios.create({
  baseURL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = tokenStorage.getRefreshToken()

        if (!refreshToken) {
          tokenStorage.clearTokens()
          window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGOUT))
          window.location.href = "/auth"
          return Promise.reject(error)
        }

        const response = await axios.post(`${baseURL}/auth/refresh-token`, {
          refreshToken,
        })

        const data = response.data?.data ?? response.data

        const accessToken = data?.accessToken
        const newRefreshToken = data?.refreshToken

        if (!accessToken) {
          tokenStorage.clearTokens()
          window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGOUT))
          window.location.href = "/auth"
          return Promise.reject(error)
        }

        tokenStorage.setAccessToken(accessToken)

        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken)
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`

        const refreshedPayload = (() => {
          try {
            const base64Url = accessToken.split(".")[1]
            if (!base64Url) return null
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            )
            return JSON.parse(jsonPayload)
          } catch {
            return null
          }
        })()

        window.dispatchEvent(
          new CustomEvent(AUTH_EVENTS.TOKEN_REFRESHED, {
            detail: {
              accessToken,
              refreshToken: newRefreshToken,
              userId: refreshedPayload?.sub ?? refreshedPayload?.nameidentifier ?? "",
              email: refreshedPayload?.email ?? "",
            },
          })
        )

        return api(originalRequest)
      } catch {
        tokenStorage.clearTokens()
        window.dispatchEvent(new CustomEvent(AUTH_EVENTS.LOGOUT))
        window.location.href = "/auth"
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
