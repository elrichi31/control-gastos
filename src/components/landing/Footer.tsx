"use client"

import Link from "next/link"
import { Wallet } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and description */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500 text-white">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                BethaSpend
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
              Simplificando tus finanzas personales.
            </p>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-8">
            <a 
              href="#features" 
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Características
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cómo funciona
            </a>
            <Link 
              href="/auth/login"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-neutral-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} BethaSpend. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Desarrollado por</span>
              <a 
                href="https://bethalabs.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                Bethalabs
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
