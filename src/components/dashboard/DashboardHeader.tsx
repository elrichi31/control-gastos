"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PageHeader } from "@/components/ui/page-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  currentDate: Date
}

export function DashboardHeader({ currentDate }: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Resumen"
      description={<span className="first-letter:uppercase inline-block">{format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>}
      actions={
        <Button size="sm" asChild>
          <Link href="/form"><Plus className="w-4 h-4 mr-1.5" />Agregar gasto</Link>
        </Button>
      }
    />
  )
}
