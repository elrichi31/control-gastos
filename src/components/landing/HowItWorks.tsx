"use client"

import { UserPlus, Receipt, LineChart } from "lucide-react"

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Crea tu cuenta",
    description: "Regístrate gratis en menos de un minuto. Sin tarjeta de crédito, sin compromisos."
  },
  {
    number: "2",
    icon: Receipt,
    title: "Registra tus gastos",
    description: "Añade tus gastos diarios de forma rápida. Categorízalos y establece presupuestos."
  },
  {
    number: "3",
    icon: LineChart,
    title: "Visualiza tu progreso",
    description: "Analiza tus patrones de gasto con gráficos claros y toma mejores decisiones financieras."
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comienza en <span className="text-gradient-blue">3 simples pasos</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No necesitas ser experto en finanzas. Nuestra plataforma te guía 
            paso a paso para que tomes el control de tu dinero.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop only */}
          <div className="hidden lg:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              
              return (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Icon container with number badge */}
                    <div className="relative mb-6">
                      {/* Main icon box */}
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-gray-200/50 flex items-center justify-center border border-gray-100">
                        <Icon className="w-8 h-8 text-blue-500" />
                      </div>
                      {/* Number badge - positioned top-right outside */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-500/30">
                        {step.number}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
