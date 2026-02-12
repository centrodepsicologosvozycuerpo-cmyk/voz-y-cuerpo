import { cn } from "@/lib/utils"

interface ChipProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline"
  className?: string
  onClick?: () => void
}

export function Chip({ children, variant = "default", className, onClick }: ChipProps) {
  const baseClass = cn(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
    {
      "bg-primary/10 text-primary": variant === "default",
      "bg-secondary text-secondary-foreground": variant === "secondary",
      "border border-input bg-background": variant === "outline",
    },
    onClick && "cursor-pointer hover:opacity-90 transition-opacity",
    className
  )
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
      >
        {children}
      </button>
    )
  }
  return <span className={baseClass}>{children}</span>
}



