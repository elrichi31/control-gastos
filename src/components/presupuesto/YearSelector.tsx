import { useRemoteQuery } from "@/hooks/useRemoteData"
import { queryKeys } from "@/lib/query/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchAvailableYears } from "@/services/budget-general"

interface YearSelectorProps {
  selectedYear: string
  setSelectedYear: (year: string) => void
}

export function YearSelector({ selectedYear, setSelectedYear }: YearSelectorProps) {
  const query = useRemoteQuery([...queryKeys.budgets, 'years'], fetchAvailableYears)
  const currentYear = new Date().getFullYear()
  const availableYears = query.data ?? [currentYear, currentYear + 1]
  const loading = query.isPending

  if (loading) {
    return (
      <div className="w-full sm:w-36 h-10 bg-muted rounded-md animate-pulse" />
    )
  }

  return (
    <div>
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-full sm:w-36 bg-card border-border" aria-label="Año">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
