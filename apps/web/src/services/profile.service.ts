import { api } from "../lib/axios"
import type { CompleteProfileForm, UpdateProfileForm } from "../schemas/profile.schema"
import type { CompleteProfileResponse, ProfileResponse } from "@/types"

export const completeProfileApi = async (
  data: CompleteProfileForm,
): Promise<CompleteProfileResponse> => {
  const response = await api.post("/profile/complete", data)

  return response.data?.data ?? response.data
}

export const getProfileApi = async (): Promise<ProfileResponse> => {
  const response = await api.get("/profile")

  return response.data?.data ?? response.data
}

export const updateProfileApi = async (
  data: UpdateProfileForm,
): Promise<ProfileResponse> => {
  const response = await api.put("/profile", data)

  return response.data?.data ?? response.data
}
