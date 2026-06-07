// Appointment related types matching backend DTOs

export interface AppointmentResponse {
  appointmentId: string
  clinicId: string
  vetClinicId: string | null
  serviceId: string | null
  petId: string
  bookedByUserId: string
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  status: string
  notes: string | null
  cancellationReason: string | null
  isWalkIn: boolean
  isLateCancellation: boolean
  confirmedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface CreateGuestWalkInIntakeRequest {
  clinicId: string
  ownerFullName: string
  ownerPhone: string
  ownerAddress?: string | null
  petName: string
  petSpecies: string
  petBreed?: string | null
  petGender?: string | null
  petDateOfBirth?: string | null
  isPetBirthDateEstimated: boolean
  vetClinicId?: string | null
  serviceId?: string | null
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  notes?: string | null
}

export interface GuestWalkInIntakeResponse {
  temporaryOwnerUserId: string
  temporaryOwnerEmail: string
  petId: string
  appointmentId: string
  appointment: AppointmentResponse
}

export interface AppointmentListItemResponse {
  appointmentId: string
  clinicId: string
  serviceId: string | null
  petId: string
  vetClinicId: string | null
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  status: string
  isWalkIn: boolean
  createdAt: string
}

export interface AvailableSlotResponse {
  vetClinicId: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface ClinicDoctorResponse {
  vetClinicId: string
  vetProfileId: string
  userId: string
  fullName: string
  avatarUrl: string | null
  specialization: string | null
  roleName: string
}

// Request types
export interface BookAppointmentRequest {
  petId: string
  clinicId: string
  vetClinicId: string
  serviceId?: string
  appointmentDate: string
  startTime: string
  endTime: string
  appointmentType: string
  notes?: string
}

export interface CancelAppointmentRequest {
  reason?: string
}

export interface RescheduleAppointmentRequest {
  newDate: string
  newStartTime: string
  newEndTime: string
  reason?: string
}

// Clinic info attached to appointment
export interface AppointmentWithClinic extends AppointmentListItemResponse {
  clinicName: string
  clinicAddress: string
}
