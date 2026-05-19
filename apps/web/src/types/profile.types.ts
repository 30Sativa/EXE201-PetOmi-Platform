// Profile API response types
export interface CompleteProfileResponse {
  profileId: string
  userId: string
  fullName: string
  phone: string
  dateOfBirth: string | null
  gender: string
  address: string | null
  isProfileCompleted: boolean
}

export interface ProfileResponse {
  profileId: string
  userId: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  createdAt: string
  updatedAt: string | null
}
