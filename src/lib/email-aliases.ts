import { normalizeName } from '@/lib/bank-emails'

export type EmailAlias = { destinatario: string; alias: string }

/** Coincidencia exacta del nombre completo, sin acentos/capitalización; nunca por fragmentos. */
export function transferRecipient(descripcion: string): string | null {
  const name = descripcion.match(/^(?:Transferencia|Deuna) a\s+(.+)$/i)?.[1]
  return name ? normalizeName(name) || null : null
}

export function emailAliasDescription(descripcion: string, aliases: EmailAlias[]): string {
  const recipient = transferRecipient(descripcion)
  return aliases.find(rule => rule.destinatario === recipient)?.alias ?? descripcion
}
