import { api } from "@/lib/axios"
import type {
  CreateWebsiteFeedbackRequest,
  PagedData,
  WebsiteFeedbackResponse,
} from "@/types"

const unwrapResponse = <T>(response: { data: T | { data: T } }): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = response.data as any
  if ("data" in data && data.data != null) {
    return data.data
  }
  return data
}

export const createWebsiteFeedbackApi = async (
  payload: CreateWebsiteFeedbackRequest,
): Promise<WebsiteFeedbackResponse> => {
  const response = await api.post("/website-feedback", payload)
  return unwrapResponse<WebsiteFeedbackResponse>(response)
}

export const getAdminWebsiteFeedbacksApi = async (params?: {
  search?: string
  category?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<PagedData<WebsiteFeedbackResponse>> => {
  const response = await api.get("/website-feedback/admin", {
    params: {
      search: params?.search || undefined,
      category: params?.category || undefined,
      status: params?.status || undefined,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    },
  })
  return unwrapResponse<PagedData<WebsiteFeedbackResponse>>(response)
}
