"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wallet, Menu, X, LayoutDashboard } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return "U"
    const names = session.user.name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }

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
                <span className="text-base font-semibold text-gray-900 dark:text-white">
                  BethaSpend
                </span>
              </Link>

              {/* Navigation Links - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/#features" 
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Características
                </Link>
                <Link 
                  href="/#how-it-works" 
                  className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  Cómo funciona
                </Link>
              </div>

              {/* Auth Buttons - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                <ModeToggle />
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-blue-500/20 hover:ring-blue-500/40 transition-all">
                        <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "Usuario"} />
                        <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-neutral-800/50"
                      >
                        Iniciar sesión
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                        Comenzar gratis
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="flex items-center gap-2 md:hidden">
                <ModeToggle />
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden pt-4 pb-2 border-t border-gray-200/50 dark:border-neutral-700/50 mt-3 space-y-3">
                <Link 
                  href="/#features" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors py-2"
                >
                  Características
                </Link>
                <Link 
                  href="/#how-it-works" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors py-2"
                >
                  Cómo funciona
                </Link>
                <div className="flex flex-col gap-2 pt-2">
                  {isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                        >
                          Iniciar sesión
                        </Button>
                      </Link>
                      <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                        <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                          Comenzar gratis
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
