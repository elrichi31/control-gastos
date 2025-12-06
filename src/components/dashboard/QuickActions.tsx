"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card className="dark:bg-neutral-900 dark:border-neutral-700">
      <CardHeader>
        <CardTitle className="dark:text-white">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/form" className="block">
          <Button variant="outline" className="w-full justify-start dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo Gasto
          </Button>
        </Link>
        <Link href="/estadisticas" className="block">
          <Button variant="outline" className="w-full justify-start dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Ver Estadísticas
          </Button>
        </Link>
        <Link href="/presupuesto" className="block">
          <Button variant="outline" className="w-full justify-start dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-700">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Gestionar Presupuesto
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
