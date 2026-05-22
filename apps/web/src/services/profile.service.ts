import { api } from "@/lib/axios"
import type { CompleteProfileForm, UpdateProfileForm } from "@/schemas/profile.schema"
import type { CompleteProfileResponse, ProfileResponse } from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

export const completeProfileApi = async (
  data: CompleteProfileForm,
): Promise<CompleteProfileResponse> => {
  const response = await api.post("/profile/complete", data)
  return unwrapResponse<CompleteProfileResponse>(response)
}

export const getProfileApi = async (): Promise<ProfileResponse> => {
  const response = await api.get("/profile")
  return unwrapResponse<ProfileResponse>(response)
}

export const updateProfileApi = async (
  data: UpdateProfileForm,
): Promise<ProfileResponse> => {
  const response = await api.put("/profile", data)
  return unwrapResponse<ProfileResponse>(response)
}
