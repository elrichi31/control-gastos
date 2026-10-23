"use client"

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, ChevronDown, ShoppingBasket, Coffee, Bus, Home, Repeat, PiggyBank, Tags, Film, Zap, HeartPulse, GraduationCap, Shirt, type LucideIcon } from 'lucide-react'
import { BethaMark } from '@/components/brand/BethaMark'
import { useLandingMotion } from './LandingMotion'
import styles from './landing.module.css'

const BUDGET = 600
const WINDOW = 0.45
const STICKY_QUERY = '(min-width: 1001px)'

// `angle` places each chip around the emblem on desktop; `stack` is its [x, y] offset when the layout is a single column.
const CHIPS: { name: string; amount: number; Icon: LucideIcon; angle: number; stack: [number, number]; delay: number; tone: string }[] = [
  { name: 'Café con amigos', amount: 8, Icon: Coffee, angle: -148, stack: [-1, -1], delay: 0.02, tone: styles.toneGreen },
  { name: 'Supermercado', amount: 48.5, Icon: ShoppingBasket, angle: -58, stack: [1, -0.9], delay: 0.12, tone: styles.toneBlue },
  { name: 'Internet de casa', amount: 28, Icon: Repeat, angle: 8, stack: [-1, -0.62], delay: 0.22, tone: styles.toneOrange },
  { name: 'Transporte', amount: 3.5, Icon: Bus, angle: 42, stack: [1, -0.55], delay: 0.32, tone: styles.toneViolet },
  { name: 'Hogar', amount: 120, Icon: Home, angle: 138, stack: [-1, 0.55], delay: 0.42, tone: styles.toneGreen },
  { name: 'Compras', amount: 64, Icon: Shirt, angle: 188, stack: [1, 0.6], delay: 0.52, tone: styles.toneBlue },
]
const CHIPS_TOTAL = CHIPS.reduce((sum, chip) => sum + chip.amount, 0)

const TILES: { Icon: LucideIcon; label: string }[] = [
  { Icon: Coffee, label: 'Alimentación' }, { Icon: Bus, label: 'Transporte' }, { Icon: Home, label: 'Hogar' }, { Icon: ShoppingBasket, label: 'Mercado' },
  { Icon: Repeat, label: 'Recurrentes' }, { Icon: PiggyBank, label: 'Ahorro' }, { Icon: Film, label: 'Ocio' }, { Icon: Zap, label: 'Servicios' },
  { Icon: HeartPulse, label: 'Salud' }, { Icon: GraduationCap, label: 'Educación' }, { Icon: Shirt, label: 'Compras' }, { Icon: Tags, label: 'Etiquetas' },
]

// Deterministic PRNG so the server and client render the same burst.
function buildBurst() {
  let seed = 7
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const round = (value: number) => Math.round(value * 10) / 10
  const rays = Array.from({ length: 190 }, (_, i) => {
    const angle = (i / 190) * Math.PI * 2 + (rnd() - 0.5) * 0.03
    const inner = 132 + rnd() * 26
    const outer = Math.min(inner + 18 + rnd() ** 2.2 * 210, 372)
    return {
      x1: round(Math.cos(angle) * inner), y1: round(Math.sin(angle) * inner), x2: round(Math.cos(angle) * outer), y2: round(Math.sin(angle) * outer),
      opacity: round(0.22 + rnd() * 0.5), dot: round(0.9 + rnd() * 2.1), accent: rnd() > 0.93,
    }
  })
  const specks = Array.from({ length: 70 }, () => {
    const angle = rnd() * Math.PI * 2
    const radius = 150 + rnd() * 220
    return { x: round(Math.cos(angle) * radius), y: round(Math.sin(angle) * radius), r: round(0.8 + rnd()), opacity: round(0.2 + rnd() * 0.4) }
  })
  return { rays, specks }
}
const BURST = buildBurst()

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => value * value * (3 - 2 * value)

