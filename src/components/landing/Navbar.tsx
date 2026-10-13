"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Wallet, Menu, X } from "lucide-react"
import { ModeToggle } from "@/components/layout/mode-toggle"
import { MotionToggle } from './LandingMotion'
import styles from './landing.module.css'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { status } = useSession()
  const authenticated = status === 'authenticated'
  const close = () => setIsMenuOpen(false)
  return (
    <header className={styles.header}>
      <nav className={`${styles.container} ${styles.nav}`} aria-label="Navegación principal">
        <Link href="/" className={styles.brand}><Wallet size={24} aria-hidden="true" />BethaSpend</Link>
        <div className={styles.desktopLinks}><Link href="/#features">Características</Link><Link href="/#how-it-works">Cómo funciona</Link></div>
        <div className={styles.navActions}><MotionToggle /><ModeToggle /><div className={styles.desktopAuth}>
          {authenticated ? <Link href="/dashboard" className={styles.primary}>Ir al dashboard</Link> : <><Link href="/auth/login" className={styles.outline}>Iniciar sesión</Link><Link href="/auth/register" className={styles.primary}>Comenzar gratis</Link></>}
        </div><button type="button" className={styles.menuButton} aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={isMenuOpen} aria-controls="landing-menu" onClick={() => setIsMenuOpen(open => !open)} onKeyDown={event => { if (event.key === 'Escape') close() }}>{isMenuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
        <div id="landing-menu" className={styles.mobileMenu} hidden={!isMenuOpen} onKeyDown={event => { if (event.key === 'Escape') close() }}>
          <Link href="/#features" onClick={close}>Características</Link><Link href="/#how-it-works" onClick={close}>Cómo funciona</Link>
          {authenticated ? <Link href="/dashboard" className={styles.primary} onClick={close}>Ir al dashboard</Link> : <><Link href="/auth/login" onClick={close}>Iniciar sesión</Link><Link href="/auth/register" className={styles.primary} onClick={close}>Comenzar gratis</Link></>}
        </div>
      </nav>
    </header>
  )
}
