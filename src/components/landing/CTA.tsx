import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import styles from './landing.module.css'

export function CTA() {
  return <section className={styles.cta} aria-labelledby="cta-title"><div className={`${styles.container} ${styles.ctaInner}`}><div><h2 id="cta-title">Tu dinero.<br />Un panorama más claro.</h2><p>Comienza a entender hacia dónde va tu dinero.</p></div><Link href="/auth/register" className={styles.primary}>Crear mi cuenta gratis <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
}
