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
