"use client"

import { useState, useEffect } from "react"
import { useMobile } from "./useMobile"

export function useSidebar() {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Auto-close sidebar on mobile, auto-open on desktop
  useEffect(() => {
    setIsOpen(!isMobile)
  }, [isMobile])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return {
    isOpen,
    toggle,
    close,
    open,
    isMobile,
    isCollapsed,
    toggleCollapse,
  }
}
