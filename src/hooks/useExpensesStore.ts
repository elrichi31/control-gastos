import { useEffect, useSyncExternalStore } from "react"
import { fetchExpenses } from "@/services/expenses"
import type { Gasto } from "@/types"

type State = { gastos: Gasto[]; loading: boolean; error: string | null }

// Estado a nivel de módulo (sin Context ni dependencias) para que los hooks funcionen sin provider.
// Nunca se descarga ni se escribe durante el render: el módulo se comparte entre requests en el servidor.
const INITIAL: State = { gastos: [], loading: true, error: null }
let state = INITIAL
let loaded = false
let inflight: Promise<void> | null = null
let generation = 0
const listeners = new Set<() => void>()

function setState(next: State) {
  state = next
  listeners.forEach(listener => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function download(): Promise<void> {
  // Una descarga nueva (o un reset) invalida los resultados de las anteriores, que pueden ser anteriores al cambio.
  const mine = ++generation
  if (state.error) setState({ ...state, error: null })
  const run: Promise<void> = fetchExpenses()
    .then(data => {
      if (mine !== generation) return
      loaded = true
      setState({ gastos: data, loading: false, error: null })
    })
    .catch(e => {
      if (mine !== generation) return
      setState({ ...state, loading: false, error: e?.message || "Error de red" })
    })
    .finally(() => { if (inflight === run) inflight = null })
  inflight = run
  return run
}

/** Vuelve a descargar los gastos. Mientras tanto se siguen mostrando los anteriores; si falla, se conservan. */
export const refreshExpenses = () => download()

/** Vacía la caché (cambio de usuario o cierre de sesión). */
export function resetExpensesStore() {
  generation++
  loaded = false
  inflight = null
  setState(INITIAL)
}

export function useExpensesStore() {
  const { gastos, loading, error } = useSyncExternalStore(subscribe, () => state, () => INITIAL)
  useEffect(() => {
    if (!loaded && !inflight) void download()
  }, [])
  return { gastos, loading, error, refresh: refreshExpenses }
}
