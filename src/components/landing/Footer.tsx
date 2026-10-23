import Link from 'next/link'
import { BethaMark } from '@/components/brand/BethaMark'
import styles from './landing.module.css'

export function Footer() {
  return <footer className={`${styles.container} ${styles.footer}`}><div className={styles.footerTop}><div><Link href="/" className={styles.brand}><BethaMark size={23} />BethaSpend</Link><p>Simplificando tus finanzas personales.</p></div><nav aria-label="Enlaces del pie de página"><Link href="#features">Características</Link><Link href="#how-it-works">Cómo funciona</Link><Link href="/auth/login">Iniciar sesión</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} BethaSpend</span><span>Desarrollado por <a href="https://bethalabs.com" target="_blank" rel="noopener noreferrer">Bethalabs</a></span></div></footer>
}
