'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from 'lucide-react'

interface Props {
  categoryData: Record<string, Array<{
    TIPO_DE_GASTO: string
    CREDITO: number
    DEBITO: number
    DESCRIPCION: string
    FECHA: string
  }>>
}

const CategoryDetails: React.FC<Props> = ({ categoryData }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const categoryLabels = Object.keys(categoryData)

  return (
    <div className="mb-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary">Desglose por Categoría</h2>
      <Accordion type="single" collapsible className="w-full">
        {categoryLabels.map((category) => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="text-lg font-semibold hover:text-primary transition-colors duration-200"
            >
              <div className="flex items-center justify-between w-full">
                <span>{category}</span>
                <div className="text-right space-y-1">
                  {/* Créditos */}
                  <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    +${categoryData[category]
                      .filter(t => t.TIPO_DE_GASTO === 'Crédito')
                      .reduce((sum, t) => sum + t.CREDITO, 0)
                      .toFixed(2)} <span className="hidden sm:inline">(Créditos)</span>
                  </div>

                  {/* Débitos */}
                  <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                    -${categoryData[category]
                      .filter(t => t.TIPO_DE_GASTO === 'Débito')
                      .reduce((sum, t) => sum + t.DEBITO, 0)
                      .toFixed(2)} <span className="hidden sm:inline">(Débitos)</span>
                  </div>

                  {/* Balance neto */}
                  <div className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs font-medium">
                    Balance: ${(
                      categoryData[category].reduce((sum, t) => {
                        const sign = t.TIPO_DE_GASTO === 'Crédito' ? 1 : -1;
                        return sum + (sign * (t.CREDITO || t.DEBITO));
                      }, 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </AccordionTrigger>


            <AccordionContent>
              <div className="mt-4 space-y-4">
                {categoryData[category].map((transaction, index) => {
                  const isCredito = transaction.TIPO_DE_GASTO === 'Crédito';
                  const amount = isCredito ? transaction.CREDITO : transaction.DEBITO;
                  const sign = isCredito ? '+' : '-';
                  const textColor = isCredito ? 'text-green-600' : 'text-red-600';
                  const bgColor = isCredito ? 'bg-green-50' : 'bg-red-50';

                  return (
                    <Card key={index} className={`overflow-hidden transition-all duration-200 hover:shadow-md ${bgColor}`}>
                      <CardContent className="p-4">
                        <p className="font-medium mb-2">{transaction.DESCRIPCION}</p>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{transaction.FECHA}</span>
                          </div>
                          <div className={`flex items-center font-semibold ${textColor}`}>
                            <span>{sign}${amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export default CategoryDetails
