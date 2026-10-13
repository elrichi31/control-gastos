import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import styles from './landing.module.css'

const steps = [
  { title: 'Crea tu cuenta', description: 'Regístrate gratis. Sin tarjeta de crédito, sin compromisos.' },
  { title: 'Registra tus gastos', description: 'Añade tus gastos diarios, elige su categoría y establece tus presupuestos.' },
  { title: 'Visualiza tu progreso', description: 'Analiza tus patrones de gasto y toma mejores decisiones financieras.' },
]
export function HowItWorks() {
  return (
    <section id="how-it-works" className={`${styles.container} ${styles.how}`} aria-labelledby="how-title">
      <div><h2 id="how-title">Empieza simple.<br />Hazlo parte de tu día.</h2><p>No necesitas ser experto en finanzas para tomar el control de tu dinero.</p><Link href="/auth/register" className={styles.textLink}>Crear mi cuenta <ArrowRight size={18} aria-hidden="true" /></Link></div>
      <ol className={styles.steps}>{steps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
    </section>
  )
}
