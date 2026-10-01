'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'
import { getCategoriaColor } from '@/lib/constants';
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
    <Card className="border border-border bg-card">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Descripción y monto */}
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">
                {gasto.descripcion}
              </h4>
            </div>
            <div className="ml-2 text-right">
              <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
                {formatMoney(gasto.monto)}
              </span>
            </div>
          </div>

          {/* Categoría y método de pago */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">Categoría:</span>
              <Badge className={`border font-normal ${getCategoriaColor(gasto.categoria?.nombre)}`}>
                {gasto.categoria?.nombre || 'Sin categoría'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Método:</span>
              <div className="font-medium text-foreground">{gasto.metodo_pago?.nombre || 'No especificado'}</div>
            </div>
          </div>

          {/* Fecha y acciones */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {formatDate(gasto.fecha)}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteGasto(gasto.id.toString())}
              aria-label={`Eliminar gasto: ${gasto.descripcion}`}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
