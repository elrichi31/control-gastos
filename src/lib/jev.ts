import { normalizeName } from '@/lib/bank-emails'

// Jev (TypeSafe): preguntas tipadas sobre un state, respuestas con probabilidad calibrada.
// Docs: https://docs.typesafe.ai/api.md
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MIN_CONFIDENCE = 0.5
const BATCH = 50

type Answer = { type: string; choice?: string; confidence?: number; noul?: number }

/** Un request a Jev. Sin TYPESAFE_API_KEY o ante cualquier error devuelve null: Jev es solo una mejora. */
async function callJev(state: unknown, questions: Record<string, unknown>): Promise<Record<string, Answer> | null> {
  const key = process.env.TYPESAFE_API_KEY
  if (!key) return null
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'jev-latest', state, questions }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) { console.error('[jev] request failed', { status: response.status }); return null }
    return (await response.json())?.answers ?? null
  } catch {
    console.error('[jev] request error')
    return null
  }
}

// Pistas para categorías comunes; las que no estén aquí van sin descripción.
const HINTS: Record<string, string> = {
  alimentacion: 'Supermercados, restaurantes, cafeterías, comida a domicilio',
  transporte: 'Gasolina, taxis, apps de transporte, parqueaderos, peajes',
  entretenimiento: 'Cine, streaming, juegos, eventos',
  salud: 'Farmacias, clínicas, médicos, veterinarios',
  educacion: 'Cursos, colegios, universidades, libros',
  compras: 'Ropa, tecnología, hogar, tiendas',
  servicios: 'Internet, telefonía, software y suscripciones digitales, hosting',
  suscripciones: 'Pagos recurrentes de apps y plataformas',
  otros: 'No encaja claramente en ninguna categoría',
}

/** Devuelve comercio → id de categoría para los que Jev responde con confianza suficiente. */
export async function categorizeWithJev(merchants: string[], categorias: { id: number; nombre: string }[]): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  const unique = [...new Set(merchants)]
  if (!unique.length || !categorias.length) return result
  const idByName = new Map(categorias.map(c => [c.nombre, c.id]))
  const criteria = Object.fromEntries(categorias.map(c => [c.nombre, HINTS[normalizeName(c.nombre)] ?? null]))

  for (let start = 0; start < unique.length; start += BATCH) {
    const chunk = unique.slice(start, start + BATCH)
    // Un solo request por lote: cada comercio es una pregunta que apunta a su campo del state.
    const answers = await callJev({ comercios: Object.fromEntries(chunk.map((m, i) => [`c${i}`, m])) }, Object.fromEntries(chunk.map((_, i) => [`c${i}`, {
      type: 'choice',
      instructions: `Comercio de Ecuador tal como aparece en una notificación de tarjeta: \`comercios.c${i}\`. ¿En qué categoría de gasto personal va?`,
      criteria,
    }])))
    if (!answers) break
    chunk.forEach((merchant, i) => {
      const answer = answers[`c${i}`]
      const id = answer?.choice ? idByName.get(answer.choice) : undefined
      if (id && (answer.confidence ?? 0) >= MIN_CONFIDENCE) result.set(merchant, id)
    })
  }
  return result
}

// El monto y la fecha ya coinciden (lo decide email-matches): solo se comparan descripciones,
// así que a TypeSafe no salen montos ni fechas.
export type ExpensePair = { correo: { descripcion: string }; gasto: { descripcion: string; categoria?: string } }
export type MatchVerdict = { veredicto: 'encaja' | 'desconocido' | 'no_encaja'; probabilidad: number }

/**
 * Para cada par: ¿el comercio del correo encaja con lo que describe el gasto manual?
 * "desconocido" = el correo no dice qué se compró (transferencia a una persona).
 * `probabilidad` ordena: encaja cuenta entero y desconocido la mitad.
 * null por par si Jev no está disponible; quien llama decide sin él.
 */
export async function scoreSameExpense(pairs: ExpensePair[]): Promise<(MatchVerdict | null)[]> {
  const keys = pairs.map(pairKey)
  const scores: (MatchVerdict | null)[] = keys.map(cachedVerdict)
  // Solo se pregunta a Jev por los pares que no están en caché (y una vez por par repetido).
  const missing = [...new Set(keys.filter((_, i) => !scores[i]))]
  const fresh = await askSameExpense(missing.map(key => pairs[keys.indexOf(key)]))
  missing.forEach((key, i) => { if (fresh[i]) rememberVerdict(key, fresh[i]) })
  return keys.map((key, i) => scores[i] ?? fresh[missing.indexOf(key)] ?? null)
}

// La respuesta depende solo de las descripciones, así que se reutiliza entre recargas de la
// revisión (cada guardado vuelve a pedir la página) en vez de esperar otra vez a la API externa.
const VERDICT_TTL_MS = 6 * 60 * 60 * 1000
const VERDICT_MAX = 2000
const verdictCache = new Map<string, { verdict: MatchVerdict; expires: number }>()
const pairKey = (p: ExpensePair) => JSON.stringify([p.correo.descripcion, p.gasto.descripcion, p.gasto.categoria ?? null])
function cachedVerdict(key: string): MatchVerdict | null {
  const hit = verdictCache.get(key)
  if (!hit) return null
  if (hit.expires < Date.now()) { verdictCache.delete(key); return null }
  return hit.verdict
}
function rememberVerdict(key: string, verdict: MatchVerdict) {
  verdictCache.delete(key)
  if (verdictCache.size >= VERDICT_MAX) verdictCache.delete(verdictCache.keys().next().value!)
  verdictCache.set(key, { verdict, expires: Date.now() + VERDICT_TTL_MS })
}

async function askSameExpense(pairs: ExpensePair[]): Promise<(MatchVerdict | null)[]> {
  const scores: (MatchVerdict | null)[] = pairs.map(() => null)
  if (!pairs.length) return scores
  const chunks: ExpensePair[][] = []
  for (let start = 0; start < pairs.length; start += BATCH) chunks.push(pairs.slice(start, start + BATCH))
  // Los lotes van en paralelo: antes cada uno esperaba al anterior.
  await Promise.all(chunks.map(async (chunk, n) => {
    const start = n * BATCH
    const answers = await callJev({ pares: Object.fromEntries(chunk.map((p, i) => [`p${i}`, p])) }, Object.fromEntries(chunk.map((_, i) => [`p${i}`, {
      type: 'choice',
      instructions: `Comparando \`pares.p${i}.correo\` (notificación bancaria) con \`pares.p${i}.gasto\` (registrado a mano, mismo monto y fecha): ¿el comercio del correo encaja con lo que describe el gasto?`,
      criteria: {
        encaja: 'Mismo comercio o mismo rubro (p. ej. restaurante y "almuerzo")',
        desconocido: 'El correo no dice qué se compró (p. ej. transferencia a una persona)',
        no_encaja: 'Rubros distintos (p. ej. gasolinera y "almuerzo")',
      },
    }])))
    if (!answers) return
    chunk.forEach((_, i) => {
      const answer = answers[`p${i}`] as Answer & { probabilities?: Record<string, number> }
      const p = answer?.probabilities
      if (!answer?.choice || !p) return
      scores[start + i] = {
        veredicto: answer.choice as MatchVerdict['veredicto'],
        probabilidad: (p.encaja ?? 0) + (p.desconocido ?? 0) / 2,
      }
    })
  }))
  return scores
}
