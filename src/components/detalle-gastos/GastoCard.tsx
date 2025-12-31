'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { Gasto } from '@/types';

interface GastoCardProps {
  gasto: Gasto;
  onDeleteGasto: (gastoId: string) => void;
  formatMoney: (amount: number) => string;
  formatDate: (date: string) => string;
}

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

export const GastoCard: React.FC<GastoCardProps> = ({
  gasto,
  onDeleteGasto,
  formatMoney,
  formatDate,
}) => {
  return (
    <Card className="border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Descripción y monto */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {gasto.descripcion}
              </h4>
            </div>
            <div className="ml-2 text-right">
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                -{formatMoney(gasto.monto)}
              </span>
            </div>
          </div>

          {/* Categoría y método de pago */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block mb-1">Categoría:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(gasto.categoria.nombre)}`}
              >
                {gasto.categoria.nombre}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Método:</span>
              <div className="font-medium dark:text-gray-200">{gasto.metodo_pago?.nombre || 'No especificado'}</div>
            </div>
          </div>

          {/* Fecha y acciones */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-neutral-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(gasto.fecha)}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteGasto(gasto.id.toString())}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 p-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
