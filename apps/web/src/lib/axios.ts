import axios from "axios"

import { tokenStorage } from "./tokenStorage"

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7297/api"

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

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = tokenStorage.getRefreshToken()
                if (!refreshToken) {
                    tokenStorage.clearTokens()
                    window.location.href = "/auth"
                    return Promise.reject(error)
                }

                const response = await axios.post(`${baseURL}/auth/refresh-token`, {
                    refreshToken,
                })

                const { accessToken, refreshToken: newRefreshToken } = response.data.data ?? {}
                if (accessToken) {
                    tokenStorage.setAccessToken(accessToken)
                }
                if (newRefreshToken) {
                    tokenStorage.setRefreshToken(newRefreshToken)
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                return api(originalRequest)
            } catch {
                tokenStorage.clearTokens()
                window.location.href = "/auth"
                return Promise.reject(error)
            }
        }

        return Promise.reject(error)
    },
)