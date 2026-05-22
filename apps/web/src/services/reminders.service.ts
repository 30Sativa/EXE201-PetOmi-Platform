import { api } from "@/lib/axios"
import type { ReminderResponse } from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

export const getRemindersApi = async (): Promise<ReminderResponse[]> => {
  const response = await api.get("/reminders")
  const result = unwrapResponse<ReminderResponse[]>(response)
  return Array.isArray(result) ? result : []
}

export const createReminderApi = async (
  data: Record<string, unknown>,
): Promise<ReminderResponse> => {
  const response = await api.post("/reminders", data)
  return unwrapResponse<ReminderResponse>(response)
}

export const toggleReminderApi = async (
  reminderId: string,
): Promise<ReminderResponse> => {
  const response = await api.post(`/reminders/${reminderId}/toggle`)
  return unwrapResponse<ReminderResponse>(response)
}

export const dismissReminderApi = async (
  reminderId: string,
): Promise<ReminderResponse> => {
  const response = await api.post(`/reminders/${reminderId}/dismiss`)
  return unwrapResponse<ReminderResponse>(response)
}
