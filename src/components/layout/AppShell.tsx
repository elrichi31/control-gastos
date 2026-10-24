"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { PageTitle } from "@/components/layout/PageTitle"
import dynamic from "next/dynamic"
import { MobileRedirect } from "@/components/layout/MobileRedirect"
import { useSidebar } from "@/hooks/useSidebar"
import { cn } from "@/lib/utils"


const Toaster = dynamic(() => import("@/components/ui/sonner").then(m => m.Toaster), { ssr: false })
const PWAInstallPrompt = dynamic(() => import("./PWAInstallPrompt").then(m => m.PWAInstallPrompt), { ssr: false })

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isOpen, toggle, close, isMobile, isCollapsed, toggleCollapse } = useSidebar()

  // Rutas que no necesitan el layout principal (sin sidebar)
  const isAuthRoute = pathname?.startsWith('/auth')
  const isLandingPage = pathname === '/'
  const isPublicRoute = isAuthRoute || isLandingPage

  const getMainMargin = () => {
    if (isMobile) return "ml-0"
    if (isCollapsed) return "lg:ml-16"
    return "lg:ml-60"
  }

  return <>
    <PageTitle />
    
    {isPublicRoute ? (
      // Layout simple para landing y páginas de autenticación
      <main className="min-h-screen">{children}</main>
    ) : (
      // Layout principal con sidebar
      <div className="flex min-h-screen">
        <Sidebar
          isOpen={isOpen}
          onClose={close}
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        <div className={cn("min-w-0 flex-1 transition-all duration-300 ease-in-out motion-reduce:transition-none", getMainMargin())}>
          <TopBar onMenuClick={toggle} isMobile={isMobile} isMenuOpen={isOpen} />
          <main className="bg-background min-h-[calc(100dvh-3.5rem)]">{children}</main>
        </div>
      </div>
    )}

    <Toaster position="top-center" richColors />
    <PWAInstallPrompt />
    <MobileRedirect />
  </>
}
