import { cn } from "@/lib/utils"
import { BethaMark } from "./BethaMark"

/** Logo horizontal del kit: símbolo + "Betha" (700) + "Spend" (400, verde). El símbolo mide 1.3× el texto. */
export function BethaLogo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center font-bold leading-none tracking-[-0.025em] text-foreground", className)}
      style={{ fontSize: size, gap: size * 0.3 }}
    >
      <BethaMark size={size * 1.3} className="shrink-0 text-primary" />
      <span>
        Betha<span className="font-normal text-primary">Spend</span>
      </span>
    </span>
  )
}
