"use client"

import { RecurringExpenseList } from "@/components/RecurringExpenseList"
import { PageTitle } from "@/components/PageTitle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <PageTitle customTitle="Gastos Recurrentes - Control de Gastos" />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gastos Recurrentes</h1>
          <p className="text-gray-600">Gestiona tus gastos que se repiten automáticamente</p>
        </div>

        <RecurringExpenseList />

        {/* Información de cómo funcionan */}
        {showInfo && (
          <Card className="shadow-lg border-2 border-blue-100 bg-blue-50 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseInfo}
              className="absolute top-3 right-3 h-8 w-8 p-0 hover:bg-blue-100"
            >
              <X className="w-4 h-4" />
            </Button>
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">💡 ¿Cómo funcionan los gastos recurrentes?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-800 pr-12">
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
