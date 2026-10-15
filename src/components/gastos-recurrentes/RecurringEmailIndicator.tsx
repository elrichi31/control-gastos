import Link from 'next/link'
import type { RecurringEmailStatus } from '@/lib/email-matches'

const money = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

export function RecurringEmailIndicator({ status }: { status: RecurringEmailStatus }) {
  const confirmed = status.estado === 'confirmado'
  return <div className="mt-1 text-xs font-normal text-muted-foreground">
    <p>{confirmed ? 'Confirmado por correo' : status.estado === 'sin_vencimientos' ? 'Aún sin vencimientos' : 'Sin confirmar por correo'}{status.fecha ? ` · ${status.fecha}` : ''}{confirmed && status.monto != null ? ` · ${money.format(status.monto)} base` : ''}</p>
    {!confirmed && status.fecha && <Link href="/gastos-correo" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-foreground sm:min-h-8" title="No encontrar un correo no significa que no se haya cobrado">Revisar correo</Link>}
  </div>
}
