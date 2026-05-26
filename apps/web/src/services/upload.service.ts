import { api } from "@/lib/axios"

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  fileName: string
  fileSizeBytes: number
  width: number
  height: number
  format: string
}

export type ImageType = "user_avatar" | "pet_avatar" | "pet_photo"

interface UploadResponse {
  data: CloudinaryUploadResult
}

export const uploadImageApi = async (
  file: File,
  imageType: ImageType,
  resourceId?: string,
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData()
  formData.append("File", file)
  formData.append("ImageType", imageType)
  if (resourceId) {
    formData.append("ResourceId", resourceId)
  }

  const response = await api.post<UploadResponse>("/images", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data.data
}
