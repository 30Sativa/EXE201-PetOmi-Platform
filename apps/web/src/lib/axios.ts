import axios from "axios"

import { decodeJwt, tokenStorage } from "./tokenStorage"

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

        const refreshedPayload = decodeJwt(accessToken)

        window.dispatchEvent(
          new CustomEvent(AUTH_EVENTS.TOKEN_REFRESHED, {
            detail: {
              accessToken,
              refreshToken: newRefreshToken,
              userId:
                refreshedPayload?.sub ??
                refreshedPayload?.nameid ??
                refreshedPayload?.nameidentifier ??
                "",
              email: refreshedPayload?.email ?? "",
              activeRole: data?.activeRole ?? refreshedPayload?.activeRole ?? "",
              roles: Array.isArray(data?.roles) ? data.roles : [],
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
