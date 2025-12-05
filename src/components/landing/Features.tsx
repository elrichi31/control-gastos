"use client"

import { 
  Calculator, 
  Repeat, 
  BarChart3, 
  FolderOpen,
  TrendingUp,
  Shield
} from "lucide-react"

const features = [
  {
    icon: Calculator,
    title: "Presupuestos mensuales",
    description: "Establece límites de gasto por categoría y recibe alertas cuando te acerques al límite.",
    color: "blue"
  },
  {
    icon: Repeat,
    title: "Gastos recurrentes",
    description: "Automatiza el registro de gastos que se repiten como suscripciones, servicios y más.",
    color: "purple"
  },
  {
    icon: BarChart3,
    title: "Estadísticas visuales",
    description: "Gráficos claros que te muestran hacia dónde va tu dinero cada mes.",
    color: "green"
  },
  {
    icon: FolderOpen,
    title: "Categorías personalizadas",
    description: "Organiza tus gastos en categorías que tengan sentido para ti.",
    color: "orange"
  },
  {
    icon: TrendingUp,
    title: "Seguimiento de progreso",
    description: "Compara mes a mes y observa cómo mejoran tus hábitos financieros.",
    color: "indigo"
  },
  {
    icon: Shield,
    title: "Datos seguros",
    description: "Tu información financiera está protegida con las mejores prácticas de seguridad.",
    color: "teal"
  }
]

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    hover: "group-hover:bg-blue-100"
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    hover: "group-hover:bg-purple-100"
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-500",
    hover: "group-hover:bg-green-100"
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
    hover: "group-hover:bg-orange-100"
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-500",
    hover: "group-hover:bg-indigo-100"
  },
  teal: {
    bg: "bg-teal-50",
    icon: "text-teal-500",
    hover: "group-hover:bg-teal-100"
  }
}

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para{" "}
            <span className="text-gradient-blue">controlar tus gastos</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Herramientas simples pero poderosas diseñadas para ayudarte a 
            entender y mejorar tus finanzas personales.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses]
            const Icon = feature.icon
            
            return (
              <div 
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 bg-white"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl ${colors.bg} ${colors.hover} transition-colors mb-4`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
