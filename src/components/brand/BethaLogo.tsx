import { cn } from "@/lib/utils"
import { BethaMark } from "./BethaMark"

/** Logo horizontal del kit: símbolo + "Betha" (700) + "Spend" (400, verde). El símbolo (recortado al trazo) mide 1.12× el texto. */
export function BethaLogo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center font-bold leading-none tracking-[-0.025em] text-foreground", className)}
      style={{ fontSize: size, gap: size * 0.32 }}
    >
      <BethaMark tight size={size * 1.12} className="shrink-0 text-primary" />
      <span>
        Betha<span className="font-normal text-primary">Spend</span>
      </span>
    </span>
  )
}
