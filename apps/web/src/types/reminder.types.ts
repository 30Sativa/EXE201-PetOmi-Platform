// Reminder related types matching backend DTOs

export interface ReminderResponse {
  reminderId: string
  userId: string
  petId: string | null
  reminderType: string
  entityType: string | null
  entityId: string | null
  sourceType: string
  createdByUserId: string | null
  title: string
  message: string | null
  remindAt: string
  status: string
  isEnabled: boolean
  repeatRule: string | null
  repeatUntil: string | null
  sentAt: string | null
  dismissedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateReminderRequest {
  reminderType: string
  petId?: string
  entityType?: string
  entityId?: string
  sourceType?: string
  title: string
  message?: string
  remindAt: string
  repeatRule?: string
  repeatUntil?: string
}

// Reminder preferences
export interface ReminderPreferenceResponse {
  preferenceId: string
  userId: string
  reminderType: string
  isEnabled: boolean
  remindBeforeMinutes: number | null
  channel: string
  createdAt: string
  updatedAt: string | null
}

export interface UpdateReminderPreferenceRequest {
  reminderType: string
  isEnabled: boolean
  remindBeforeMinutes?: number
  channel?: string
}
