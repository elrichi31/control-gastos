"use client"

import { useMemo } from "react"
import {
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, subYears, differenceInCalendarDays, addDays,
  isSameDay, getDate, getDaysInMonth, format, endOfDay,
} from "date-fns"
import { es } from "date-fns/locale"
import { toDateWithTime } from "@/lib/utils"
import { MESES_NOMBRES_LOWERCASE } from "@/lib/constants"

export interface FilterOptions {
  filterType: "year-month" | "year" | "month" | "custom" | "all"
  year: string
  month: string
  dateFrom: string
  dateTo: string
}

interface Rango {
  desde: Date
  hasta: Date
}

const suma = (arr: any[]) => arr.reduce((s, g) => s + g.monto, 0)

/** Variación porcentual protegida contra división por cero. */
function delta(actual: number, previo: number): number | null {
  if (previo === 0) return actual === 0 ? 0 : null // null = "sin base de comparación"
  return ((actual - previo) / previo) * 100
}

/** Rango de fechas del período seleccionado. null = sin rango acotado. */
function rangoDelPeriodo(f: FilterOptions): Rango | null {
  const anio = parseInt(f.year)
  switch (f.filterType) {
    case "year-month": {
      const mes = MESES_NOMBRES_LOWERCASE.indexOf(f.month.toLowerCase() as any)
      if (mes < 0 || isNaN(anio)) return null
      const base = new Date(anio, mes, 1)
      return { desde: startOfMonth(base), hasta: endOfMonth(base) }
    }
    case "year": {
      if (isNaN(anio)) return null
      const base = new Date(anio, 0, 1)
      return { desde: startOfYear(base), hasta: endOfYear(base) }
    }
    case "custom": {
      if (!f.dateFrom || !f.dateTo) return null
      return { desde: toDateWithTime(f.dateFrom), hasta: toDateWithTime(f.dateTo, "end") }
    }
    default:
      return null // "month" (mes de todos los años) y "all" no tienen rango continuo
  }
}

