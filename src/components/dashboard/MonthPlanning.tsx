import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/lib/utils'
import type { MonthPlan, PlanAlert } from '@/lib/month-planning'

function alertText(alert: PlanAlert) {
  switch (alert.kind) {
    case 'near': return `${alert.category}: cerca del límite. Quedan ${formatMoney(alert.amount)} en esta categoría.`
    case 'exceeded': return `${alert.category}: superaste el límite en ${formatMoney(alert.amount)}. Revisa sus gastos o ajusta el presupuesto.`
    case 'projection': return `A este ritmo, el gasto proyectado supera el presupuesto en ${formatMoney(alert.amount)}. Reduce el ritmo o revisa tus límites.`
    case 'commitments': return `El gasto registrado más los próximos recurrentes supera el presupuesto en ${formatMoney(alert.amount)}. Revisa tus compromisos antes de gastar más.`
  }
}

export function MonthPlanning({ plan, loading, error, onRetry }: {
  plan: MonthPlan; loading: boolean; error: string | null; onRetry?: () => void
}) {
  if (loading || error) return (
    <Card><CardHeader><CardTitle>Plan del mes</CardTitle></CardHeader><CardContent>
      {loading ? <p role="status" className="text-sm text-muted-foreground">Cargando presupuesto y compromisos…</p> : <div role="alert" className="space-y-3"><p className="text-sm">{error}</p><Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button></div>}
    </CardContent></Card>
  )
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>¿Cuánto puedo gastar todavía?</CardTitle><CardDescription>Estimación según tu presupuesto, no saldo bancario. Los recurrentes se reservan desde mañana hasta fin de mes.</CardDescription></CardHeader>
        <CardContent>
          {plan.available === null ? <p className="text-sm text-muted-foreground">Configura el <Link href="/presupuesto" className="underline underline-offset-4">presupuesto de este mes</Link> para calcular tu disponible.</p> : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div><dt className="text-sm text-muted-foreground">Presupuesto restante</dt><dd className="text-xl font-semibold tabular-nums">{formatMoney(plan.remaining!)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Próximos compromisos</dt><dd className="text-xl font-semibold tabular-nums">{formatMoney(plan.committed)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Disponible después de compromisos</dt><dd className={`text-xl font-semibold tabular-nums ${plan.available < 0 ? 'text-destructive' : ''}`}>{formatMoney(plan.available)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">Por día · orientativo</dt><dd className="text-xl font-semibold tabular-nums">{formatMoney(plan.daily!)}<span className="block text-xs font-normal text-muted-foreground">{plan.daysLeft} días, incluyendo hoy</span></dd></div>
            </dl>
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <Card>
          <CardHeader><CardTitle>Próximos recurrentes del mes</CardTitle><CardDescription>{formatMoney(plan.committed)} previstos · No confirma pagos realizados.</CardDescription></CardHeader>
          <CardContent>
            {plan.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No hay cargos recurrentes previstos para el resto del mes.</p> : <ul className="max-h-72 overflow-y-auto divide-y divide-border">
              {plan.upcoming.map(item => <li key={`${item.ruleId}:${item.date}`} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div className="min-w-0"><p className="text-sm font-medium break-words">{item.description}</p><time dateTime={item.date} className="text-xs text-muted-foreground">{item.date.split('-').reverse().join('/')}</time></div><span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item.amount)}</span></li>)}
            </ul>}
            <Link href="/gastos-recurrentes" className="mt-3 inline-block text-sm underline underline-offset-4">Administrar recurrentes</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Avisos de presupuesto</CardTitle><CardDescription>Alertas desde el 80% por categoría y estimación de cierre.</CardDescription></CardHeader>
          <CardContent>
            {plan.alerts.length === 0 ? <p className="text-sm text-muted-foreground">{plan.available === null ? 'Los avisos estarán disponibles cuando configures un presupuesto.' : 'Sin avisos: los gastos registrados están dentro de tus límites.'}</p> : <ul className="space-y-3">{plan.alerts.map((alert, index) => <li key={index} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">{alertText(alert)}</li>)}</ul>}
            <Link href="/presupuesto" className="mt-3 inline-block text-sm underline underline-offset-4">Revisar presupuesto</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
