import { normalizeName } from '@/lib/bank-emails'

// Jev (TypeSafe) elige una categoría por comercio con probabilidad calibrada.
// Docs: https://docs.typesafe.ai/api.md
const ENDPOINT = 'https://api.typesafe.ai/v1/systemone'
const MIN_CONFIDENCE = 0.5
const BATCH = 50

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

type Answer = { type: string; choice?: string; confidence?: number }

/**
 * Devuelve comercio → id de categoría para los que Jev responde con confianza suficiente.
 * Sin TYPESAFE_API_KEY o ante cualquier error devuelve un mapa vacío: es solo una mejora.
 */
export async function categorizeWithJev(merchants: string[], categorias: { id: number; nombre: string }[]): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  const key = process.env.TYPESAFE_API_KEY
  const unique = [...new Set(merchants)]
  if (!key || !unique.length || !categorias.length) return result
  const idByName = new Map(categorias.map(c => [c.nombre, c.id]))
  const criteria = Object.fromEntries(categorias.map(c => [c.nombre, HINTS[normalizeName(c.nombre)] ?? null]))

  for (let start = 0; start < unique.length; start += BATCH) {
    const chunk = unique.slice(start, start + BATCH)
    // Un solo request por lote: cada comercio es una pregunta que apunta a su campo del state.
    const state = { comercios: Object.fromEntries(chunk.map((m, i) => [`c${i}`, m])) }
    const questions = Object.fromEntries(chunk.map((_, i) => [`c${i}`, {
      type: 'choice',
      instructions: `Comercio de Ecuador tal como aparece en una notificación de tarjeta: \`comercios.c${i}\`. ¿En qué categoría de gasto personal va?`,
      criteria,
    }]))
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'jev-latest', state, questions }),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) { console.error('[jev] request failed', { status: response.status }); break }
      const answers: Record<string, Answer> = (await response.json())?.answers ?? {}
      chunk.forEach((merchant, i) => {
        const answer = answers[`c${i}`]
        const id = answer?.choice ? idByName.get(answer.choice) : undefined
        if (id && (answer.confidence ?? 0) >= MIN_CONFIDENCE) result.set(merchant, id)
      })
    } catch {
      console.error('[jev] request error')
      break
    }
  }
  return result
}
