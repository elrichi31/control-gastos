"use client"

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus } from "lucide-react"
import { categoryIcons, paymentMethods } from "../lib/constants"
import { CategoryBudget, Expense } from "@/types"

type Props = {
    forecastMonth: string
    categoryBudgets: CategoryBudget[]
    showAddExpense: string
    setShowAddExpense: (category: string) => void
    newExpenseForm: {
        description: string
        amount: string
        date: string
        paymentMethod: string
    }
    setNewExpenseForm: (form: {
        description: string
        amount: string
        date: string
        paymentMethod: string
    }) => void
    addPlannedExpense: (category: string) => void
    deletePlannedExpense: (category: string, expenseId: string) => void
    deleteCategoryBudget: (category: string) => void
}

export default function BudgetGrid({
    forecastMonth,
    categoryBudgets,
    showAddExpense,
    setShowAddExpense,
    newExpenseForm,
    setNewExpenseForm,
    addPlannedExpense,
    deletePlannedExpense,
    deleteCategoryBudget,
}: Props) {
    if (categoryBudgets.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No hay categorías de presupuesto configuradas</p>
                <p className="text-sm">Agrega una categoría arriba para comenzar a planificar</p>
            </div>
        )
    }

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((budget) => {
                const totalPlanned = budget.plannedExpenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0)
                const percentage = budget.budgetAmount > 0 ? (totalPlanned / budget.budgetAmount) * 100 : 0

                return (
                    <Card key={budget.category} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{categoryIcons[budget.category]}</span>
                                    <div>
                                        <CardTitle className="text-lg text-blue-900">{budget.category}</CardTitle>
                                        <CardDescription className="text-blue-600">
                                            ${totalPlanned.toFixed(2)} / ${budget.budgetAmount.toFixed(2)}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteCategoryBudget(budget.category)}
                                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <Progress value={Math.min(percentage, 100)} className="h-2 mt-2" />
                            <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% utilizado</p>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {budget.plannedExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-blue-900">{expense.description}</p>
                                            <p className="text-xs text-blue-600">{expense.paymentMethod}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-blue-700">${expense.amount.toFixed(2)}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deletePlannedExpense(budget.category, expense.id)}
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {showAddExpense === budget.category ? (
                                <div className="space-y-2 border-t pt-3">
                                    <Input
                                        placeholder="Descripción del gasto"
                                        value={newExpenseForm.description}
                                        onChange={(e) => setNewExpenseForm({ ...newExpenseForm, description: e.target.value })}
                                        className="text-sm"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Monto"
                                            value={newExpenseForm.amount}
                                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                                            className="text-sm"
                                        />
                                        <Input
                                            type="date"
                                            value={newExpenseForm.date}
                                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })}
                                            min={`${forecastMonth}-01`}
                                            max={`${forecastMonth}-31`}
                                            className="text-sm"
                                        />
                                    </div>
                                    <Select
                                        value={newExpenseForm.paymentMethod}
                                        onValueChange={(value) => setNewExpenseForm({ ...newExpenseForm, paymentMethod: value })}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder="Método de pago" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((method) => (
                                                <SelectItem key={method} value={method}>
                                                    {method}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => addPlannedExpense(budget.category)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        >
                                            Agregar
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setShowAddExpense("")}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAddExpense(budget.category)}
                                    className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Gasto Planificado
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
