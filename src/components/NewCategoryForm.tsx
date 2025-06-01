"use client"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function NewCategoryForm({
  selectedCategory,
  setSelectedCategory,
  budgetAmount,
  setBudgetAmount,
  addCategoryBudget,
  categories,
  categoryBudgets,
  categoryIcons,
}: {
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  budgetAmount: string
  setBudgetAmount: (value: string) => void
  addCategoryBudget: () => void
  categories: string[]
  categoryBudgets: { category: string }[]
  categoryIcons: { [key: string]: string }
}) {
  return (
    <Card className="mb-6 border-dashed border-2 border-blue-300">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <Label htmlFor="newCategory" className="text-sm font-medium text-blue-700">
              Nueva Categoría
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-blue-200">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => !categoryBudgets.find((b) => b.category === cat))
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryIcons[category]} {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="budgetAmount" className="text-sm font-medium text-blue-700">
              Presupuesto ($)
            </Label>
            <Input
              id="budgetAmount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="border-blue-200"
            />
          </div>
          <Button onClick={addCategoryBudget} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}