export function Hero() {
  const track = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const center = useRef<HTMLDivElement>(null)
  const [total, setTotal] = useState(0)
  const { reduced } = useLandingMotion()

  useEffect(() => {
    const trackEl = track.current, stageEl = stage.current, centerEl = center.current
    if (!trackEl || !stageEl || !centerEl) return
    const apply = (progress: number) => {
      const landed = CHIPS.reduce((sum, chip) => sum + chip.amount * smooth(clamp((progress - chip.delay) / WINDOW)), 0)
      stageEl.style.setProperty('--p', progress.toFixed(3))
      stageEl.style.setProperty('--fill', (landed / BUDGET).toFixed(3))
      setTotal(Math.round(landed))
    }
    if (reduced) { apply(1); return }
    const sticky = window.matchMedia(STICKY_QUERY)
    let frame = 0, last = -1
    const read = () => {
      frame = 0
      let progress: number
      if (sticky.matches) {
        const top = parseFloat(getComputedStyle(stageEl).top) || 0
        progress = (top - trackEl.getBoundingClientRect().top) / Math.max(1, trackEl.offsetHeight - stageEl.offsetHeight)
      } else {
        const docTop = centerEl.getBoundingClientRect().top + window.scrollY
        progress = window.scrollY / Math.max(380, docTop * 0.9)
      }
      progress = clamp(progress)
      if (Math.abs(progress - last) > 0.0005) { last = progress; apply(progress) }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    read()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [reduced])

  return (
    <section className={`${styles.container} ${styles.hero}`} aria-labelledby="landing-title" data-hero-layout="burst" data-scene="hero">
      <div ref={track} className={styles.heroTrack} data-static={reduced}>
        <div ref={stage} className={styles.heroStage} data-static={reduced}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 id="landing-title">Tu dinero.<br /><span className={styles.heroEmphasis}>bajo control.</span></h1>
              <div className={styles.actions}>
                <Link href="/auth/register" className={styles.primary}>Comenzar gratis <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link href="#features" className={styles.secondary}>Cómo funciona</Link>
              </div>
            </div>

            <div ref={center} className={styles.heroCenter} role="img" aria-label="Ilustración de ejemplo: seis gastos entran a un presupuesto mensual de $600">
              <div className={styles.heroBurst} aria-hidden="true">
                <div className={styles.heroBurstScroll}>
                  <div className={`${styles.heroSpin} ${styles.animated}`}>
                    <svg viewBox="-380 -380 760 760" focusable="false">
                      {BURST.rays.map((ray, i) => <g key={i} opacity={ray.opacity}>
                        <line className={styles.rayLine} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
                        <circle className={ray.accent ? styles.rayAccent : styles.rayDot} cx={ray.x2} cy={ray.y2} r={ray.dot} />
                      </g>)}
                      {BURST.specks.map((speck, i) => <circle key={`s${i}`} className={styles.rayDot} cx={speck.x} cy={speck.y} r={speck.r} opacity={speck.opacity} />)}
                    </svg>
                  </div>
                </div>
              </div>
              {CHIPS.map(({ name, amount, Icon, angle, stack, delay, tone }) => {
                const rad = (angle * Math.PI) / 180
                const style = { '--d': delay, '--dx': Math.cos(rad).toFixed(3), '--dy': Math.sin(rad).toFixed(3), '--mx': stack[0], '--my': stack[1] } as CSSProperties
                return <div className={styles.heroChip} style={style} key={name} aria-hidden="true"><span className={`${styles.chipIcon} ${tone}`}><Icon size={16} /></span><strong>{name}</strong><span>${amount.toFixed(2)}</span></div>
              })}
              <div className={styles.heroEmblem} aria-hidden="true">
                <svg className={styles.heroRing} viewBox="0 0 252 252" focusable="false"><circle className={styles.ringTrack} cx="126" cy="126" r="122" /><circle className={styles.ringFill} cx="126" cy="126" r="122" /></svg>
                <BethaMark size={136} />
              </div>
              <div className={styles.heroTotal} aria-hidden="true"><span>Gastado este mes</span><strong>${total.toLocaleString('en-US')}</strong><span>de ${BUDGET.toFixed(2)} · {Math.round((total / BUDGET) * 100)}%</span></div>
              <div className={styles.heroCaption} aria-hidden="true">
                <span className={styles.captionStart}>Baja y mira cómo entra cada gasto <ChevronDown size={15} /></span>
                <span className={styles.captionEnd}>Cada gasto encuentra su lugar.</span>
              </div>
            </div>

            <div className={styles.heroAside}>
              <Link href="#features" className={styles.heroPill}><span className={styles.eyebrowDot} aria-hidden="true" /><span>Presupuestos, recurrentes y categorías</span><ArrowUpRight size={15} aria-hidden="true" /></Link>
              <p>Anota cada gasto en segundos, fija un presupuesto y mira al instante cuánto te queda del mes. Sin hojas de cálculo.</p>
            </div>
          </div>

          <div className={styles.heroStrip}>
            <p>Organiza cada gasto en la categoría que tenga sentido para ti</p>
            <ul aria-label="Categorías de ejemplo">{TILES.map(({ Icon, label }) => <li className={styles.heroTile} key={label} title={label}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /><span className={styles.srOnly}>{label}</span></li>)}</ul>
            <small>Vista de ejemplo · datos ilustrativos · suma de ejemplo ${CHIPS_TOTAL.toFixed(2)}</small>
          </div>
        </div>
      </div>
    </section>
  )
}
