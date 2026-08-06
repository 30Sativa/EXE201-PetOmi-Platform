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
  hasLicenseFile?: boolean
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
  averageTimeOnWebMinutes: number
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

export interface AdminAiStats {
  totalAiResponses: number
  aiResponsesLast7Days: number
  ragResponses: number
  ragResponsesLast7Days: number
  ragUsageRate: number
  failedResponsesLast7Days: number
  activeConversationsLast7Days: number
  averageChunksUsedLast7Days: number
  sourceBackedResponsesLast7Days: number
  totalTokensLast7Days: number
}

export interface ClinicTrendItem {
  date: string
  count: number
}

export interface UserTrendItem {
  date: string
  count: number
}

export interface AiIntentStatItem {
  intent: string
  count: number
  ragCount: number
}

export interface DemographicBucketItem {
  key: string
  label: string
  count: number
}

export interface AdminUserDemographics {
  ageGroups: DemographicBucketItem[]
  locations: DemographicBucketItem[]
}

export interface AdminDashboardResponse {
  summary: AdminStatsSummary
  clinicStats: AdminClinicStats
  userStats: AdminUserStats
  aiStats: AdminAiStats
  clinicTrend: ClinicTrendItem[]
  userTrend: UserTrendItem[]
  aiIntentStats: AiIntentStatItem[]
  userDemographics: AdminUserDemographics
}

// Admin user behavior analytics
export type AdminBehaviorOrigin = "ALL" | "REAL" | "SYNTHETIC"

export interface AdminUserBehaviorSummary {
  usersInDataset: number
  newUsers: number
  activeUsers: number
  activatedUsers: number
  returningUsers: number
  dormantUsers: number
  petsCreated: number
  conversations: number
  ownerMessages: number
  aiResponses: number
  medicalNotes: number
  remindersCreated: number
  totalSessions: number
  averageSessionMinutes: number
  averageDailyActiveUsers: number
  engagementRate: number
  activationRate: number
  returnRate: number
}

export interface AdminBehaviorFunnelItem {
  key: string
  label: string
  description: string
  users: number
  dropOffUsers: number
  conversionRate: number
}

export interface AdminFeatureAdoptionItem {
  key: string
  label: string
  description: string
  users: number
  events: number
  adoptionRate: number
}

export interface AdminUserSegmentItem {
  key: string
  label: string
  description: string
  users: number
  percentage: number
}

export interface AdminBehaviorInsightItem {
  severity: "positive" | "warning" | "opportunity"
  title: string
  description: string
  recommendedAction: string
  metric: string
}

export interface AdminChatTopicItem {
  intent: string
  label: string
  questions: number
  users: number
  percentage: number
}

export interface AdminTopQuestionItem {
  question: string
  intent: string
  intentLabel: string
  askCount: number
  users: number
  lastAskedAt: string
}

export interface AdminTopChatUserItem {
  userId: string
  email: string
  fullName: string | null
  questions: number
  conversations: number
  activeDays: number
}

export interface AdminChatBehaviorAnalytics {
  totalQuestions: number
  uniqueChatUsers: number
  questionsPerChatUser: number
  questionsPerConversation: number
  topTopics: AdminChatTopicItem[]
  topQuestions: AdminTopQuestionItem[]
  topUsers: AdminTopChatUserItem[]
}

export interface AdminUserBehaviorDailyItem {
  date: string
  activeUsers: number
  sessions: number
  conversations: number
  petsCreated: number
  ownerMessages: number
  aiResponses: number
  medicalNotes: number
  remindersCreated: number
}

export interface AdminUserBehaviorItem {
  userId: string
  email: string
  fullName: string | null
  isSynthetic: boolean
  accountCreatedAt: string
  petNames: string[]
  activeDays: number
  sessions: number
  conversations: number
  ownerMessages: number
  aiResponses: number
  medicalNotes: number
  remindersCreated: number
  featuresUsed: number
  totalActions: number
  engagementScore: number
  segment: string
  segmentLabel: string
  firstActivityAt: string | null
  lastActivityAt: string | null
  hasPet: boolean
  usedServiceInRange: boolean
  isReturning: boolean
}

export interface AdminUserBehaviorResponse {
  datasetLabel: string
  dataOrigin: AdminBehaviorOrigin
  fromDate: string
  toDate: string
  generatedAt: string
  summary: AdminUserBehaviorSummary
  chatAnalytics: AdminChatBehaviorAnalytics
  funnel: AdminBehaviorFunnelItem[]
  featureAdoption: AdminFeatureAdoptionItem[]
  segments: AdminUserSegmentItem[]
  insights: AdminBehaviorInsightItem[]
  dailyActivity: AdminUserBehaviorDailyItem[]
  users: AdminUserBehaviorItem[]
}

// Admin Roles
export interface AdminRoleStatsResponse {
  globalRoleCount: number
  clinicRoleCount: number
  totalPermissions: number
  assignedGlobalUsers: number
  assignedClinicStaff: number
}

export interface AdminPermissionItemResponse {
  permissionId: string
  permissionName: string
  description: string | null
}

export interface AdminRoleItemResponse {
  roleId: string
  roleName: string
  scope: "global" | "clinic"
  assignedCount: number
  permissions: AdminPermissionItemResponse[]
}

export interface AdminRolesResponse {
  stats: AdminRoleStatsResponse
  globalRoles: AdminRoleItemResponse[]
  clinicRoles: AdminRoleItemResponse[]
}

// Admin Users
export interface AdminUserListResponse {
  userId: string
  email: string
  fullName: string | null
  phone: string | null
  dateOfBirth: string | null
  address: string | null
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
  auditLogId: string
  userId: string | null
  userEmail: string | null
  userFullName: string | null
  action: string
  entityType: string | null
  entityId: string | null
  severity: string
  category: string
  ipAddress: string | null
  createdAt: string
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
