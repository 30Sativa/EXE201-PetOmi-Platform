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
  logoUrl?: string | null
  logoCloudinaryPublicId?: string | null
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
  logoUrl: string | null
  logoCloudinaryPublicId: string | null
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
  vetClinicId: string | null
  clinicRoleId: string | null
  clinicRoleName: "ClinicOwner" | "PrimaryVet" | "Assistant" | "Cashier" | string | null
  clinicPermissions: string[]
}

export interface UpdateClinicInfoRequest {
  clinicName?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  logoCloudinaryPublicId?: string | null
  description?: string | null
  openingHours?: string | null
}

export interface UpdateClinicLocationRequest {
  latitude?: number | null
  longitude?: number | null
  appointmentBufferMins?: number | null
}

export interface ClinicLocationResponse {
  clinicId: string
  latitude: number | null
  longitude: number | null
  appointmentBufferMins: number
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

export interface AddClinicServiceRequest {
  serviceName: string
  description?: string | null
  price: number
  durationMins: number
}

export interface UpdateClinicServiceRequest {
  serviceName?: string | null
  description?: string | null
  price?: number | null
  durationMins?: number | null
}

export interface ClinicPublicResponse {
  clinicId: string
  clinicName: string
  address: string | null
  phone: string | null
  email: string | null
  logoUrl: string | null
  description: string | null
  openingHours: string | null
  services: ClinicServiceResponse[]
}

export interface ClinicDoctorListItemResponse {
  vetClinicId: string
  vetProfileId: string
  userId: string
  fullName: string
  avatarUrl: string | null
  specialization: string | null
  roleName: string
}

export interface ClinicPetSearchItemResponse {
  petId: string
  ownerUserId: string
  petName: string
  species: string
  breed: string | null
  gender: string | null
  avatarUrl: string | null
  ownerEmail: string
  ownerFullName: string | null
  ownerPhone: string | null
  lastAppointmentDate: string | null
  lastAppointmentStatus: string | null
}

export interface AssignStaffRequest {
  vetEmail?: string
  vetProfileId?: string
  role: "PrimaryVet" | "Assistant" | "Cashier" | string
}

export interface UpdateClinicStaffRoleRequest {
  role: "PrimaryVet" | "Assistant" | "Cashier" | string
}

export interface DeactivateClinicStaffRequest {
  reason: string
}

export interface DoctorScheduleResponse {
  scheduleId: string
  vetClinicId: string
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  isActive: boolean
}

export interface SetDoctorScheduleRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface InventoryItemResponse {
  itemId: string
  itemName: string
  unit: string | null
  quantity: number
  lowStockThreshold: number
  isLowStock: boolean
  unitPrice: number | null
  expiryDate: string | null
  imageUrl: string | null
  imageCloudinaryPublicId: string | null
  isExpired: boolean
  isActive: boolean
}

export interface AddInventoryItemRequest {
  itemName: string
  unit?: string | null
  quantity: number
  lowStockThreshold: number
  unitPrice?: number | null
  expiryDate?: string | null
  imageUrl?: string | null
  imageCloudinaryPublicId?: string | null
}

export interface StockAdjustRequest {
  amount: number
  note?: string | null
}

export interface ClinicSePayAccountResponse {
  clinicId: string
  provider: string
  bankCode: string
  bankName: string | null
  accountNumberMasked: string
  accountName: string | null
  isActive: boolean
}

export interface UpsertClinicSePayAccountRequest {
  bankCode: string
  accountNumber: string
  bankName?: string | null
  accountName?: string | null
}
