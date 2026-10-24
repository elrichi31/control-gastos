"use client"
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Compatibility for previously installed PWAs whose start_url is still '/'. */
export function MobileRedirect() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname !== '/') return
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true) {
      window.location.replace('/?pwa=1')
    }
  }, [pathname])
  return null
}
