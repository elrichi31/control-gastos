import Link from 'next/link'
import { ChevronDown, CircleAlert, CircleCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BudgetSummary } from '@/components/presupuesto/BudgetSummary'
import { formatDateWithLocale, formatMoney } from '@/lib/utils'
import type { MonthPlan, PlanAlert } from '@/lib/month-planning'

type PlanningProps = { plan: MonthPlan; loading: boolean; error: string | null; onRetry?: () => void }
const linkStyle = 'text-xs text-muted-foreground hover:text-foreground transition-colors rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function MonthPlanningSummary({ plan, loading, error, onRetry }: PlanningProps) {
  if (loading || error) return (
    <Card>
      <CardContent className="p-5">
        {loading ? <p role="status" className="text-sm text-muted-foreground">Cargando presupuesto y compromisos…</p> : (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
  if (plan.available === null) return (
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div><p className="text-sm font-medium">Tu presupuesto del mes</p><p className="mt-1 text-xs text-muted-foreground">Define un límite para conocer tu disponible.</p></div>
      <Button asChild variant="outline" size="sm"><Link href="/presupuesto">Crear presupuesto</Link></Button>
    </CardContent></Card>
  )
  return <BudgetSummary presupuestado={plan.spent + plan.remaining!} gastado={plan.spent}
    planning={{ committed: plan.committed, available: plan.available, daily: plan.daily!, daysLeft: plan.daysLeft }} />
}

function UpcomingRow({ item }: { item: MonthPlan['upcoming'][number] }) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground break-words">{item.description}</p>
        <time dateTime={item.date} className="mt-1 block text-xs text-muted-foreground">{formatDateWithLocale(item.date, 'd MMM')}</time>
      </div>
      <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">{formatMoney(item.amount)}</span>
    </li>
  )
}

function AlertRow({ alert }: { alert: PlanAlert }) {
  const title = alert.category || (alert.kind === 'projection' ? 'Proyección de cierre' : 'Compromisos del mes')
  const detail = alert.kind === 'near' ? `Quedan ${formatMoney(alert.amount)} · cerca del límite`
    : alert.kind === 'exceeded' ? `${formatMoney(alert.amount)} por encima del límite`
    : alert.kind === 'projection' ? `${formatMoney(alert.amount)} sobre el presupuesto al ritmo actual`
    : `Faltan ${formatMoney(alert.amount)} para cubrir lo previsto`
  return (
    <li className="flex items-start gap-3 px-5 py-2.5 border-b border-border last:border-b-0">
      <CircleAlert aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${alert.kind === 'near' ? 'text-chart-3' : 'text-chart-5'}`} />
      <div className="min-w-0"><p className="text-sm font-medium text-foreground break-words">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
    </li>
  )
}

/** Secondary content follows the calendar. Match the compact rows and quiet
 * header actions of RecentExpenses, rather than adding another KPI dashboard. */
export function MonthPlanning({ plan, loading, error }: PlanningProps) {
  if (loading || error) return null
  return (
    <Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border">
        <section aria-label="Próximos recurrentes" className="min-w-0">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle>Próximos recurrentes</CardTitle>
            <Link href="/gastos-recurrentes" className={linkStyle}>Ver recurrentes</Link>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <p className="px-5 pb-3 text-xs text-muted-foreground"><span className="font-medium tabular-nums text-foreground">{formatMoney(plan.committed)}</span> previstos hasta fin de mes</p>
            {plan.upcoming.length === 0 ? <p className="px-5 py-2 text-sm text-muted-foreground">Sin cargos próximos.</p> : (
              <>
                <ul>{plan.upcoming.slice(0, 5).map(item => <UpcomingRow key={`${item.ruleId}:${item.date}`} item={item} />)}</ul>
                {plan.upcoming.length > 5 && (
                  <details className="group">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-none px-5 text-muted-foreground">
                      <summary>Ver {plan.upcoming.length - 5} más<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
                    </Button>
                    <ul>{plan.upcoming.slice(5).map(item => <UpcomingRow key={`${item.ruleId}:${item.date}`} item={item} />)}</ul>
                  </details>
                )}
              </>
            )}
            <p className="px-5 pt-3 text-xs text-muted-foreground">Fechas previstas, no pagos confirmados.</p>
          </CardContent>
        </section>
        <section aria-label="Avisos de presupuesto" className="min-w-0 border-t lg:border-t-0 border-border">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="flex items-center gap-2"><CardTitle>Presupuesto</CardTitle>{plan.alerts.length > 0 && <Badge variant="outline" className="tabular-nums font-normal">{plan.alerts.length}</Badge>}</div>
            <Link href="/presupuesto" className={linkStyle}>Revisar límites</Link>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            {plan.alerts.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-2"><CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" /><p className="text-sm text-muted-foreground">{plan.available === null ? 'Configura límites para ver avisos.' : 'Sin avisos de presupuesto.'}</p></div>
            ) : (
              <>
                <ul>{plan.alerts.slice(0, 3).map((alert, index) => <AlertRow key={index} alert={alert} />)}</ul>
                {plan.alerts.length > 3 && (
                  <details className="group">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-between rounded-none px-5 text-muted-foreground">
                      <summary>Ver {plan.alerts.length - 3} avisos más<ChevronDown aria-hidden="true" className="h-4 w-4 group-open:rotate-180" /></summary>
                    </Button>
                    <ul>{plan.alerts.slice(3).map((alert, index) => <AlertRow key={index} alert={alert} />)}</ul>
                  </details>
                )}
              </>
            )}
          </CardContent>
        </section>
      </div>
    </Card>
  )
}
