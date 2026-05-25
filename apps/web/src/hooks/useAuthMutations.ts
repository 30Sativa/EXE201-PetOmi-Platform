import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteAllSessionsApi, deleteSessionApi, resendVerificationApi } from "@/services/auth.service"
import { tokenStorage } from "@/lib/tokenStorage"

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation<{ message: string }, Error, string>({
    mutationFn: deleteSessionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    },
  })
}

export function useDeleteAllSessions() {
  return useMutation<{ message: string }, Error>({
    mutationFn: deleteAllSessionsApi,
    onSuccess: () => {
      tokenStorage.clearTokens()
      window.location.href = "/login"
    },
  })
}

export function useResendVerification() {
  return useMutation<{ message: string }, Error, string>({
    mutationFn: resendVerificationApi,
  })
}
