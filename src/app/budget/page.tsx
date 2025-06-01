"use client"

import { useState } from "react"
import { CategoryBudget, Expense } from "@/types"
import { categoryIcons, categories, paymentMethods } from "@/lib/constants"
import { BudgetHeader } from "../../components/BudgetHeader"
import { NewCategoryForm } from "../../components/NewCategoryForm"
import BudgetGrid from "../../components/BudgetGrid"

export default function BudgetPlanner() {
    const [forecastMonth, setForecastMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    })

    const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([])
    const [selectedCategory, setSelectedCategory] = useState("")
    const [budgetAmount, setBudgetAmount] = useState("")
    const [showAddExpense, setShowAddExpense] = useState("")
    const [newExpenseForm, setNewExpenseForm] = useState({
        description: "",
        amount: "",
        date: "",
        paymentMethod: "",
    })

    const getMonthName = (monthString: string) => {
        const [year, month] = monthString.split("-")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
        return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    }


    const addCategoryBudget = () => {
        if (!selectedCategory || !budgetAmount) return

        if (categoryBudgets.find((b) => b.category === selectedCategory)) return

        setCategoryBudgets((prev) => [
            ...prev,
            {
                category: selectedCategory,
                budgetAmount: Number(budgetAmount),
                plannedExpenses: [],
            },
        ])

        setSelectedCategory("")
        setBudgetAmount("")
    }

    const deleteCategoryBudget = (category: string) => {
        setCategoryBudgets((prev) => prev.filter((b) => b.category !== category))
    }

    const addPlannedExpense = (category: string) => {
        if (!newExpenseForm.description || !newExpenseForm.amount || !newExpenseForm.paymentMethod) return

        const newExpense: Expense = {
            id: Date.now().toString(),
            description: newExpenseForm.description,
            amount: Number(newExpenseForm.amount),
            category,
            date: newExpenseForm.date || `${forecastMonth}-01`,
            paymentMethod: newExpenseForm.paymentMethod,
        }

        setCategoryBudgets((prev) =>
            prev.map((b) =>
                b.category === category ? { ...b, plannedExpenses: [...b.plannedExpenses, newExpense] } : b,
            ),
        )

        setNewExpenseForm({ description: "", amount: "", date: "", paymentMethod: "" })
        setShowAddExpense("")
    }

    const deletePlannedExpense = (category: string, expenseId: string) => {
        setCategoryBudgets((prev) =>
            prev.map((b) =>
                b.category === category
                    ? { ...b, plannedExpenses: b.plannedExpenses.filter((e) => e.id !== expenseId) }
                    : b,
            ),
        )
    }

    const getTotalBudget = () => categoryBudgets.reduce((sum, b) => sum + b.budgetAmount, 0)

    const getTotalPlanned = () =>
        categoryBudgets.reduce(
            (sum, b) => sum + b.plannedExpenses.reduce((s, e) => s + e.amount, 0),
            0,
        )

    return (
        <div className="mt-8">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-blue-900">Planificación de Presupuesto</h2>
                <p className="text-blue-600 mt-2">Organiza tu presupuesto por categorías y planifica tus gastos</p>
            </div>

            <BudgetHeader
                forecastMonth={forecastMonth}
                setForecastMonth={setForecastMonth}
                getTotalBudget={getTotalBudget}
                getTotalPlanned={getTotalPlanned}
                getMonthName={getMonthName}
            />

            <NewCategoryForm
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                budgetAmount={budgetAmount}
                setBudgetAmount={setBudgetAmount}
                addCategoryBudget={addCategoryBudget}
                categoryBudgets={categoryBudgets}
                categories={categories} 
                categoryIcons={categoryIcons}
            />


            <BudgetGrid
                forecastMonth={forecastMonth}
                categoryBudgets={categoryBudgets}
                showAddExpense={showAddExpense}
                setShowAddExpense={setShowAddExpense}
                newExpenseForm={newExpenseForm}
                setNewExpenseForm={setNewExpenseForm}
                addPlannedExpense={addPlannedExpense}
                deletePlannedExpense={deletePlannedExpense}
                deleteCategoryBudget={deleteCategoryBudget}
            />
        </div>
    )
}
