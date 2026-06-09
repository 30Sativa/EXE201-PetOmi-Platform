export type PetHealthShareScope =
  | "EmergencySummary"
  | "ClinicVisit"
  | "FullHealthProfile"

export type PetHealthShareAccessMode = "Temporary" | "OneTime"

export interface CreatePetHealthShareRequest {
  scope: PetHealthShareScope
  accessMode: PetHealthShareAccessMode
  expiresAt?: string
  maxUses?: number
  clinicId?: string
  note?: string
}

export interface PetHealthShareResponse {
  shareTokenId: string
  petId: string
  ownerUserId: string
  clinicId: string | null
  displayCode: string
  scope: PetHealthShareScope
  accessMode: PetHealthShareAccessMode
  expiresAt: string
  maxUses: number | null
  usedCount: number
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
  createdByUserId: string
  note: string | null
  isExpired: boolean
  isRevoked: boolean
  hasReachedMaxUses: boolean
}

export interface PetHealthShareResolvedResponse {
  petId: string
  publicPetCode: string | null
  petName: string
  scope: PetHealthShareScope
  expiresAt: string
}

export interface ResolvePetHealthShareRequest {
  shareCode: string
}

export interface PetHealthOverviewResponse {
  pet: PetHealthOverviewPetResponse
  owner: PetHealthOverviewOwnerResponse | null
  healthProfile: PetHealthOverviewProfileResponse | null
  alerts: PetHealthOverviewAlertResponse[]
  medicalRecords: PetHealthOverviewMedicalRecordResponse[]
  examinations: PetHealthOverviewExaminationResponse[]
  prescriptions: PetHealthOverviewPrescriptionResponse[]
  appointments: PetHealthOverviewAppointmentResponse[]
  access: PetHealthOverviewAccessResponse
}

export interface PetHealthOverviewPetResponse {
  petId: string
  publicPetCode: string | null
  name: string
  species: string
  breed: string | null
  gender: string | null
  dateOfBirth: string | null
  ageText: string | null
  avatarUrl: string | null
}

export interface PetHealthOverviewOwnerResponse {
  ownerUserId: string
  fullName: string | null
  phone: string | null
  email: string | null
}

export interface PetHealthOverviewProfileResponse {
  currentWeightKg: number | null
  color: string | null
  isNeutered: string | null
  allergies: string | null
  chronicConditions: string | null
  microchipNumber: string | null
  updatedAt: string | null
}

export interface PetHealthOverviewAlertResponse {
  type: string
  title: string
  severity: string
}

export interface PetHealthOverviewMedicalRecordResponse {
  medicalRecordId: string
  recordType: string
  title: string
  description: string | null
  recordDate: string
  vetName: string | null
  clinicName: string | null
  medicationName: string | null
  dosage: string | null
  startDate: string | null
  endDate: string | null
  attachmentUrl: string | null
  createdAt: string
}

export interface PetHealthOverviewExaminationResponse {
  examinationId: string
  appointmentId: string
  vetClinicId: string | null
  chiefComplaint: string
  weightKg: number | null
  temperatureC: number | null
  heartRate: number | null
  respiratoryRate: number | null
  examinationNotes: string | null
  diagnosis: string | null
  treatmentPlan: string | null
  status: string
  createdAt: string
  completedAt: string | null
}

export interface PetHealthOverviewPrescriptionResponse {
  prescriptionId: string
  examinationId: string
  medicationName: string
  dosage: string
  frequency: string
  durationDays: number
  instructions: string | null
  inventoryItemId: string | null
  createdAt: string
}

export interface PetHealthOverviewAppointmentResponse {
  appointmentId: string
  clinicId: string
  vetClinicId: string | null
  serviceId: string | null
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  status: string
  notes: string | null
  isWalkIn: boolean
  createdAt: string
}

export interface PetHealthOverviewAccessResponse {
  source: string
  scope: PetHealthShareScope | string
  expiresAt: string | null
}
