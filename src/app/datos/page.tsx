import React from 'react'
import BudgetProgressBar from '@/components/BudgetProgressBar'

export default function DatosPage() {
  // Ejemplo de datos
  const categoria = "Alimentación"
  const presupuestoTotal = 1000
  const presupuestoConsumido = 1050
  const mes = 7 // julio
  const anio = 2025

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <BudgetProgressBar
        categoria={categoria}
        presupuestoTotal={presupuestoTotal}
        presupuestoConsumido={presupuestoConsumido}
        mes={mes}
        anio={anio}
      />
    </div>
  )
}