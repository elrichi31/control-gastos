"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/Sidebar"
import { MobileHeader } from "@/components/MobileHeader"
import { useSidebar } from "@/hooks/useSidebar"
import { cn } from "@/lib/utils"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isOpen, toggle, close, isMobile, isCollapsed, toggleCollapse } = useSidebar()

  const getMainMargin = () => {
    if (isMobile) return "ml-0"
    if (isCollapsed) return "lg:ml-16"
    return "lg:ml-64"
  }

  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar
            isOpen={isOpen}
            onClose={close}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />

          <div className={cn("flex-1 transition-all duration-300 ease-in-out", getMainMargin())}>
            <MobileHeader onMenuClick={toggle} isMobile={isMobile} />
            <main className="bg-gray-50 min-h-screen">{children}</main>
          </div>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
