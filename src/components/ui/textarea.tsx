import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
