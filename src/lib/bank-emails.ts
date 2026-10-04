// Parsers de notificaciones bancarias (Ecuador) que llegan al correo.
export type PaymentKind = 'credito' | 'debito' | 'transferencia'
type Source = { origen: string; metodo: PaymentKind; transfer: boolean; ingreso?: boolean }
/** tipo "ingreso": dinero que te transfirieron (p. ej. tu parte de un gasto compartido). */
export type BankCharge = Source & { tipo: 'gasto' | 'ingreso'; fecha: string; descripcion: string; monto: number }

export const BANK_SENDERS = [
  'servicios@dinersclub.com.ec',
  'bancaenlinea@produbanco.com',
  'banco@pichincha.com',
  'notificaciones@deunaapp.com',
]

/** Decide por remitente y asunto (sin bajar el cuerpo) si el correo puede ser un gasto o un ingreso. */
export function classifyEmail(from: string, subject: string): Source | null {
  const f = from.toLowerCase()
  if (f === 'servicios@dinersclub.com.ec' && /consumos/i.test(subject)) return { origen: 'Diners', metodo: 'credito', transfer: false }
  if (f === 'bancaenlinea@produbanco.com') {
    if (/^consumo tarjeta de cr/i.test(subject)) return { origen: 'Produbanco', metodo: 'credito', transfer: false }
    if (/^consumo tarjeta de d/i.test(subject)) return { origen: 'Produbanco', metodo: 'debito', transfer: false }
    // "Ingresada" es una transferencia enviada que el banco registró, no dinero recibido.
    if (/^transferencia (enviada|ingresada)/i.test(subject)) return { origen: 'Produbanco', metodo: 'transferencia', transfer: true }
    if (/^transferencia recibida/i.test(subject)) return { origen: 'Produbanco', metodo: 'transferencia', transfer: true, ingreso: true }
  }
  // Pichincha usa el mismo asunto para todo: el cuerpo decide (ver parseBankEmail).
  if (f === 'banco@pichincha.com' && /notificaci|transferencia/i.test(subject)) return { origen: 'Pichincha', metodo: 'transferencia', transfer: true }
  if (f === 'notificaciones@deunaapp.com') {
    if (/recibi. tus/i.test(subject)) return { origen: 'Deuna', metodo: 'transferencia', transfer: true }
    if (/^.?recibiste/i.test(subject)) return { origen: 'Deuna', metodo: 'transferencia', transfer: true, ingreso: true }
  }
  return null
}

const ENTITIES: Record<string, string> = {
  amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', iexcl: '¡', iquest: '¿', bull: '•', brvbar: '¦',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
}

export function htmlToLines(html: string): string[] {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>|<\/(p|td|tr|div|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match)
    .split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

export function normalizeName(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** "8.50", "3,50", "1.234,56", "USD 4", "$3,50 USD" → número; 3 dígitos tras el separador = miles. */
export function parseAmount(raw: string): number | null {
  const match = raw.match(/\d[\d.,]*/)
  if (!match) return null
  const s = match[0].replace(/[.,]$/, '')
  const sep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','))
  const decimal = sep >= 0 && s.length - sep - 1 <= 2
  const int = (decimal ? s.slice(0, sep) : s).replace(/[.,]/g, '')
  const n = Number(decimal ? `${int}.${s.slice(sep + 1)}` : int)
  return n > 0 ? Math.round(n * 100) / 100 : null
}

const AMOUNT_LINE = /^(USD|\$)?\s*\$?\s*\d[\d.,]*\s*(USD)?$/i

export function ecuadorDate(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(date)
}

/**
 * Extrae el movimiento de una notificación ya clasificada. Devuelve null si falta el monto o la
 * contraparte, si la operación falló o fue reversada, o si es una transferencia entre cuentas propias.
 */
