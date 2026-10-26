'use client'

import { CategoryBadge } from "@/components/gastos/CategoryBadge"
import { ExpenseTags } from '@/components/gastos/ExpenseTags'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from "@/components/ui/table"
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Trash2, Pencil, Receipt, CreditCard, Calendar } from 'lucide-react'
import type { Expense } from '@/services/expenses'

const EditExpenseDialog = dynamic(() => import('@/components/gastos/EditExpenseDialog').then(m => m.EditExpenseDialog))

interface GastoTableRowProps {
  gasto: Expense
  onDeleteGasto: (id: string) => void
  formatMoney: (amount: number) => string
  formatDate: (dateString: string) => string
}

export function GastoTableRow({ 
  gasto, 
  onDeleteGasto,
  formatMoney,
  formatDate
}: GastoTableRowProps) {
  const [showEdit, setShowEdit] = useState(false)
  const getPaymentMethodIcon = (metodo: string) => {
    switch (metodo?.toLowerCase()) {
      case 'tarjeta de débito':
      case 'tarjeta de crédito':
        return <CreditCard className="h-4 w-4" />
      case 'efectivo':
        return <Receipt className="h-4 w-4" />
      case 'transferencia':
        return <Calendar className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium px-4 py-3 w-[180px] min-w-[180px]">
        <div 
          className="text-sm break-words pr-2 text-foreground"
          title={gasto.descripcion}
        >
          {gasto.descripcion}
        </div>
        <ExpenseTags tags={gasto.tags} />
      </TableCell>
      <TableCell className="px-3 py-3 w-[140px] min-w-[140px]">
        <CategoryBadge name={gasto.categoria?.nombre} fallback="Otros" />
      </TableCell>
      <TableCell className="px-3 py-3 w-[150px] min-w-[150px]">
        <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
          <div className="flex-shrink-0">
            {getPaymentMethodIcon(gasto.metodo_pago?.nombre || '')}
          </div>
          <span className="text-xs truncate">
            {gasto.metodo_pago?.nombre || 'Sin método'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-3 w-[100px] min-w-[100px]">
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDate(gasto.fecha)}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium text-foreground tabular-nums px-3 py-3 w-[100px] min-w-[100px]">
        <span className="text-sm whitespace-nowrap">
          {formatMoney(gasto.monto)}
        </span>
      </TableCell>
      <TableCell className="text-center px-3 py-3 w-[100px] min-w-[100px]">
        <div className="flex items-center justify-center gap-1">
        <Button
          size="icon-sm"
          onClick={() => setShowEdit(true)}
          variant="ghost"
          aria-label={`Editar gasto: ${gasto.descripcion}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon-sm"
          onClick={() => onDeleteGasto(gasto.id.toString())}
          variant="ghost-destructive"
          aria-label={`Eliminar gasto: ${gasto.descripcion}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        </div>
        {showEdit && <EditExpenseDialog expense={gasto} open={showEdit} onOpenChange={setShowEdit} onSaved={() => {}} />}
      </TableCell>
    </TableRow>
  )
}
