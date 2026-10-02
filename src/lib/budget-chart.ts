import { allMonths } from '@/lib/constants'
import type { MonthlyDataGrid } from '@/services/budget-general'

export function monthlyChartData(data: MonthlyDataGrid, activeMonths: string[]) {
  const active = new Set(activeMonths)
  return allMonths.map(month => {
    const amount = active.has(month.value) ? data[month.value]?.total : undefined
    return { month: month.name, label: month.name.slice(0, 3), amount: typeof amount === 'number' && Number.isFinite(amount) ? amount : null }
  })
}
