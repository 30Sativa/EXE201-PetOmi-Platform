// Clinic
export interface ClinicListItemResponse {
  clinicId: string
  clinicName: string
  address: string | null
  phone: string | null
  email: string | null
  licenseNumber: string | null
  licenseImageUrl: string | null
  licenseCloudinaryPublicId: string | null
  status: string
  rejectedReason: string | null
  createdAt: string
}

// Admin Dashboard
export interface AdminStatsSummary {
  totalUsers: number
  totalClinics: number
  totalAppointments: number
  activeUsers: number
  inactiveUsers: number
}

export interface AdminClinicStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export interface AdminUserStats {
  owners: number
  vets: number
  admins: number
}

export interface ClinicTrendItem {
  date: string
  count: number
}

export interface UserTrendItem {
  date: string
  count: number
}

export interface AdminDashboardResponse {
  summary: AdminStatsSummary
  clinicStats: AdminClinicStats
  userStats: AdminUserStats
  clinicTrend: ClinicTrendItem[]
  userTrend: UserTrendItem[]
}

// Admin Users
export interface AdminUserListResponse {
  userId: string
  email: string
  fullName: string | null
  emailVerified: boolean
  isActive: boolean
  isProfileCompleted: boolean
  createdAt: string
  lastLoginAt: string | null
  roles: string[]
}

// Clinic Review
export interface ReviewClinicResponse {
  clinicId: string
  clinicName: string
  status: string
  rejectedReason: string | null
  reviewedByAdminId: string | null
  updatedAt: string | null
}

// Audit Log
export interface AuditLogItemResponse {
  AuditLogId: string
  UserId: string | null
  UserEmail: string | null
  UserFullName: string | null
  Action: string
  EntityType: string | null
  EntityId: string | null
  Severity: string
  Category: string
  IpAddress: string | null
  CreatedAt: string
}

// System Settings
export interface SystemSettingResponse {
  SettingKey: string
  SettingValue: string
  Category: string
  Description: string | null
  UpdatedAt: string
}

// Admin Alerts
export type AdminAlertType =
  | "pending_clinic"
  | "inactive_user"
  | "unverified_user"
  | "system"

export type AdminAlertSeverity = "high" | "medium" | "low"

export interface AdminAlertItemResponse {
  alertId: string
  type: AdminAlertType
  severity: AdminAlertSeverity
  title: string
  description: string
  timestamp: string
  clinic?: ClinicListItemResponse | null
  user?: AdminUserListResponse | null
}

export interface AdminAlertStatsResponse {
  total: number
  high: number
  medium: number
  low: number
}

export interface AdminAlertsResponse {
  items: AdminAlertItemResponse[]
  stats: AdminAlertStatsResponse
}
