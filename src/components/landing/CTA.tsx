import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BethaMark } from '@/components/brand/BethaMark'
import styles from './landing.module.css'

export function CTA() {
  return <section className={`${styles.container} ${styles.cta}`} aria-labelledby="cta-title" data-scene="closing"><div className={styles.ctaLight} aria-hidden="true" /><div className={styles.ctaInner}><span className={styles.ctaMark} aria-hidden="true"><BethaMark size={60} /></span><h2 id="cta-title">Tu dinero.<br />Un panorama más claro.</h2><p>Comienza a entender hacia dónde va tu dinero.</p><Link href="/auth/register" className={styles.primary}>Crear mi cuenta gratis <ArrowRight size={18} aria-hidden="true" /></Link></div></section>
}
