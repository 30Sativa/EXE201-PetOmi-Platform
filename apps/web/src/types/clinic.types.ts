export interface CreateVetProfileRequest {
  licenseNumber?: string | null
  specialization?: string | null
}

export interface CreateVetProfileResponse {
  vetProfileId: string
  userId: string
  licenseNumber: string | null
  specialization: string | null
}

export interface CreateClinicRequest {
  clinicName: string
  address?: string | null
  phone?: string | null
  email?: string | null
  licenseNumber?: string | null
  licenseImageUrl?: string | null
  licenseCloudinaryPublicId?: string | null
}

export interface CreateClinicResponse {
  clinicId: string
  vetProfileId: string
  clinicName: string
  address: string | null
  phone: string | null
  email: string | null
  licenseNumber: string | null
  licenseImageUrl: string | null
  licenseCloudinaryPublicId: string | null
  status: string
}

export interface MyClinicResponse {
  clinicId: string
  clinicName: string
  address: string | null
  phone: string | null
  email: string | null
  licenseNumber: string | null
  licenseImageUrl: string | null
  logoUrl: string | null
  logoCloudinaryPublicId: string | null
  licenseCloudinaryPublicId: string | null
  status: string
  rejectedReason: string | null
  createdAt: string
  updatedAt: string | null
}

export interface ClinicSearchResult {
  clinicId: string
  clinicName: string
  address: string | null
  logoUrl: string | null
  description: string | null
  openingHours: string | null
  distanceKm: number | null
  appointmentBufferMins: number
}

export interface ClinicServiceResponse {
  serviceId: string
  serviceName: string
  description: string | null
  price: number
  durationMins: number
  isActive: boolean
}
