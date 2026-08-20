"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  currentDate: Date
}

export function DashboardHeader({ currentDate }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Resumen</h1>
        <p className="text-muted-foreground mt-1 first-letter:uppercase">
          {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>
      <Link href="/form" className="shrink-0">
        <Button size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Agregar gasto
        </Button>
      </Link>
    </header>
  )
}
