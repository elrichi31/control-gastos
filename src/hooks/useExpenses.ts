import { useState, useEffect } from "react"

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  paymentMethod: string
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/gastos")
      const data = await res.json()

      const today = new Date()
      const last7days = new Date(today)
      last7days.setDate(today.getDate() - 7)

      const recent = data.filter((item: any) => {
        const date = new Date(item.date)
        return date >= last7days && date <= today
      })

      const formatted = recent.map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: parseFloat(e.amount),
        category: e.category,
        date: e.date,
        paymentMethod: e.paymentMethod,
      }))

      setExpenses(formatted)
    } catch (err) {
      console.error("Error al obtener datos del backend", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  return {
    expenses,
    isLoading,
    setExpenses,
    fetchExpenses,
  }
}
