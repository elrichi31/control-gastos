import Link from 'next/link'
import { ArrowUpRight, Coffee, Bus, ShoppingBasket, Home, Repeat, Check, Wallet, ArrowRight } from 'lucide-react'
import styles from './landing.module.css'

export function Features() {
  return (
    <section id="features" className={`${styles.container} ${styles.features}`} aria-labelledby="features-title">
      <div className={styles.sectionIntro} data-reveal><h2 id="features-title">Una forma más clara<br />de llevar tus cuentas.</h2><p>Del gasto de hoy al presupuesto del mes.<br />Cada pieza conectada, sin complicarte.</p></div>
      <div className={styles.bento}>
        <article className={`${styles.sceneCard} ${styles.budgetCard}`} data-scene="budget">
          <div className={styles.budgetScene}>
            <div className={styles.budgetBack} aria-hidden="true"><span>Tu presupuesto</span><Wallet size={24} /></div>
            <div className={`${styles.budgetDemo} ${styles.animated}`}><div><span>Alimentación</span><ShoppingBasket size={20} aria-hidden="true" /></div><strong>$180<span> / $300</span></strong><div className={styles.budgetTrack}><span style={{ transform: 'scaleX(0.6)' }} /></div><p>$120 disponibles este mes</p></div>
            <span className={`${styles.budgetBadge} ${styles.animated}`}><Check size={15} aria-hidden="true" />Dentro de tu presupuesto</span>
          </div>
          <div className={styles.sceneCopy}><h3>Un límite claro.<br />Más espacio para decidir.</h3><p>Establece presupuestos por categoría y conoce cuánto te queda antes de tu próximo gasto.</p><Link href="/auth/register">Organizar mi presupuesto <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </article>
        <article className={`${styles.sceneCard} ${styles.recurringCard}`} data-scene="recurring">
          <div className={styles.recurringScene}>
            <div className={styles.calendarStrip} aria-hidden="true">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => <span key={i}>{day}<strong className={i === 3 ? styles.calendarActive : undefined}>{i + 12}</strong></span>)}</div>
            <div className={`${styles.recurringDemo} ${styles.animated}`}><span className={styles.recurringIcon}><Repeat size={23} aria-hidden="true" /></span><div><strong>Internet de casa</strong><span>Mensual · día 15</span></div><strong>$28.00</strong></div>
            <div className={`${styles.recurringNotice} ${styles.animated}`}><Check size={16} aria-hidden="true" />Gasto recurrente registrado</div>
          </div>
          <div className={styles.sceneCopy}><h3>Lo que se repite,<br />no se te escapa.</h3><p>Suscripciones, servicios y pagos mensuales. Configúralos una vez y automatiza su registro.</p><Link href="/auth/register">Organizar mis recurrentes <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </article>
        <article className={`${styles.sceneCard} ${styles.categoryCard}`} data-scene="categories">
          <div className={styles.categoryScene} aria-hidden="true">{[{ Icon: Coffee, name: 'Alimentación', style: styles.tileGreen }, { Icon: Bus, name: 'Transporte', style: styles.tileBlue }, { Icon: Home, name: 'Hogar', style: styles.tileOrange }, { Icon: ShoppingBasket, name: 'Compras', style: styles.tileViolet }].map(({ Icon, name, style }) => <div className={`${styles.categoryTile} ${style} ${styles.animated}`} key={name}><Icon size={34} strokeWidth={1.7} /><span>{name}</span></div>)}</div>
          <div className={styles.sceneCopy}><h3>Tu dinero,<br />con nombre y lugar.</h3><p>Organiza tus gastos con categorías y etiquetas que tengan sentido para ti.</p></div>
          <Link href="/auth/register" className={styles.cornerLink} aria-label="Comenzar a organizar mis gastos"><ArrowUpRight size={21} /></Link>
        </article>
        <article className={`${styles.sceneCard} ${styles.statsCard}`} data-scene="statistics">
          <div className={styles.chartScene} role="img" aria-label="Comparación ilustrativa de gastos de cuatro semanas"><div className={styles.chartBars}>{[42, 76, 57, 90].map((height, i) => <div key={i}><span className={styles.animated} style={{ height: `${height}%` }} /><small>S{i + 1}</small></div>)}</div><span className={styles.chartCaption}>Tu gasto, semana a semana</span></div>
          <div className={styles.sceneCopy}><h3>No solo números.<br />Un panorama completo.</h3><p>Estadísticas visuales para conocer tus hábitos y comparar tus gastos mes a mes.</p></div>
        </article>
      </div>
      <p className={styles.sampleNote}>Demos de producto · datos ilustrativos</p>
    </section>
  )
}
