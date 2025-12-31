'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
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
  const getCategoryColor = (categoria: string) => {
    const colors = {
      'Alimentación': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/40',
      'Transporte': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/40',
      'Entretenimiento': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-500/40',
      'Salud': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/40',
      'Hogar': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/40',
      'Educación': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40',
      'Trabajo': 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/40',
      'Suscripciones': 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-400 border border-pink-200 dark:border-pink-500/40',
      'Otros': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/40',
    }
    return colors[categoria as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 border border-gray-200 dark:border-gray-500/40'
  }

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
    <TableRow className="hover:bg-gray-50 dark:hover:bg-neutral-900/50">
      <TableCell className="font-medium px-4 py-4 w-[180px] min-w-[180px]">
        <div 
          className="text-sm truncate pr-2 dark:text-white" 
          title={gasto.descripcion}
        >
          {gasto.descripcion}
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[140px] min-w-[140px]">
        <Badge 
          variant="secondary" 
          className={`${getCategoryColor(gasto.categoria?.nombre || 'Otros')} text-xs px-2 py-1 truncate block max-w-full`}
        >
          {gasto.categoria?.nombre || 'Otros'}
        </Badge>
      </TableCell>
      <TableCell className="px-3 py-4 w-[150px] min-w-[150px]">
        <div className="flex items-center gap-2 min-w-0 dark:text-gray-300">
          <div className="flex-shrink-0">
            {getPaymentMethodIcon(gasto.metodo_pago?.nombre || '')}
          </div>
          <span className="text-xs truncate">
            {gasto.metodo_pago?.nombre || 'Sin método'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-xs whitespace-nowrap dark:text-gray-300">
          {formatDate(gasto.fecha)}
        </span>
      </TableCell>
      <TableCell className="text-right font-semibold text-red-600 dark:text-red-400 px-3 py-4 w-[100px] min-w-[100px]">
        <span className="text-sm whitespace-nowrap">
          {formatMoney(gasto.monto)}
        </span>
      </TableCell>
      <TableCell className="text-center px-3 py-4 w-[80px] min-w-[80px]">
        <Button
          size="sm"
          onClick={() => onDeleteGasto(gasto.id.toString())}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 p-2 h-8 w-8 bg-transparent border-0 shadow-none"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
