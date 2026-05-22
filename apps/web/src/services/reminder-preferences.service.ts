import { api } from "@/lib/axios"
import type {
  ReminderPreferenceResponse,
  UpdateReminderPreferenceRequest,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

export const getReminderPreferencesApi = async (): Promise<
  ReminderPreferenceResponse[]
> => {
  const response = await api.get("/reminders/preferences")
  return unwrapResponse<ReminderPreferenceResponse[]>(response)
}

export const updateReminderPreferencesApi = async (
  data: UpdateReminderPreferenceRequest,
): Promise<ReminderPreferenceResponse> => {
  const response = await api.put("/reminders/preferences", data)
  return unwrapResponse<ReminderPreferenceResponse>(response)
}
