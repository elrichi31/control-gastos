"use client"

import { useState, useEffect } from "react"
import { Breadcrumb } from "@/components/Breadcrumb"
import { PageTitle } from "@/components/PageTitle"
import { PresupuestoGrid } from "@/components/presupuesto/PresupuestoGrid"
import { YearSelector } from "@/components/presupuesto/YearSelector"
import { EmptyMonths } from "@/components/presupuesto/EmptyMonths"

interface MonthData {
  name: string
  value: string
  number: number
}

const allMonths: MonthData[] = [
  { name: "Enero", value: "enero", number: 1 },
  { name: "Febrero", value: "febrero", number: 2 },
  { name: "Marzo", value: "marzo", number: 3 },
  { name: "Abril", value: "abril", number: 4 },
  { name: "Mayo", value: "mayo", number: 5 },
  { name: "Junio", value: "junio", number: 6 },
  { name: "Julio", value: "julio", number: 7 },
  { name: "Agosto", value: "agosto", number: 8 },
  { name: "Septiembre", value: "septiembre", number: 9 },
  { name: "Octubre", value: "octubre", number: 10 },
  { name: "Noviembre", value: "noviembre", number: 11 },
  { name: "Diciembre", value: "diciembre", number: 12 },
]

// Estructura que devuelve el backend
interface PresupuestoBackend {
  id: number
  anio: number
  mes: number // 1-12
  total: number
  gastos_registrados: number
  tendencia: string | null
  estado: string // "En progreso", "Completado", etc
}

// Estado para el grid
interface MonthlyDataGrid {
  [key: string]: {
    total: number
    expenses: number
    status: "completed" | "in-progress" | "pending"
    trend: "up" | "down" | "stable"
    previousMonth: number,
    id: number
  }
}

function mapEstado(estado: string): "completed" | "in-progress" | "pending" {
  if (estado.toLowerCase().includes("complet")) return "completed"
  if (estado.toLowerCase().includes("progreso")) return "in-progress"
  return "pending"
}

function mapTendencia(tendencia: string | null): "up" | "down" | "stable" {
  if (tendencia === "up" || tendencia === "UP") return "up"
  if (tendencia === "down" || tendencia === "DOWN") return "down"
  return "stable"
}

