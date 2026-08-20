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
