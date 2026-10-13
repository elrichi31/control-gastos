import Link from 'next/link'
import { ArrowRight, Receipt, Wallet, BarChart3 } from 'lucide-react'
import styles from './landing.module.css'

export function HowItWorks() {
  return (
    <section id="how-it-works" className={`${styles.container} ${styles.how}`} aria-labelledby="how-title">
      <h2 id="how-title" className={styles.bigStatement} data-reveal><span>Registra <span className={`${styles.statementObject} ${styles.statementGreen}`} aria-hidden="true"><Receipt size={40} /></span> tus gastos.</span><span>Organiza <span className={`${styles.statementObject} ${styles.statementBlue}`} aria-hidden="true"><Wallet size={40} /></span> tu mes.</span><span>Entiende <span className={`${styles.statementObject} ${styles.statementOrange}`} aria-hidden="true"><BarChart3 size={40} /></span> tu dinero.</span></h2>
      <div className={styles.howBottom}><p>Crea tu cuenta, añade tu primer gasto y empieza a ver tus finanzas con más claridad.</p><Link href="/auth/register" className={styles.textLink}>Crear mi cuenta <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </section>
  )
}
