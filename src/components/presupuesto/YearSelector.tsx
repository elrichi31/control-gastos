import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchAvailableYears } from "@/services/budget-general"

interface YearSelectorProps {
  selectedYear: string
  setSelectedYear: (year: string) => void
}

export function YearSelector({ selectedYear, setSelectedYear }: YearSelectorProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadYears() {
      setLoading(true)
      try {
        const years = await fetchAvailableYears()
        setAvailableYears(years)
      } catch (error) {
        console.error("Error al cargar años:", error)
        // Fallback: año actual y siguiente
        const currentYear = new Date().getFullYear()
        setAvailableYears([currentYear, currentYear + 1])
      } finally {
        setLoading(false)
      }
    }

    loadYears()
  }, [])

  if (loading) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Año</label>
        <div className="w-full sm:w-48 h-10 bg-gray-100 dark:bg-neutral-800 rounded-md animate-pulse" />
      </div>
    )
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Año</label>
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-neutral-950 dark:border-neutral-700">
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
