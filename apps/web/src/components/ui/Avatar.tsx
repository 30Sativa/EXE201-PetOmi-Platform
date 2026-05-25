import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  alt: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const initials = fallback ?? getInitials(alt)

  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-po-primary-soft font-bold text-po-primary",
          sizeClasses[size],
          className,
        )}
        aria-label={alt}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "rounded-full object-cover",
        sizeClasses[size],
        className,
      )}
    />
  )
}
