import { useMutation, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"

import { getMeApi, verifyEmailApi } from "@/services/auth.service"
import { getProfileApi } from "@/services/profile.service"

import type {
  ActiveRoleResponse,
  GetCurrentUserResponse,
  GetSessionsResponse,
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
          {
            email: data.email,
            activeRole: data.activeRole,
            roles: data.roles,
          },
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

export function useMe() {
  return useQuery<GetCurrentUserResponse, Error>({
    queryKey: ["auth", "me"],
    queryFn: () => getMeApi(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useActiveRole() {
  return useQuery<ActiveRoleResponse, Error>({
    queryKey: ["auth", "active-role"],
    queryFn: () =>
      import("@/services/auth.service").then(
        (m) => m.getActiveRoleApi() as Promise<ActiveRoleResponse>,
      ),
    retry: false,
    staleTime: 30 * 1000,
  })
}

export function useSessions() {
  return useQuery<GetSessionsResponse, Error>({
    queryKey: ["auth", "sessions"],
    queryFn: () =>
      import("@/services/auth.service").then(
        (m) => m.getSessionsApi() as Promise<GetSessionsResponse>,
      ),
    retry: false,
    refetchOnWindowFocus: false,
  })
}
