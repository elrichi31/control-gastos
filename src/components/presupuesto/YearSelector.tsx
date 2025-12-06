import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface YearSelectorProps {
  selectedYear: string
  setSelectedYear: (year: string) => void
}

export function YearSelector({ selectedYear, setSelectedYear }: YearSelectorProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Año</label>
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-neutral-950 dark:border-neutral-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2023">2023</SelectItem>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
          <SelectItem value="2026">2026</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
