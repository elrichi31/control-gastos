import { z } from 'zod'

// Same financial limits as MCP, without importing its server/runtime into web routes.
export const expenseIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const fields = {
  descripcion: z.string().trim().min(1).max(500),
  monto: z.number().finite().positive().max(999999999)
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, 'Máximo dos decimales'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const date = new Date(`${value}T00:00:00Z`)
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, 'Fecha inválida'),
  categoria_id: expenseIdSchema,
  metodo_pago_id: expenseIdSchema,
  is_recurrent: z.boolean().optional(),
  tags: z.unknown().optional(),
}
export const expenseCreateSchema = z.object(fields)
export const expenseUpdateSchema = z.object(fields).partial()
  .refine(value => Object.values(value).some(field => field !== undefined), 'No hay campos para actualizar')

export function parseExpenseQueryId(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) return null
  const parsed = expenseIdSchema.safeParse(Number(value))
  return parsed.success ? parsed.data : null
}