export function parseBankEmail(source: Source, subject: string, html: string, date: Date): BankCharge | null {
  const lines = htmlToLines(html)
  const norm = lines.map(normalizeName)
  const isLabel = (line: string) => /:$/.test(line)
  // Índice de la línea cuyo texto normalizado es la etiqueta (con o sin valor en la misma línea).
  const labelAt = (label: string) => norm.findIndex(line => line === label || line.startsWith(label + ' '))

  if (norm.some(line => /no se realizo|reverso/.test(line))) return null
  const ingreso = source.ingreso || norm.some(line => /transferencia recibida|acabas de recibir/.test(line))

  let monto = parseAmount(subject.match(/(?:USD|\$)\s*[\d.,]+/i)?.[0] ?? '')
  for (const label of ['valor', 'monto']) {
    if (monto) break
    const i = labelAt(label)
    if (i < 0) continue
    const inline = lines[i].split(':').slice(1).join(':')
    const candidate = [inline, ...lines.slice(i + 1, i + 4)].map(s => s.trim()).find(s => AMOUNT_LINE.test(s))
    monto = candidate ? parseAmount(candidate) : null
  }

  let nombre: string | undefined
  let nombreAt = -1 // índice de la etiqueta del nombre: el saludo al titular va antes
  const nameLabels = ingreso ? ['nombre del ordenante', 'enviada por'] : ['establecimiento', 'nombre del beneficiario', 'beneficiario', 'contacto']
  for (const label of nameLabels) {
    const i = labelAt(label)
    if (i < 0) continue
    const inline = lines[i].split(':').slice(1).join(':').trim()
    nombre = inline || lines.slice(i + 1, i + 3).find(line => !isLabel(line))
    nombreAt = i
    if (nombre) break
  }
  // Pichincha "¡Transferencia exitosa!": columnas mezcladas, el nombre es el primer texto
  // sin enmascarar después de "Cuenta destino".
  if (!nombre && !ingreso) {
    nombreAt = norm.indexOf('cuenta destino')
    if (nombreAt >= 0) nombre = lines.slice(nombreAt + 1, nombreAt + 5).find(line => !isLabel(line) && !/\*|^\d+$/.test(line))
  }
  if (!monto || !nombre) return null

  if (source.transfer) {
    // Transferencia a uno mismo: el beneficiario coincide (en cualquier orden) con el titular,
    // cuyo nombre aparece en el saludo al inicio del correo.
    const words = (s: string) => normalizeName(s).replace(/^hola /, '').split(' ').sort().join(' ')
    if (lines.slice(0, Math.min(6, nombreAt)).some(line => words(line) === words(nombre!))) return null
  }
  const descripcion = ingreso ? `Recibido de ${nombre}`
    : source.transfer ? `${source.origen === 'Deuna' ? 'Deuna' : 'Transferencia'} a ${nombre}` : nombre
  return { ...source, tipo: ingreso ? 'ingreso' : 'gasto', fecha: ecuadorDate(date), descripcion: descripcion.slice(0, 200), monto }
}

// ponytail: reglas fijas por palabra; el historial del usuario manda antes que estas reglas.
// El orden importa: "UBER EATS" debe caer en alimentación antes que "uber" en transporte.
const RULES: [category: string, keywords: string[]][] = [
  ['alimentacion', ['supermaxi', 'megamaxi', 'comisariato', 'tia', 'aki', 'coral', 'santa maria', 'mini', 'restaurant', 'deli', 'kfc', 'mcdonald', 'burger', 'carls jr', 'chilis', 'taco bell', 'pizza', 'pollo', 'pollos', 'campero', 'cebiche', 'ceviche', 'ecuaviche', 'shawarma', 'pincho', 'tablita', 'smash', 'frittenchop', 'pretzels', 'corfu', 'juan valdez', 'cafe', 'coffee', 'panaderia', 'pedidosya', 'rappi', 'uber eats', 'ub eats']],
  ['transporte', ['estacion', 'gasolinera', 'masgas', 'primax', 'atimasa', 'petroecuador', 'petrocomercial', 'terpel', 'uber', 'cabify', 'indriver', 'peaje', 'parqueadero', 'metroparqueos', 'zona azul', 'epmmop', 'parking']],
  ['salud', ['farmacia', 'fybeca', 'sana sana', 'cruz azul', 'clinica', 'hospital', 'medic', 'laboratorio', 'veterinari']],
  ['servicios', ['netlife', 'cnt', 'claro', 'movistar', 'empresa electrica', 'agua potable', 'twilio', 'holafly', 'anthropic', 'claude', 'openai', 'midjourney', 'elevenlabs', 'github', 'vercel', 'google cloud', 'contabo', 'microsoft', 'apple com']],
  ['entretenimiento', ['cine', 'supercines', 'multicines', 'cinemark', 'netflix', 'spotify', 'crunchyroll','steam', 'playstation', 'disney', 'hbo']],
  ['educacion', ['universidad', 'colegio', 'udemy', 'coursera', 'libreria']],
  ['compras', ['amazon', 'de prati', 'etafashion', 'bershka', 'victoria s secret', 'jugueton', 'michaels', 'kywi', 'electronica', 'mercado libre', 'shein', 'temu']],
]

/** Nombre normalizado de la categoría sugerida por reglas, o null. */
export function categoryByRules(descripcion: string): string | null {
  const text = ` ${normalizeName(descripcion)} `
  for (const [category, keywords] of RULES) {
    if (keywords.some(keyword => text.includes(` ${keyword.trim()}`))) return category
  }
  return null
}
