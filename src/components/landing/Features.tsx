import { Calculator, Repeat, BarChart3, FolderOpen, TrendingUp, Shield } from 'lucide-react'
import styles from './landing.module.css'

const features = [
  { Icon: Calculator, title: 'Presupuestos mensuales', description: 'Establece límites de gasto por categoría y recibe alertas cuando te acerques al límite.' },
  { Icon: Repeat, title: 'Gastos recurrentes', description: 'Automatiza el registro de suscripciones, servicios y otros gastos que se repiten.' },
  { Icon: BarChart3, title: 'Estadísticas visuales', description: 'Gráficos claros que te muestran hacia dónde va tu dinero cada mes.' },
  { Icon: FolderOpen, title: 'Categorías personalizadas', description: 'Organiza tus gastos en categorías que tengan sentido para ti.' },
  { Icon: TrendingUp, title: 'Seguimiento de progreso', description: 'Compara mes a mes y conoce tus hábitos financieros.' },
  { Icon: Shield, title: 'Datos seguros', description: 'Tu información financiera está protegida con prácticas de seguridad.' },
]

export function Features() {
  return (
    <section id="features" className={styles.features} aria-labelledby="features-title">
      <div className={styles.container}>
        <div className={styles.sectionIntro}><h2 id="features-title">Todo lo que necesitas.<br />Nada que te distraiga.</h2><p>Herramientas simples para entender y organizar tus finanzas personales.</p></div>
        <div className={styles.featureGrid}>{features.map(({ Icon, title, description }) => <article className={styles.feature} key={title}><Icon size={23} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>)}</div>
      </div>
    </section>
  )
}
