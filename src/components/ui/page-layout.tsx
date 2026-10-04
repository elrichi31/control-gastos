import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Shared layout for authenticated app views (not landing/auth pages). */
/** fill: en desktop la página mide el alto de la ventana y la tabla (cadena lg:fill-y) llena
 *  el resto, así solo scrollea la tabla. El overflow-auto es la salida en pantallas muy bajas. */
export function PageShell({ className, fill, ...props }: HTMLAttributes<HTMLDivElement> & { fill?: boolean }) {
  return (
    <div
      className={cn("w-full min-w-0 max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6", fill && "lg:flex lg:flex-col lg:h-[calc(100dvh-3.5rem)] lg:overflow-auto", className)}
      {...props}
    />
  )
}

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
