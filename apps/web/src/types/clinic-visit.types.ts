export interface CreateExaminationRequest {
  appointmentId: string
  chiefComplaint: string
  weightKg?: number | null
  temperatureC?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  examinationNotes?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
}

export interface UpdateExaminationRequest {
  chiefComplaint?: string | null
  weightKg?: number | null
  temperatureC?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  examinationNotes?: string | null
  diagnosis?: string | null
  treatmentPlan?: string | null
}

export interface ExaminationResponse {
  id: string
  appointmentId: string
  petId: string
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

export interface AddPrescriptionItemRequest {
  medicationName: string
  dosage: string
  frequency: string
  durationDays: number
  instructions?: string | null
  inventoryItemId?: string | null
}

export interface UpdatePrescriptionItemRequest {
  medicationName?: string | null
  dosage?: string | null
  frequency?: string | null
  durationDays?: number | null
  instructions?: string | null
  inventoryItemId?: string | null
}

export interface PrescriptionItemResponse {
  id: string
  examinationId: string
  medicationName: string
  dosage: string
  frequency: string
  durationDays: number
  instructions: string | null
  inventoryItemId: string | null
  createdAt: string
}