export default function HomePage() {
  const [selectedYear, setSelectedYear] = useState<string>("2025")
  const [monthsByYear, setMonthsByYear] = useState<{ [year: string]: string[] }>({})
  const [dataByYear, setDataByYear] = useState<{ [year: string]: MonthlyDataGrid }>({})
  const [isMonthDialogOpen, setIsMonthDialogOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const currentMonth = new Date().getMonth() + 1

  useEffect(() => {
    async function fetchPresupuestos() {
      const res = await fetch(`/api/presupuestos?anio=${selectedYear}`)
      const data: PresupuestoBackend[] = await res.json()
      if (data.length > 0 && data[0].anio.toString() === selectedYear) {
        const grid: MonthlyDataGrid = {}
        const months: string[] = []
        data.forEach((item) => {
          const monthObj = allMonths[item.mes - 1]
          if (!monthObj) return
          months.push(monthObj.value)
          grid[monthObj.value] = {
            total: item.total,
            expenses: item.gastos_registrados,
            status: mapEstado(item.estado),
            trend: mapTendencia(item.tendencia),
            previousMonth: 0,
            id: item.id
          }
        })
        setMonthsByYear((prev) => ({ ...prev, [selectedYear]: months }))
        setDataByYear((prev) => ({ ...prev, [selectedYear]: grid }))
      } else {
        setMonthsByYear((prev) => ({ ...prev, [selectedYear]: [] }))
        setDataByYear((prev) => ({ ...prev, [selectedYear]: {} }))
      }
    }
    fetchPresupuestos()
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  const handleAddMonth = async (monthValue: string) => {
    setErrorMsg("")
    const monthObj = allMonths.find((m) => m.value === monthValue)
    if (!monthObj) return
    // Validación frontend
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    if (Number(selectedYear) < currentYear || (Number(selectedYear) === currentYear && monthObj.number < currentMonth)) {
      setErrorMsg("Solo puedes crear presupuestos de meses actuales o futuros.")
      return
    }
    await fetch("/api/presupuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anio: Number(selectedYear),
        mes: monthObj.number,
        total: 0,
        gastos_registrados: 0,
        tendencia: null,
        estado: "En progreso"
      })
    })
    setMonthsByYear((prev) => ({
      ...prev,
      [selectedYear]: [...(prev[selectedYear] || []), monthValue]
    }))
    setDataByYear((prev) => ({
      ...prev,
      [selectedYear]: {
        ...(prev[selectedYear] || {}),
        [monthValue]: {
          total: 0,
          expenses: 0,
          status: "in-progress",
          trend: "stable",
          previousMonth: 0,
          id: Date.now() // Usar un ID temporal, el backend asignará el real
        }
      }
    }))
    setIsMonthDialogOpen(false)
  }

  const handleRemoveMonth = async (monthValue: string) => {
    const hasData = dataByYear[selectedYear]?.[monthValue]?.expenses > 0
    if (!hasData) {
      // Eliminar en el backend
      await fetch(`/api/presupuestos?anio=${selectedYear}&mes=${allMonths.find(m => m.value === monthValue)?.number}`, {
        method: "DELETE"
      })
      // Actualizar estado local
      setMonthsByYear((prev) => ({
        ...prev,
        [selectedYear]: (prev[selectedYear] || []).filter((month) => month !== monthValue)
      }))
      setDataByYear((prev) => {
        const newData = { ...(prev[selectedYear] || {}) }
        delete newData[monthValue]
        return { ...prev, [selectedYear]: newData }
      })
    }
  }

  const getAvailableMonths = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    return allMonths
      .filter((month) => !(monthsByYear[selectedYear] || []).includes(month.value))
      .map((month) => {
        let disabled = false
        if (Number(selectedYear) < currentYear) {
          disabled = true
        } else if (Number(selectedYear) === currentYear && month.number < currentMonth) {
          disabled = true
        }
        return { ...month, disabled }
      })
  }

  // Renderizado
  const currentYear = new Date().getFullYear()
  const canAddMonth = Number(selectedYear) >= currentYear

  return (
    <div className="p-4 lg:p-8">
      <PageTitle customTitle={`Presupuestos ${selectedYear} - Control de Gastos`} />
      <Breadcrumb items={[{ label: "Presupuesto" }]} large />
      <div className="mb-8 mt-8">
        <YearSelector selectedYear={selectedYear} setSelectedYear={handleYearChange} />
      </div>
      {errorMsg && (
        <div className="text-center py-2">
          <p className="text-red-500 font-medium">{errorMsg}</p>
        </div>
      )}
      {(monthsByYear[selectedYear] || []).length === 0 ? (
        canAddMonth ? (
          <EmptyMonths
            allMonths={getAvailableMonths()} // ahora pasa los meses con 'disabled'
            isOpen={isMonthDialogOpen}
            setIsOpen={setIsMonthDialogOpen}
            onAdd={handleAddMonth}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No puedes crear presupuestos para años anteriores.</p>
          </div>
        )
      ) : (
        <PresupuestoGrid
          activeMonths={monthsByYear[selectedYear] || []}
          allMonths={allMonths}
          monthlyData={dataByYear[selectedYear] || {}}
          currentMonth={currentMonth}
          onRemoveMonth={handleRemoveMonth}
          availableMonths={getAvailableMonths()} // ya incluye 'disabled'
          isMonthDialogOpen={isMonthDialogOpen}
          setIsMonthDialogOpen={setIsMonthDialogOpen}
          onAddMonth={canAddMonth ? handleAddMonth : () => {}}
          canAddMonth={canAddMonth}
        />
      )}
      {getAvailableMonths().length === 0 && (monthsByYear[selectedYear] || []).length === allMonths.length && (
        <div className="text-center py-8">
          <p className="text-gray-500">Todos los meses del año están siendo utilizados</p>
        </div>
      )}
    </div>
  )
}
