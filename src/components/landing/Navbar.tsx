"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="max-w-4xl mx-auto px-4 mt-3">
        <div className="glass-strong rounded-xl shadow-lg shadow-black/5">
          <div className="px-4 py-2.5">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="p-1.5 rounded-lg bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-base font-semibold text-gray-900">
                  BethaSpend
                </span>
              </Link>

              {/* Navigation Links - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/#features" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Características
                </Link>
                <Link 
                  href="/#how-it-works" 
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cómo funciona
                </Link>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                  >
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                    Comenzar gratis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
