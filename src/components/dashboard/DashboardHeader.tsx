"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  currentDate: Date
}

export function DashboardHeader({ currentDate }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            ¡Hola! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
        <Link href="/form">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Agregar Gasto
          </Button>
        </Link>
      </div>
    </div>
  )
}
