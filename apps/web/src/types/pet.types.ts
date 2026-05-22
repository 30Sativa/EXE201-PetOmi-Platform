// Pet related types matching backend DTOs

export interface PetResponse {
  petId: string
  ownerUserId: string
  name: string
  species: string
  breed: string | null
  gender: string | null
  dateOfBirth: string | null
  isBirthDateEstimated: boolean
  avatarUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export interface PetHealthProfileResponse {
  petId: string
  allergies: string[]
  preExistingConditions: string[]
  currentMedications: string[]
  lastVetVisit: string | null
  notes: string | null
}

export interface PetWeightLogResponse {
  weightLogId: string
  petId: string
  weightKg: number
  recordedAt: string
  notes: string | null
}

export interface PetMedicalRecordResponse {
  medicalRecordId: string
  petId: string
  clinicId: string
  diagnosis: string
  treatment: string
  prescribedMedications: string[]
  vetNotes: string | null
  nextFollowUpDate: string | null
  recordDate: string
}

export interface PetPhotoResponse {
  photoId: string
  petId: string
  photoUrl: string
  caption: string | null
  isPrimary: boolean
  uploadedAt: string
}

export interface PetUserAccessResponse {
  petUserAccessId: string
  petId: string
  userId: string
  accessRole: string
  grantedByUserId: string | null
  expiresAt: string | null
  isExpired: boolean
  createdAt: string
}
