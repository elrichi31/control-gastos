interface PeriodSummaryWidgetProps {
  maxMonth: { month: string; amount: number }
  minMonth: { month: string; amount: number }
  topCategory: { name: string; value: number }
  categoryPercentage: string
  totalExpenses: number
  filteredGastos: any[]
  totalTransactions: number
}

export function PeriodSummaryWidget({
  maxMonth,
  minMonth,
  topCategory,
  categoryPercentage,
  totalExpenses,
  filteredGastos,
  totalTransactions
}: PeriodSummaryWidgetProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-neutral-800 dark:to-neutral-700 rounded-lg p-6 border border-blue-200 dark:border-neutral-600 h-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen del Período</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {maxMonth.amount > 0 && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mes con mayor gasto:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {maxMonth.month} (${maxMonth.amount.toLocaleString()})
              </span>
            </div>
          )}
          {minMonth.amount < Infinity && minMonth.amount > 0 && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mes con menor gasto:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {minMonth.month} (${minMonth.amount.toLocaleString()})
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400">Categoría principal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {topCategory.name} ({categoryPercentage}%)
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total de gastos:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">${totalExpenses.toLocaleString()}</span>
          </div>
          {filteredGastos.length > 0 && (
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gasto promedio por transacción:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                ${Math.round(totalExpenses / filteredGastos.length).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm text-gray-600 dark:text-gray-400">Número de transacciones:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{totalTransactions}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
