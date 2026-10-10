// src/services/email-import.ts
// Movimientos bancarios importados del correo (Yahoo). Las funciones lanzan Error con el mensaje que ve el usuario.

const API = '/api/email-import/yahoo'

export type EmailImportTab = 'nuevos' | 'duplicados' | 'recibidos'

export interface EmailImportPage<T> {
  enabled?: boolean
  pendientes: T[]
  counts?: Record<EmailImportTab, number>
  total: number
  page: number
  pages: number
}

export interface EmailImportQuery {
  tab: EmailImportTab
  page: number
  query: string
  otros: ReadonlySet<number>
}

export async function fetchEmailImportPage<T>({ tab, page, query, otros }: EmailImportQuery): Promise<EmailImportPage<T>> {
  const params = new URLSearchParams({ tab, page: String(page), ...(query ? { q: query } : {}), ...(otros.size ? { otros: [...otros].join(',') } : {}) })
  const response = await fetch(`${API}?${params}`, { cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body || !Array.isArray(body.pendientes)) throw new Error(body?.error || 'No se pudieron cargar los movimientos.')
  return body
}

/** Cuántos movimientos esperan revisión; null si la importación no está habilitada. */
export async function fetchEmailImportPending(): Promise<number | null> {
  const response = await fetch(`${API}?resumen=1`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Error al obtener el resumen del correo')
  const body = await response.json()
  return body?.enabled && typeof body.total === 'number' ? body.total : null
}

export async function saveEmailAlias(id: number, alias: string, destinatario: string): Promise<void> {
  const response = await fetch(API, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, alias }) })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.destinatario !== destinatario || body?.alias !== alias) throw new Error(body?.error || 'No se pudo confirmar el alias.')
}

/** Acepta, descarta o vincula un movimiento; countKey es el contador que el servidor debe devolver en 1. */
export async function updateEmailImport(payload: object, countKey: 'aceptados' | 'descartados' | 'vinculados', signal: AbortSignal): Promise<void> {
  const response = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'No se pudo confirmar el guardado. Revisa antes de reintentar.')
  if (body?.[countKey] !== 1) throw new Error('El movimiento ya cambió. Actualizaremos la lista; no se confirmó una nueva operación.')
}

export async function syncEmailImport(): Promise<{ nuevos?: number }> {
  const response = await fetch(API, { method: 'POST' })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error || 'No se pudo sincronizar.')
  return body
}
