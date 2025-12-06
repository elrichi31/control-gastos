"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CTA() {
  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl md:rounded-3xl p-8 md:p-12 lg:p-16 text-center shadow-2xl shadow-blue-500/25">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/20 mb-4 md:mb-6">
            <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            <span className="text-xs md:text-sm text-white font-medium">
              Completamente gratis
            </span>
          </div>
          
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
            ¿Listo para tomar el control?
          </h2>
          
          {/* Subtext */}
          <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Únete y comienza a entender hacia dónde va tu dinero. 
            Tu yo del futuro te lo agradecerá.
          </p>
          
          {/* CTA Button */}
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 text-base md:text-lg px-6 md:px-10 py-5 md:py-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group font-semibold w-full sm:w-auto"
            >
              Crear mi cuenta gratis
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          
          {/* Additional info */}
          <p className="text-xs md:text-sm text-blue-200 mt-4 md:mt-6">
            Sin tarjeta de crédito • Configuración en minutos
          </p>
        </div>
      </div>
    </section>
  )
}
