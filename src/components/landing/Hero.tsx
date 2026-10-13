"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Wallet, ShoppingBasket, Coffee, Bus, Check, RotateCcw, Plus } from 'lucide-react'
import { useLandingMotion } from './LandingMotion'
import styles from './landing.module.css'

export function Hero() {
  const stage = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState(0)
  const [running, setRunning] = useState(false)
  const [inView, setInView] = useState(false)
  const { paused } = useLandingMotion()
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting && !started.current) { started.current = true; setRunning(true) }
    }, { threshold: 0.15 })
    if (stage.current) observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!running || paused || !inView) return
    if (phase >= 3) return
    const timer = setTimeout(() => setPhase(value => value + 1), phase === 0 ? 1300 : 1600)
    return () => clearTimeout(timer)
  }, [phase, running, paused, inView])
  const total = phase === 3 ? 360 : 352
  const rows = [
    ...(phase === 3 ? [{ name: 'Café con amigos', category: 'Alimentación', amount: '$8.00', Icon: Coffee }] : []),
    { name: 'Supermercado', category: 'Alimentación', amount: '$48.50', Icon: ShoppingBasket },
    { name: 'Transporte', category: 'Transporte', amount: '$3.50', Icon: Bus },
  ]
  return (
    <section className={`${styles.container} ${styles.hero}`} aria-labelledby="landing-title" data-hero-layout="split">
      <div className={styles.heroCopy}>
        <h1 id="landing-title">Tu dinero.<br /><span className={styles.heroEmphasis}>bajo control.</span></h1>
        <p>Registra tus gastos, establece presupuestos y visualiza tu progreso financiero. Todo en un solo lugar.</p>
        <div className={styles.actions}><Link href="/auth/register" className={styles.primary}>Comenzar gratis <ArrowRight size={18} aria-hidden="true" /></Link><Link href="#features" className={styles.secondary}>Explorar BethaSpend</Link></div>
      </div>
      <figure className={styles.productFigure}>
        <div ref={stage} className={styles.heroStage} data-scene="expense" data-demo-phase={phase}>
          <div className={styles.workspace}>
            <div className={styles.productTop}><span><Wallet size={20} aria-hidden="true" /> BethaSpend</span><span>Resumen de tu mes</span></div>
            <div className={styles.productBody}>
              <div className={styles.workspaceSummary}>
                <div className={styles.balance}><span>Gasto del mes</span><strong>${total.toFixed(2)}</strong><span>Presupuesto mensual · $600.00</span></div>
                <div className={styles.heroAvailable}><span>Disponible</span><strong>${(600 - total).toFixed(2)}</strong></div>
              </div>
              <div className={styles.budgetTrack} role="img" aria-label={`Ejemplo: ${Math.round(total / 6)}% del presupuesto utilizado`}><span style={{ transform: `scaleX(${total / 600})` }} /></div>
              <div className={styles.budgetLabels}><span>{Math.round(total / 6)}% utilizado</span><span>${(600 - total).toFixed(2)} disponibles</span></div>
              <div className={styles.transactionHeading}><strong>Últimos gastos</strong><span>Este mes</span></div>
              <div className={styles.transactionList}>{rows.map(({ name, category, amount, Icon }) => <div className={styles.transaction} key={name}><Icon size={18} aria-hidden="true" /><div><strong>{name}</strong><span>{category}</span></div><strong>{amount}</strong></div>)}</div>
            </div>
          </div>
          <div className={`${styles.expenseFloat} ${styles.animated}`}>
            <div className={styles.demoTop}><span>Nuevo gasto</span><Coffee size={18} aria-hidden="true" /></div>
            <span className={styles.demoLabel}>Descripción</span><div className={styles.demoValue}>{phase > 0 ? 'Café con amigos' : 'Tu próximo gasto'}<span className={styles.demoCursor} aria-hidden="true" /></div>
            <div className={styles.demoFields}><div><span className={styles.demoLabel}>Monto</span><strong>{phase > 0 ? '$8.00' : '—'}</strong></div><div><span className={styles.demoLabel}>Categoría</span><strong>{phase > 1 ? 'Alimentación' : 'Por elegir'}</strong></div></div>
            <div className={styles.demoSave}>{phase === 3 ? <><Check size={16} aria-hidden="true" /> Gasto registrado</> : <><Plus size={16} aria-hidden="true" /> {phase === 2 ? 'Registrando…' : 'Registrar gasto'}</>}</div>
          </div>
          <div className={styles.demoStatus}><span className={styles.statusDot} />{['Un gasto. Un lugar para todo.', 'Añade lo que gastaste.', 'Asígnale una categoría.', 'Tu resumen se actualiza.'][phase]}</div>
        </div>
        <figcaption><span>Vista de ejemplo · datos ilustrativos</span><button type="button" className={styles.replay} disabled={paused} onClick={() => { setPhase(0); setRunning(true) }}><RotateCcw size={14} aria-hidden="true" />Reproducir demo</button></figcaption>
      </figure>
    </section>
  )
}
