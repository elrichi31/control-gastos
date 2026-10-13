import Link from "next/link"
import { ArrowRight, Wallet, ShoppingBasket, Coffee, Bus } from "lucide-react"
import styles from './landing.module.css'

const transactions = [
  { name: 'Supermercado', category: 'Alimentación', amount: '$48.50', Icon: ShoppingBasket },
  { name: 'Café con amigos', category: 'Alimentación', amount: '$8.00', Icon: Coffee },
  { name: 'Transporte', category: 'Transporte', amount: '$3.50', Icon: Bus },
]

export function Hero() {
  return (
    <section className={`${styles.container} ${styles.hero}`} aria-labelledby="landing-title">
      <div className={styles.heroCopy}>
        <h1 id="landing-title">Tus finanzas personales,<br />bajo control.</h1>
        <p>Registra tus gastos, establece presupuestos y visualiza tu progreso financiero. Todo en un solo lugar.</p>
        <div className={styles.actions}>
          <Link href="/auth/register" className={styles.primary}>Comenzar gratis <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link href="#features" className={styles.secondary}>Conocer más</Link>
        </div>
        <p className={styles.heroNote}>Menos cuentas pendientes.<br />Más claridad sobre tu dinero.</p>
      </div>
      <figure className={styles.productFigure}>
        <div className={styles.product}>
          <div className={styles.productTop}><span><Wallet size={18} aria-hidden="true" /> BethaSpend</span><span>Resumen del mes</span></div>
          <div className={styles.productBody}>
            <div className={styles.balance}><span>Gasto del mes</span><strong>$360.00</strong><span>Presupuesto mensual · $600.00</span></div>
            <div className={styles.budgetTrack} role="img" aria-label="Ejemplo: 60% del presupuesto utilizado"><span /></div>
            <div className={styles.budgetLabels}><span>60% utilizado</span><span>$240.00 disponibles</span></div>
            <div className={styles.transactionHeading}><strong>Últimos gastos</strong><span>Este mes</span></div>
            {transactions.map(({ name, category, amount, Icon }) => <div className={styles.transaction} key={name}>
              <Icon size={18} aria-hidden="true" /><div><strong>{name}</strong><span>{category}</span></div><strong>{amount}</strong>
            </div>)}
            <Link href="/auth/register" className={styles.previewLink}>Empieza con tus propios gastos <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
        <figcaption>Vista de ejemplo · datos ilustrativos</figcaption>
      </figure>
    </section>
  )
}
