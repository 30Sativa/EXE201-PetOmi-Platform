// ==================== PET ====================

export interface PetResponse {
  petId: string
  ownerUserId: string
  name: string
  species: string
  breed: string | null
  gender: string | null
  isNeutered: string | null   // "Yes" | "No" | "Unknown"
  dateOfBirth: string | null  // DateOnly ISO string: "2023-01-15"
  isBirthDateEstimated: boolean
  avatarUrl: string | null
  avatarCloudinaryPublicId: string | null
  color: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreatePetRequest {
  name: string
  species: string  // "Dog" | "Cat"
  breed?: string
  gender?: string  // "Male" | "Female" | "Unknown"
  isNeutered?: string  // "Yes" | "No" | "Unknown"
  dateOfBirth?: string  // DateOnly ISO: "2023-01-15"
  isBirthDateEstimated: boolean
  avatarUrl?: string
  avatarCloudinaryPublicId?: string
  color?: string
}

export interface UpdatePetRequest {
  name?: string
  species?: string
  breed?: string | null
  gender?: string | null
  isNeutered?: string | null
  dateOfBirth?: string | null
  isBirthDateEstimated?: boolean
  avatarUrl?: string | null
  avatarCloudinaryPublicId?: string | null
  color?: string | null
}

// ==================== HEALTH PROFILE ====================

export interface PetHealthProfileResponse {
  petHealthProfileId: string
  petId: string
  currentWeightKg: number | null
  color: string | null
  isNeutered: string | null
  allergies: string | null
  chronicConditions: string | null
  microchipNumber: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreatePetHealthProfileRequest {
  currentWeightKg?: number
  color?: string
  isNeutered?: string
  allergies?: string
  chronicConditions?: string
  microchipNumber?: string
}

export interface UpdatePetHealthProfileRequest {
  currentWeightKg?: number | null
  color?: string | null
  isNeutered?: string | null
  allergies?: string | null
  chronicConditions?: string | null
  microchipNumber?: string | null
}

// ==================== WEIGHT LOGS ====================

export interface PetWeightLogResponse {
  weightLogId: string
  petId: string
  weightKg: number
  measuredAt: string  // DateTime ISO
  source: string | null
  note: string | null
  createdAt: string
}

export interface CreatePetWeightLogRequest {
  weightKg: number
  measuredAt: string  // DateTime ISO
  source?: string
  note?: string
}

// ==================== MEDICAL RECORDS ====================

export interface PetMedicalRecordResponse {
  medicalRecordId: string
  petId: string
  recordType: string
  title: string
  description: string | null
  recordDate: string  // DateOnly ISO
  vetName: string | null
  clinicName: string | null
  medicationName: string | null
  dosage: string | null
  startDate: string | null
  endDate: string | null
  attachmentUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreatePetMedicalRecordRequest {
  recordType: string
  title: string
  description?: string
  recordDate: string  // DateOnly ISO
  vetName?: string
  clinicName?: string
  medicationName?: string
  dosage?: string
  startDate?: string
  endDate?: string
  attachmentUrl?: string
}

export interface UpdatePetMedicalRecordRequest {
  recordType?: string
  title?: string
  description?: string | null
  recordDate?: string
  vetName?: string | null
  clinicName?: string | null
  medicationName?: string | null
  dosage?: string | null
  startDate?: string | null
  endDate?: string | null
  attachmentUrl?: string | null
}

// ==================== PHOTOS ====================

export interface PetPhotoResponse {
  photoId: string
  petId: string
  imageUrl: string
  caption: string | null
  isAvatar: boolean
  takenAt: string | null
  createdAt: string
}

export interface CreatePetPhotoRequest {
  imageUrl: string
  cloudinaryPublicId?: string
  caption?: string
  isAvatar: boolean
  takenAt?: string
}

export interface UpdatePetPhotoRequest {
  caption?: string | null
  setAsAvatar?: boolean | null
}

export interface SetPetAvatarRequest {
  photoId: string
}

// ==================== USER ACCESS / SHARING ====================

export interface PetUserAccessResponse {
  petUserAccessId: string
  petId: string
  userId: string
  accessRole: string  // "Viewer" | "Editor"
  grantedByUserId: string | null
  expiresAt: string | null
  isExpired: boolean
  createdAt: string
}

export interface GrantPetAccessRequest {
  userEmail: string
  accessRole: string  // "Viewer" | "Editor"
  expiresAt?: string  // DateTime ISO
}

export interface UpdatePetAccessRequest {
  accessRole: string
  expiresAt?: string | null
}

// ==================== PET TIMELINE ====================

export interface PetActivityResponse {
  activityId: string
  petId: string
  activityType: string
  title: string
  description: string | null
  occurredAt: string
  createdAt: string
  sourceId: string | null
  icon: string
  color: string
  metadata: string | null
}

export interface PetTimelineResponse {
  activities: PetActivityResponse[]
  totalCount: number
  page: number
  pageSize: number
  hasNextPage: boolean
}
