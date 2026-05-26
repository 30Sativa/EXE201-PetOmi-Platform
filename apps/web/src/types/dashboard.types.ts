// Dashboard component prop types
export interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}

export interface DashboardSectionProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}
