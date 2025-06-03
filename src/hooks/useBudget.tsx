"use client"

import { useState, useEffect } from "react"
import { addMonths, isSameMonth } from "date-fns"
import type { Income, Expense } from "../types/budget"

export function useBudget() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  // Generar elementos recurrentes automáticamente
  const generateRecurringItems = () => {
    const monthsToGenerate = 12

    const originalRecurringIncomes = incomes.filter((income) => income.isRecurring && !income.originalId)
    const originalRecurringExpenses = expenses.filter((expense) => expense.isRecurring && !expense.originalId)

    const newIncomes: Income[] = []
    const newExpenses: Expense[] = []

    // Generar ingresos recurrentes
    originalRecurringIncomes.forEach((income) => {
      for (let i = 1; i <= monthsToGenerate; i++) {
        const newDate = addMonths(income.date, i)

        const existsInMonth = incomes.some(
          (existingIncome) => existingIncome.originalId === income.id && isSameMonth(existingIncome.date, newDate),
        )

        if (!existsInMonth) {
          newIncomes.push({
            id: `${income.id}-${i}`,
            description: income.description,
            amount: income.amount,
            date: newDate,
            isRecurring: true,
            originalId: income.id,
          })
        }
      }
    })

    // Generar gastos recurrentes
    originalRecurringExpenses.forEach((expense) => {
      for (let i = 1; i <= monthsToGenerate; i++) {
        const newDate = addMonths(expense.date, i)

        const existsInMonth = expenses.some(
          (existingExpense) => existingExpense.originalId === expense.id && isSameMonth(existingExpense.date, newDate),
        )

        if (!existsInMonth) {
          newExpenses.push({
            id: `${expense.id}-${i}`,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            date: newDate,
            isRecurring: true,
            originalId: expense.id,
          })
        }
      }
    })

    if (newIncomes.length > 0) {
      setIncomes((prev) => [...prev, ...newIncomes])
    }
    if (newExpenses.length > 0) {
      setExpenses((prev) => [...prev, ...newExpenses])
    }
  }

  useEffect(() => {
    generateRecurringItems()
  }, [incomes.filter((i) => i.isRecurring && !i.originalId), expenses.filter((e) => e.isRecurring && !e.originalId)])

  const addIncome = (incomeData: Omit<Income, "id">) => {
    const newIncome: Income = {
      id: Date.now().toString(),
      ...incomeData,
    }
    setIncomes([...incomes, newIncome])
  }

  const addExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expenseData,
    }
    setExpenses([...expenses, newExpense])
  }

  const deleteIncome = (id: string, deleteAll = false) => {
    const incomeToRemove = incomes.find((income) => income.id === id)

    if (!incomeToRemove) return

    if (deleteAll && incomeToRemove.isRecurring) {
      const originalId = incomeToRemove.originalId || incomeToRemove.id
      setIncomes(incomes.filter((income) => income.id !== originalId && income.originalId !== originalId))
    } else {
      setIncomes(incomes.filter((income) => income.id !== id))
    }
  }

  const deleteExpense = (id: string, deleteAll = false) => {
    const expenseToRemove = expenses.find((expense) => expense.id === id)

    if (!expenseToRemove) return

    if (deleteAll && expenseToRemove.isRecurring) {
      const originalId = expenseToRemove.originalId || expenseToRemove.id
      setExpenses(expenses.filter((expense) => expense.id !== originalId && expense.originalId !== originalId))
    } else {
      setExpenses(expenses.filter((expense) => expense.id !== id))
    }
  }

  return {
    incomes,
    expenses,
    addIncome,
    addExpense,
    deleteIncome,
    deleteExpense,
  }
}
