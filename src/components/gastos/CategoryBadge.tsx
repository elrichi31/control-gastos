import { Badge } from "@/components/ui/badge"
import { getCategoriaColor } from "@/lib/constants"
import { categoryIcon, categoryTone } from "@/lib/expense-icons"
import { cn } from "@/lib/utils"

/** Pastilla de categoría: mismo ícono y color que los chips del formulario, texto legible. */
export function CategoryBadge({ name, fallback = "Sin categoría", className }: { name?: string | null; fallback?: string; className?: string }) {
  const Icon = categoryIcon(name ?? "")
  return (
    <Badge className={cn("max-w-full rounded-full border font-normal", getCategoriaColor(name), className)} title={name ?? undefined}>
      <Icon aria-hidden="true" className={cn("size-3 shrink-0", categoryTone(name))} />
      <span className="truncate text-foreground">{name || fallback}</span>
    </Badge>
  )
}
