interface InsightsCardsProps {
  filteredGastos: any[]
  categoryData: any[]
  totalExpenses: number
}

export function InsightsCards({ filteredGastos, categoryData, totalExpenses }: InsightsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h4 className="font-medium text-green-800 dark:text-green-400">Información de Gastos</h4>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300">
          {filteredGastos.length > 0 
            ? `Has registrado ${filteredGastos.length} transacciones en este período`
            : "No hay transacciones en este período"
          }
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <h4 className="font-medium text-yellow-800 dark:text-yellow-400">Categorías Activas</h4>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Tienes gastos distribuidos en <strong>{categoryData.length}</strong> categorías diferentes
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h4 className="font-medium text-blue-800 dark:text-blue-400">Promedio Diario</h4>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {totalExpenses > 0 && filteredGastos.length > 0
            ? `Aproximadamente $${Math.round(totalExpenses / 30).toLocaleString()} por día`
            : "No hay datos suficientes para calcular"
          }
        </p>
      </div>
    </div>
  )
}
