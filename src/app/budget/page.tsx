"use client"

import { useState } from "react"
import { useBudget } from "../../hooks/useBudget"
import { MonthSelector } from "../../components/budget/MonthSelector"
import { SummaryCards } from "../../components/budget/SummaryCards"
import { IncomeForm } from "../../components/budget/IncomeForm"
import { ExpenseForm } from "../../components/budget/ExpenseForm"
import { IncomeList } from "../../components/budget/IncomeList"
import { ExpenseList } from "../../components/budget/ExpenseList"
import { BudgetAnalysis } from "../../components/budget/BudgetAnalysis"
import { DeleteDialog } from "../../components/budget/DeleteDialog"
import type { Income, Expense } from "../../types/budget"

export default function BudgetTracker() {
  const { incomes, expenses, addIncome, addExpense, deleteIncome, deleteExpense } = useBudget()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "income" | "expense"
    item: Income | Expense | null
  }>({
    open: false,
    type: "income",
    item: null,
  })

  const isInSelectedMonth = (date: Date) => {
    return date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear()
  }

  const filteredIncomes = incomes.filter((income) => isInSelectedMonth(income.date))
  const filteredExpenses = expenses.filter((expense) => isInSelectedMonth(expense.date))

  const totalFilteredIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0)
  const totalFilteredExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const filteredBalance = totalFilteredIncome - totalFilteredExpenses

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const handleDeleteClick = (item: Income | Expense, type: "income" | "expense") => {
    if (item.isRecurring) {
      setDeleteDialog({
        open: true,
        type,
        item,
      })
    } else {
      if (type === "income") {
        deleteIncome(item.id)
      } else {
        deleteExpense(item.id)
      }
    }
  }

  const handleDeleteConfirm = (deleteAll: boolean) => {
    const { type, item } = deleteDialog

    if (!item) return

    if (type === "income") {
      deleteIncome(item.id, deleteAll)
    } else {
      deleteExpense(item.id, deleteAll)
    }

    setDeleteDialog({ open: false, type: "income", item: null })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Presupuesto Personal</h1>
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          <p className="text-gray-600 mt-2">Gestiona tus ingresos y gastos mensuales</p>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalIncome={totalFilteredIncome}
          totalExpenses={totalFilteredExpenses}
          balance={filteredBalance}
          formatCurrency={formatCurrency}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Income Section */}
          <div className="space-y-4">
            <IncomeForm onAddIncome={addIncome} />
            <IncomeList
              incomes={filteredIncomes}
              onDeleteIncome={(income) => handleDeleteClick(income, "income")}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Expenses Section */}
          <div className="space-y-4">
            <ExpenseForm onAddExpense={addExpense} />
            <ExpenseList
              expenses={filteredExpenses}
              onDeleteExpense={(expense) => handleDeleteClick(expense, "expense")}
              formatCurrency={formatCurrency}
            />
          </div>
        </div>

        {/* Budget Analysis */}
        <BudgetAnalysis
          incomes={filteredIncomes}
          expenses={filteredExpenses}
          selectedMonth={selectedMonth}
          balance={filteredBalance}
          formatCurrency={formatCurrency}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
          type={deleteDialog.type}
          item={deleteDialog.item}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  )
}
