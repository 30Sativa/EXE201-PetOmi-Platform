// Landing page component prop types
export interface NavLink {
  label: string
  href: string
}

export interface NavbarProps {
  links?: NavLink[]
}

// Note: Highlight, ServiceItem, StatItem, AdminHighlight
// have icon as Lucide component type (React.ComponentType)
// so they are kept inline in their respective component files
// to avoid circular dependencies with lucide-react

export interface Testimonial {
  name: string
  role: string
  quote: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface Slot {
  time: string
  label: string
}
