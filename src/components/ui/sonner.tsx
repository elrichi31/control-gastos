"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Toaster de shadcn/ui adaptado a nuestros tokens HSL.
const Toaster = (props: ToasterProps) => {
  const { theme = "system" } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={{
        "--normal-bg": "hsl(var(--popover))",
        "--normal-text": "hsl(var(--popover-foreground))",
        "--normal-border": "hsl(var(--border))",
        "--success-bg": "hsl(var(--popover))",
        "--success-text": "hsl(var(--primary))",
        "--success-border": "hsl(var(--primary) / 0.35)",
        "--error-bg": "hsl(var(--popover))",
        "--error-text": "hsl(var(--destructive))",
        "--error-border": "hsl(var(--destructive) / 0.35)",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties}
      toastOptions={{ classNames: { toast: "font-sans text-[13px] shadow-lg", description: "text-muted-foreground" } }}
      {...props}
    />
  )
}

export { Toaster }
