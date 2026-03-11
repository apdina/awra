import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ReactNode } from "react"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface PageLayoutProps {
  children: ReactNode
  className?: string
  container?: "default" | "narrow" | "wide"
  padding?: "none" | "small" | "default" | "large"
}

export function PageLayout({ 
  children, 
  className, 
  container = "default",
  padding = "default" 
}: PageLayoutProps) {
  const containerClasses = {
    default: "container mx-auto px-4 sm:px-6 lg:px-8",
    narrow: "container mx-auto px-4 sm:px-6 max-w-4xl",
    wide: "container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12",
  }

  const paddingClasses = {
    none: "",
    small: "py-4",
    default: "py-8",
    large: "py-12",
  }

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      containerClasses[container],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface SectionProps {
  children: ReactNode
  className?: string
  size?: "small" | "default" | "large"
  id?: string
}

export function Section({ children, className, size = "default", id }: SectionProps) {
  const sizeClasses = {
    small: "py-8 md:py-12",
    default: "py-12 md:py-16 lg:py-20",
    large: "py-16 md:py-20 lg:py-24",
  }

  return (
    <section 
      id={id}
      className={cn(sizeClasses[size], className)}
    >
      {children}
    </section>
  )
}

interface GridProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | "auto"
  gap?: "sm" | "md" | "lg"
}

export function Grid({ children, className, cols = "auto", gap = "md" }: GridProps) {
  const getColsClasses = (cols: 1 | 2 | 3 | 4 | "auto") => {
    switch (cols) {
      case 1:
        return "grid grid-cols-1"
      case 2:
        return "grid grid-cols-1 md:grid-cols-2"
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      case "auto":
        return "grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]"
      default:
        return "grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]"
    }
  }

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div className={cn(getColsClasses(cols), gapClasses[gap], className)}>
      {children}
    </div>
  )
}

interface FlexProps {
  children: ReactNode
  className?: string
  justify?: "start" | "center" | "between" | "end"
  align?: "start" | "center" | "end"
  direction?: "row" | "col"
  gap?: "sm" | "md" | "lg"
}

export function Flex({ children, className, justify = "start", align = "center", direction = "row", gap = "md" }: FlexProps) {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    between: "justify-between",
    end: "justify-end",
  }

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
  }

  const directionClasses = {
    row: "flex-row",
    col: "flex-col",
  }

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div className={cn(
      "flex",
      justifyClasses[justify],
      alignClasses[align],
      directionClasses[direction],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface StackProps {
  children: ReactNode
  className?: string
  spacing?: "sm" | "md" | "lg"
}

export function Stack({ children, className, spacing = "md" }: StackProps) {
  const spacingClasses = {
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
  }

  return (
    <div className={cn("flex flex-col", spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}
