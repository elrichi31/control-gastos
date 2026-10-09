import { ExpenseItem } from "./ExpenseItem"
import { Gasto } from "./../hooks/useGastosFiltrados"
import { format, parse, parseISO } from "date-fns"
import { es } from "date-fns/locale"
type Props = {
  groupedExpenses: Record<string, Gasto[]>
  isLoading: boolean
  onDelete: (id: string) => void
  onUpdated?: () => void | Promise<void>
  groupBy: "dia" | "semana" | "mes"
}


function toLocalDate(date: Date) {
  // Si la fecha tiene hora 00:00:00 y se interpreta en UTC, ajusta a local
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatGroupTitle(key: string, groupBy: "dia" | "semana" | "mes"): string {
  try {
    if (groupBy === "mes") {
      const date = toLocalDate(parse(key, "yyyy-MM", new Date()))
      return format(date, "MMMM yyyy", { locale: es })
    }

    if (groupBy === "semana") {
      const [from, to] = key.split("::")
      if (!from || !to) return key

      const fromDate = toLocalDate(parseISO(from))
      const toDate = toLocalDate(parseISO(to))

      const desde = format(fromDate, "EEEE d 'de' MMMM", { locale: es })
      const hasta = format(toDate, "EEEE d 'de' MMMM yyyy", { locale: es })

      return `Semana del ${desde} al ${hasta}`
    }

    if (groupBy === "dia") {
      const date = toLocalDate(parseISO(key))
      return format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
    }
  } catch (error) {
    console.error("Error formateando título de grupo:", error)
    return key
  }

  return key
}

export function ExpenseList({ groupedExpenses, isLoading, onDelete, onUpdated, groupBy }: Props) {
  const groupKeys = Object.keys(groupedExpenses).sort((a, b) => {
    const extractDate = (key: string) => {
      if (groupBy === "semana") return parseISO(key.split("::")[0])
      if (groupBy === "mes") return parse(key, "yyyy-MM", new Date())
      return parseISO(key)
    }

    return extractDate(b).getTime() - extractDate(a).getTime()
  })

  if (isLoading) {
    return <p className="text-center text-sm text-muted-foreground px-5 py-10">Cargando gastos...</p>
  }

  if (!groupedExpenses || groupKeys.length === 0) {
    return <p className="text-center text-sm text-muted-foreground px-5 py-10">No hay gastos registrados aún</p>
  }

  return (
    <div className="max-h-[36rem] overflow-y-auto overflow-x-hidden">
      {/* Cabecera de columnas: solo cuando las filas van en horizontal */}
      <div aria-hidden="true" className="hidden md:grid sticky top-0 z-20 grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_7rem_minmax(0,1fr)_6rem_4.5rem] gap-x-4 border-b border-border bg-card px-5 py-2 text-xs font-medium text-muted-foreground">
        <span>Descripción</span><span>Categoría</span><span>Fecha</span><span>Método de pago</span><span className="text-right">Monto</span><span />
      </div>
      {groupKeys.map((groupTitle) => (
        <div key={groupTitle} className="mb-2 last:mb-0">
          <h3 className="sticky top-0 md:top-[33px] z-10 flex items-baseline justify-between gap-3 bg-muted/60 backdrop-blur px-5 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span className="truncate">{formatGroupTitle(groupTitle, groupBy)}</span>
            <span className="shrink-0 normal-case tracking-normal tabular-nums">
              {groupedExpenses[groupTitle].length} · ${groupedExpenses[groupTitle].reduce((sum, expense) => sum + expense.monto, 0).toFixed(2)}
            </span>
          </h3>
          <div>
            {groupedExpenses[groupTitle].map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onDelete={onDelete}
                onUpdated={onUpdated}
                showDeleteIcon={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
