"use client"

import { RecurringExpenseList } from "@/components/RecurringExpenseList"
import { PageTitle } from "@/components/PageTitle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function GastosRecurrentesPage() {
  const [showInfo, setShowInfo] = useState(true)

  // Cargar estado del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hideRecurringExpensesInfo')
    if (saved === 'true') {
      setShowInfo(false)
    }
  }, [])

  const handleCloseInfo = () => {
    setShowInfo(false)
    localStorage.setItem('hideRecurringExpensesInfo', 'true')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <PageTitle customTitle="Gastos Recurrentes - BethaSpend" />
      
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gastos recurrentes</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus gastos que se repiten automáticamente.</p>
          </div>
          <Link href="/form?tipo=recurrente" className="shrink-0">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Nuevo recurrente
            </Button>
          </Link>
        </header>

        <RecurringExpenseList />

        {/* Información de cómo funcionan */}
        {showInfo && (
          <Card className="relative bg-muted/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseInfo}
              className="absolute top-3 right-3 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
            <CardHeader>
              <CardTitle className="text-base font-semibold">¿Cómo funcionan los gastos recurrentes?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground pr-12">
              <p>
                <strong>Semanal:</strong> El gasto se creará automáticamente cada semana en el día que especifiques.
              </p>
              <p>
                <strong>Mensual:</strong> El gasto se creará automáticamente cada mes en el día que especifiques (máximo día 28).
              </p>
              <p>
                <strong>Fecha de fin:</strong> Opcional. Si la activas, el gasto dejará de crearse después de esa fecha.
              </p>
              <p>
                <strong>Activo/Inactivo:</strong> Puedes pausar temporalmente un gasto recurrente sin eliminarlo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
