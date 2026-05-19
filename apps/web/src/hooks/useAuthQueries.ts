import { useMutation, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"

import { verifyEmailApi } from "@/services/auth.service"
import { getProfileApi } from "@/services/profile.service"

import type {
  ProfileResponse,
  VerifyEmailResponse,
} from "@/types"

export function useVerifyEmail(token: string) {
  const { setAuthFromTokens } = useAuth()

  return useMutation<VerifyEmailResponse, Error>({
    mutationFn: () => verifyEmailApi(token),

    onSuccess: (data) => {
      if (data.accessToken && data.refreshToken) {
        setAuthFromTokens(
          data.accessToken,
          data.refreshToken,
        )
      }
    },
  })
}

export function useProfile() {
  return useQuery<ProfileResponse, Error>({
    queryKey: ["profile"],
    queryFn: () => getProfileApi(),
  })
}