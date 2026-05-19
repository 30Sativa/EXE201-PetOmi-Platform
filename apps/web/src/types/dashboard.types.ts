// Dashboard component prop types
export interface StatCardProps {
  label: string
  value: string
  icon: string
  hint?: string
}

export interface DashboardSectionProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}
