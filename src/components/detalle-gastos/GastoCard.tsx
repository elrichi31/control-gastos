'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Gasto } from '@/types';

interface GastoCardProps {
  gasto: Gasto;
  onDeleteGasto: (gastoId: string) => void;
  formatMoney: (amount: number) => string;
  formatDate: (date: string) => string;
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
              <span className="text-gray-500 dark:text-gray-400">Categoría:</span>
              <div className="font-medium dark:text-gray-200">{gasto.categoria.nombre}</div>
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
