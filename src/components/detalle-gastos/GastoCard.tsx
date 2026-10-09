'use client'

import React from 'react'
import { ExpenseTags } from '@/components/ExpenseTags'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCategoriaColor } from '@/lib/constants'
import { Trash2 } from 'lucide-react'
import type { Gasto } from '@/types'

interface GastoCardProps {
  gasto: Gasto
  onDeleteGasto: (gastoId: string) => void
  formatMoney: (amount: number) => string
  formatDate: (date: string) => string
}

export const GastoCard: React.FC<GastoCardProps> = ({ gasto, onDeleteGasto, formatMoney, formatDate }) => (
  <div className="flex items-start gap-3 px-5 py-3">
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-medium text-foreground break-words">{gasto.descripcion}</h4>
      <ExpenseTags tags={gasto.tags} />
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
        <Badge className={`max-w-full truncate border font-normal ${getCategoriaColor(gasto.categoria?.nombre)}`} title={gasto.categoria?.nombre}>{gasto.categoria?.nombre || 'Sin categoría'}</Badge>
        <span>{formatDate(gasto.fecha)}</span>
        <span className="max-w-full truncate" title={gasto.metodo_pago?.nombre}>{gasto.metodo_pago?.nombre || 'Sin método de pago'}</span>
      </div>
    </div>
    <div className="shrink-0 flex flex-col items-end gap-1">
      <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">{formatMoney(gasto.monto)}</span>
      <Button size="icon-sm" variant="ghost-destructive" onClick={() => onDeleteGasto(gasto.id.toString())} aria-label={`Eliminar gasto: ${gasto.descripcion}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></Button>
    </div>
  </div>
)
