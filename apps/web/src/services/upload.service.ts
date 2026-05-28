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

export type ImageType =
  | "user_avatar"
  | "pet_avatar"
  | "pet_photo"
  | "clinic_logo"
  | "clinic_license"
  | "medical_attachment"

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

  const response = await api.post<UploadResponse>("/images", formData)

  return response.data.data
}
