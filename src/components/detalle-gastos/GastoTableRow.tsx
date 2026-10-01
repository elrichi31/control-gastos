'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getCategoriaColor } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from "@/components/ui/table"
import { Trash2, Receipt, CreditCard, Calendar } from 'lucide-react'
import type { Expense } from '@/services/expenses'

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
    <TableRow className="hover:bg-muted/60">
      <TableCell className="font-medium px-4 py-4 w-[180px] min-w-[180px]">
        <div 
          className="text-sm truncate pr-2 text-foreground" 
          title={gasto.descripcion}
        >
          {gasto.descripcion}
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[140px] min-w-[140px]">
        <Badge 
          variant="secondary" 
          className={`border font-normal ${getCategoriaColor(gasto.categoria?.nombre)} truncate max-w-full`}
        >
          {gasto.categoria?.nombre || 'Otros'}
        </Badge>
      </TableCell>
      <TableCell className="px-3 py-4 w-[150px] min-w-[150px]">
        <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
          <div className="flex-shrink-0">
            {getPaymentMethodIcon(gasto.metodo_pago?.nombre || '')}
          </div>
          <span className="text-xs truncate">
            {gasto.metodo_pago?.nombre || 'Sin método'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {formatDate(gasto.fecha)}
        </span>
      </TableCell>
      <TableCell className="text-right font-medium text-foreground tabular-nums px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-sm whitespace-nowrap">
          {formatMoney(gasto.monto)}
        </span>
      </TableCell>
      <TableCell className="text-center px-3 py-4 w-[80px] min-w-[80px]">
        <Button
          size="sm"
          onClick={() => onDeleteGasto(gasto.id.toString())}
          variant="ghost"
          aria-label={`Eliminar gasto: ${gasto.descripcion}`}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 p-0 h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