/** Período inmediatamente anterior, comparable en longitud. */
function rangoPrevio(f: FilterOptions, actual: Rango | null): Rango | null {
  if (!actual) return null
  switch (f.filterType) {
    case "year-month": {
      const base = subMonths(actual.desde, 1)
      return { desde: startOfMonth(base), hasta: endOfMonth(base) }
    }
    case "year": {
      const base = subYears(actual.desde, 1)
      return { desde: startOfYear(base), hasta: endOfYear(base) }
    }
    case "custom": {
      const dias = differenceInCalendarDays(actual.hasta, actual.desde) + 1
      const hasta = addDays(actual.desde, -1)
      return { desde: addDays(hasta, -(dias - 1)), hasta }
    }
    default:
      return null
  }
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function useStatsAnalytics(gastos: any[], filtros: FilterOptions, filteredGastos: any[]) {
  return useMemo(() => {
    const rango = rangoDelPeriodo(filtros)
    const previo = rangoPrevio(filtros, rango)

    const enRango = (r: Rango | null) =>
      r ? gastos.filter(g => { const d = toDateWithTime(g.fecha); return d >= r.desde && d <= r.hasta }) : []

    const gastosActuales = filteredGastos

    const diasDelRango = rango ? differenceInCalendarDays(rango.hasta, rango.desde) + 1 : 0
    const hoy = new Date()
    const enCurso = !!rango && hoy >= rango.desde && hoy <= rango.hasta
    // En un período en curso solo han transcurrido algunos días: usarlos como
    // denominador evita que el promedio diario parezca artificialmente bajo.
    const diasTranscurridos = rango
      ? Math.max(0, Math.min(diasDelRango, differenceInCalendarDays(hoy, rango.desde) + 1))
      : 0

    // Los gráficos muestran el período previo COMPLETO (sirve de referencia de
    // dónde terminó), pero las comparaciones de KPI usan la misma cantidad de
    // días transcurridos. Comparar 19 días contra un mes entero siempre daria
    // una caída falsa del ~40%.
    const gastosPreviosCompletos = enRango(previo)
    const previoComparable: Rango | null = previo
      ? (enCurso
          ? { desde: previo.desde, hasta: new Date(Math.min(previo.hasta.getTime(), endOfDay(addDays(previo.desde, diasTranscurridos - 1)).getTime())) }
          : previo)
      : null
    const gastosPrevios = previoComparable
      ? gastosPreviosCompletos.filter(g => {
          const d = toDateWithTime(g.fecha)
          return d >= previoComparable.desde && d <= previoComparable.hasta
        })
      : []

    // ---------- KPIs con comparación ----------
    const total = suma(gastosActuales)
    const totalPrevio = suma(gastosPrevios)
    const transacciones = gastosActuales.length
    const transaccionesPrevias = gastosPrevios.length
    const ticket = transacciones > 0 ? total / transacciones : 0
    const ticketPrevio = transaccionesPrevias > 0 ? totalPrevio / transaccionesPrevias : 0

    const promedioDiario = diasTranscurridos > 0 ? total / diasTranscurridos : 0

    const diasPreviosComparables = previoComparable
      ? differenceInCalendarDays(previoComparable.hasta, previoComparable.desde) + 1
      : 0
    const promedioDiarioPrevio = diasPreviosComparables > 0 ? totalPrevio / diasPreviosComparables : 0

    const hayComparacion = previo !== null && diasTranscurridos > 0 && gastosPrevios.length > 0

    const kpis = {
      total,
      totalDelta: hayComparacion ? delta(total, totalPrevio) : null,
      promedioDiario,
      promedioDiarioDelta: hayComparacion ? delta(promedioDiario, promedioDiarioPrevio) : null,
      transacciones,
      transaccionesDelta: hayComparacion ? delta(transacciones, transaccionesPrevias) : null,
      ticket,
      ticketDelta: hayComparacion ? delta(ticket, ticketPrevio) : null,
      totalPrevio,
      hayComparacion,
    }

    // ---------- Proyección de cierre (solo si el período está en curso) ----------
    const totalPrevioCompleto = suma(gastosPreviosCompletos)

    const proyeccion = (() => {
      if (!enCurso || !rango || filtros.filterType !== "year-month") return null
      const diasTotales = getDaysInMonth(rango.desde)
      const ritmo = diasTranscurridos > 0 ? total / diasTranscurridos : 0
      const proyectado = ritmo * diasTotales
      return {
        proyectado,
        ritmoDiario: ritmo,
        diasTranscurridos,
        diasTotales,
        totalPrevio: totalPrevioCompleto,
        // Si el mes pasado cerró en X, ¿este va camino a superarlo?
        deltaVsPrevio: totalPrevioCompleto > 0 ? delta(proyectado, totalPrevioCompleto) : null,
      }
    })()

    // ---------- Evolución: período actual vs anterior, alineados por día ----------
    const evolucion = (() => {
      if (!rango) {
        // Sin rango continuo: agrupamos por mes del set filtrado
        const porMes: Record<string, number> = {}
        gastosActuales.forEach(g => {
          const k = format(toDateWithTime(g.fecha), "yyyy-MM")
          porMes[k] = (porMes[k] || 0) + g.monto
        })
        return Object.keys(porMes).sort().map(k => ({
          etiqueta: format(new Date(k + "-01"), "MMM yy", { locale: es }),
          actual: porMes[k],
          previo: null as number | null,
        }))
      }

      const agruparPorDia = filtros.filterType === "year-month" || diasDelRango <= 62

      if (agruparPorDia) {
        const puntos: { etiqueta: string; actual: number | null; previo: number | null }[] = []
        for (let i = 0; i < diasDelRango; i++) {
          const dia = addDays(rango.desde, i)
          const delDia = gastosActuales.filter(g => isSameDay(toDateWithTime(g.fecha), dia))
          let previoDia: number | null = null
          if (previo) {
            const diaPrevio = addDays(previo.desde, i)
            if (diaPrevio <= previo.hasta) {
              previoDia = suma(gastosPreviosCompletos.filter(g => isSameDay(toDateWithTime(g.fecha), diaPrevio)))
            }
          }
          puntos.push({
            etiqueta: filtros.filterType === "year-month" ? String(getDate(dia)) : format(dia, "d MMM", { locale: es }),
            actual: i < diasTranscurridos ? suma(delDia) : null,
            previo: previoDia,
          })
        }
        return puntos
      }

      // Rangos largos: por mes
      const meses: { etiqueta: string; actual: number | null; previo: number | null }[] = []
      const cursor = startOfMonth(rango.desde)
      while (cursor <= rango.hasta) {
        const ini = startOfMonth(cursor)
        const fin = endOfMonth(cursor)
        const delMes = gastosActuales.filter(g => { const d = toDateWithTime(g.fecha); return d >= ini && d <= fin })
        const iniPrevio = previo ? (filtros.filterType === "custom"
          ? addDays(previo.desde, Math.max(0, differenceInCalendarDays(ini, rango.desde)))
          : startOfMonth(subYears(ini, 1))) : null
        const finPrevio = previo ? (filtros.filterType === "custom"
          ? endOfDay(addDays(previo.desde, differenceInCalendarDays(fin > rango.hasta ? rango.hasta : fin, rango.desde)))
          : endOfMonth(subYears(ini, 1))) : null
        const delMesPrevio = iniPrevio && finPrevio
          ? suma(gastosPreviosCompletos.filter(g => { const d = toDateWithTime(g.fecha); return d >= iniPrevio && d <= finPrevio }))
          : null
        meses.push({
          etiqueta: format(ini, filtros.filterType === "custom" ? "MMM yy" : "MMM", { locale: es }),
          actual: ini <= hoy ? suma(delMes) : null,
          previo: delMesPrevio,
        })
        cursor.setMonth(cursor.getMonth() + 1)
      }
      return meses
    })()

    // ---------- Acumulado: responde "¿voy más rápido que el período pasado?" ----------
    const acumulado = (() => {
      let a = 0
      let p = 0
      return evolucion.map(punto => {
        if (punto.actual !== null) a += punto.actual
        if (punto.previo !== null) p += punto.previo
        return {
          etiqueta: punto.etiqueta,
          actual: punto.actual !== null ? a : null,
          previo: punto.previo !== null ? p : null,
        }
      })
    })()

    // ---------- Categorías con variación ----------
    const porCategoria = (() => {
      const actualMap: Record<string, number> = {}
      const previoMap: Record<string, number> = {}
      const conteo: Record<string, number> = {}
      gastosActuales.forEach(g => {
        const c = g.categoria?.nombre ?? "Sin categoría"
        actualMap[c] = (actualMap[c] || 0) + g.monto
        conteo[c] = (conteo[c] || 0) + 1
      })
      gastosPrevios.forEach(g => {
        const c = g.categoria?.nombre ?? "Sin categoría"
        previoMap[c] = (previoMap[c] || 0) + g.monto
      })
      return Object.keys(actualMap)
        .map(nombre => ({
          nombre,
          total: actualMap[nombre],
          conteo: conteo[nombre],
          porcentaje: total > 0 ? (actualMap[nombre] / total) * 100 : 0,
          previo: previoMap[nombre] || 0,
          delta: hayComparacion ? delta(actualMap[nombre], previoMap[nombre] || 0) : null,
        }))
        .sort((a, b) => b.total - a.total)
    })()

    // Incluye categorías que desaparecieron: también explican una bajada del total.
    const cambiosCategoria = hayComparacion ? (() => {
      const map = new Map<string, { nombre: string; actual: number; previo: number; diferencia: number }>()
      for (const [items, campo] of [[gastosActuales, "actual"], [gastosPrevios, "previo"]] as const) {
        items.forEach(g => {
          const nombre = g.categoria?.nombre ?? "Sin categoría"
          const row = map.get(nombre) ?? { nombre, actual: 0, previo: 0, diferencia: 0 }
          row[campo] += g.monto
          map.set(nombre, row)
        })
      }
      return [...map.values()].map(c => ({ ...c, diferencia: c.actual - c.previo }))
        .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia))
    })() : []

    // ---------- Métodos de pago (dato que no se estaba usando) ----------
    const porMetodoPago = (() => {
      const map: Record<string, { total: number; conteo: number }> = {}
      gastosActuales.forEach(g => {
        const m = g.metodo_pago?.nombre ?? "Sin método"
        if (!map[m]) map[m] = { total: 0, conteo: 0 }
        map[m].total += g.monto
        map[m].conteo += 1
      })
      return Object.entries(map)
        .map(([nombre, v]) => ({
          nombre,
          total: v.total,
          conteo: v.conteo,
          porcentaje: total > 0 ? (v.total / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
    })()

    // ---------- Patrón por día de la semana ----------
    const porDiaSemana = (() => {
      const map = DIAS_SEMANA.map(d => ({ dia: d, total: 0, conteo: 0 }))
      gastosActuales.forEach(g => {
        const idx = toDateWithTime(g.fecha).getDay()
        map[idx].total += g.monto
        map[idx].conteo += 1
      })
      // Semana empezando en lunes, que es como se lee en es-ES
      const ordenado = [...map.slice(1), map[0]]
      return ordenado.map(d => ({
        ...d,
        promedio: d.conteo > 0 ? d.total / d.conteo : 0,
      }))
    })()

    // ---------- Recurrentes vs puntuales (dato que no se estaba usando) ----------
    const recurrentes = gastosActuales.filter(g => g.is_recurrent)
    const puntuales = gastosActuales.filter(g => !g.is_recurrent)
    const composicion = {
      recurrente: suma(recurrentes),
      recurrenteConteo: recurrentes.length,
      puntual: suma(puntuales),
      puntualConteo: puntuales.length,
      porcentajeRecurrente: total > 0 ? (suma(recurrentes) / total) * 100 : 0,
    }

    // ---------- Gastos individuales más grandes ----------
    const topGastos = [...gastosActuales]
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
      .map(g => ({
        id: g.id,
        descripcion: g.descripcion,
        monto: g.monto,
        fecha: g.fecha,
        categoria: g.categoria?.nombre ?? "Sin categoría",
        porcentaje: total > 0 ? (g.monto / total) * 100 : 0,
      }))

    // ---------- Concentración: ¿cuánto pesan las 3 categorías principales? ----------
    const concentracion = porCategoria.slice(0, 3).reduce((s, c) => s + c.porcentaje, 0)

    // ---------- Días sin gastar ----------
    const diasConGasto = new Set(
      gastosActuales.map(g => format(toDateWithTime(g.fecha), "yyyy-MM-dd"))
    ).size
    const diasSinGasto = Math.max(0, diasTranscurridos - diasConGasto)

    // Resúmenes interpretables; las semanas son bloques de 7 días desde el inicio.
    const porDia = new Map<string, { fecha: string; total: number; conteo: number }>()
    const porTamano = [
      { etiqueta: "Hasta $10", limite: 10, total: 0, conteo: 0, porcentaje: 0 },
      { etiqueta: "$10–$50", limite: 50, total: 0, conteo: 0, porcentaje: 0 },
      { etiqueta: "$50–$100", limite: 100, total: 0, conteo: 0, porcentaje: 0 },
      { etiqueta: "Más de $100", limite: Infinity, total: 0, conteo: 0, porcentaje: 0 },
    ]
    gastosActuales.forEach(g => {
      const fecha = format(toDateWithTime(g.fecha), "yyyy-MM-dd")
      const dia = porDia.get(fecha) ?? { fecha, total: 0, conteo: 0 }
      dia.total += g.monto
      dia.conteo++
      porDia.set(fecha, dia)
      const banda = porTamano.find(b => g.monto <= b.limite)!
      banda.total += g.monto
      banda.conteo++
    })
    porTamano.forEach(b => { b.porcentaje = total > 0 ? b.total / total * 100 : 0 })
    const montos = gastosActuales.map(g => g.monto as number).sort((a, b) => a - b)
    const mitad = Math.floor(montos.length / 2)
    const mediana = montos.length ? (montos.length % 2 ? montos[mitad] : (montos[mitad - 1] + montos[mitad]) / 2) : null
    const diaPico = [...porDia.values()].sort((a, b) => b.total - a.total)[0] ?? null
    const porSemana: { etiqueta: string; total: number; conteo: number; dias: number; promedio: number }[] = []
    if (rango && diasDelRango <= 62) {
      for (let i = 0; i < diasTranscurridos; i += 7) {
        const dias = Math.min(7, diasTranscurridos - i)
        const desde = addDays(rango.desde, i)
        const hasta = addDays(desde, dias - 1)
        let totalSemana = 0, conteo = 0
        for (let j = 0; j < dias; j++) {
          const dia = porDia.get(format(addDays(desde, j), "yyyy-MM-dd"))
          totalSemana += dia?.total ?? 0
          conteo += dia?.conteo ?? 0
        }
        porSemana.push({ etiqueta: `${format(desde, "d MMM", { locale: es })} – ${format(hasta, "d MMM", { locale: es })}`,
          total: totalSemana, conteo, dias, promedio: totalSemana / dias })
      }
    }

    return {
      porSemana,
      porTamano,
      mediana,
      diaPico,
      rango,
      previo,
      enCurso,
      kpis,
      proyeccion,
      evolucion,
      acumulado,
      porCategoria,
      cambiosCategoria,
      porMetodoPago,
      porDiaSemana,
      composicion,
      topGastos,
      concentracion,
      diasConGasto,
      diasSinGasto,
      diasTranscurridos,
    }
  }, [gastos, filteredGastos, filtros])
}
