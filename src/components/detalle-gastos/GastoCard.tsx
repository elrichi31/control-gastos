'use client'

import { CategoryBadge } from "@/components/gastos/CategoryBadge"
import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ExpenseTags } from '@/components/gastos/ExpenseTags'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import type { Gasto } from '@/types'

const EditExpenseDialog = dynamic(() => import('@/components/gastos/EditExpenseDialog').then(m => m.EditExpenseDialog))

interface GastoCardProps {
  gasto: Gasto
  onDeleteGasto: (gastoId: string) => void
  formatMoney: (amount: number) => string
  formatDate: (date: string) => string
}

export const GastoCard: React.FC<GastoCardProps> = ({ gasto, onDeleteGasto, formatMoney, formatDate }) => {
  const [showEdit, setShowEdit] = useState(false)
  return (
  <div className="flex items-start gap-3 px-5 py-3">
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-medium text-foreground break-words">{gasto.descripcion}</h4>
      <ExpenseTags tags={gasto.tags} />
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
        <CategoryBadge name={gasto.categoria?.nombre} />
        <span>{formatDate(gasto.fecha)}</span>
        <span className="max-w-full truncate" title={gasto.metodo_pago?.nombre}>{gasto.metodo_pago?.nombre || 'Sin método de pago'}</span>
      </div>
    </div>
    <div className="shrink-0 flex flex-col items-end gap-1">
      <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">{formatMoney(gasto.monto)}</span>
      <div className="flex items-center gap-1">
      <Button size="icon-sm" variant="ghost" onClick={() => setShowEdit(true)} aria-label={`Editar gasto: ${gasto.descripcion}`}><Pencil aria-hidden="true" className="h-4 w-4" /></Button>
      <Button size="icon-sm" variant="ghost-destructive" onClick={() => onDeleteGasto(gasto.id.toString())} aria-label={`Eliminar gasto: ${gasto.descripcion}`}><Trash2 aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
    </div>
    {showEdit && <EditExpenseDialog expense={gasto} open={showEdit} onOpenChange={setShowEdit} onSaved={() => {}} />}
  </div>
  )
}
