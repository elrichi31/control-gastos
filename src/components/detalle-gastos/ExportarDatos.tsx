"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText, Table, BarChart3 } from 'lucide-react'
import { Gasto } from '@/hooks/useGastosFiltrados'

interface ExportarDatosProps {
  gastos: Gasto[]
  gastosOriginal: Gasto[]
}

export function ExportarDatos({ gastos, gastosOriginal }: ExportarDatosProps) {
  const [formato, setFormato] = useState<'csv' | 'json'>('csv')
  const [alcance, setAlcance] = useState<'filtrados' | 'todos'>('filtrados')
  const [isOpen, setIsOpen] = useState(false)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const exportarCSV = (datos: Gasto[]) => {
    const headers = ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Método de Pago']
    const rows = datos.map(gasto => [
      gasto.fecha,
      `"${gasto.descripcion}"`,
      gasto.monto.toString(),
      `"${gasto.categoria?.nombre || 'Sin categoría'}"`,
      `"${gasto.metodo_pago?.nombre || 'Sin método'}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `gastos_${alcance}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportarJSON = (datos: Gasto[]) => {
    const jsonData = {
      exportado_en: new Date().toISOString(),
      total_gastos: datos.length,
      total_monto: datos.reduce((sum, g) => sum + g.monto, 0),
      gastos: datos.map(gasto => ({
        id: gasto.id,
        fecha: gasto.fecha,
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        categoria: gasto.categoria?.nombre || 'Sin categoría',
        metodo_pago: gasto.metodo_pago?.nombre || 'Sin método'
      }))
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `gastos_${alcance}_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportar = () => {
    const datosAExportar = alcance === 'filtrados' ? gastos : gastosOriginal
    
    if (formato === 'csv') {
      exportarCSV(datosAExportar)
    } else {
      exportarJSON(datosAExportar)
    }
    
    setIsOpen(false)
  }

  const gastosAExportar = alcance === 'filtrados' ? gastos : gastosOriginal

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-700">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md dark:bg-neutral-900 dark:border-neutral-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Download className="w-5 h-5" />
            Exportar Datos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleccionar alcance */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ¿Qué datos exportar?
            </label>
            <Select value={alcance} onValueChange={(value: 'filtrados' | 'todos') => setAlcance(value)}>
              <SelectTrigger className="dark:bg-neutral-900 dark:border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filtrados">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Solo gastos filtrados ({gastos.length} gastos)
                  </div>
                </SelectItem>
                <SelectItem value="todos">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Todos los gastos ({gastosOriginal.length} gastos)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seleccionar formato */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formato de exportación
            </label>
            <Select value={formato} onValueChange={(value: 'csv' | 'json') => setFormato(value)}>
              <SelectTrigger className="dark:bg-neutral-900 dark:border-neutral-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (Excel compatible)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    JSON (Datos estructurados)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vista previa de datos */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vista previa</h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>• Cantidad: {gastosAExportar.length} gastos</p>
              <p>• Total: {formatMoney(gastosAExportar.reduce((sum, g) => sum + g.monto, 0))}</p>
              <p>• Formato: {formato.toUpperCase()}</p>
              <p>• Campos: Fecha, Descripción, Monto, Categoría, Método de Pago</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:bg-neutral-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExportar}
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              disabled={gastosAExportar.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
