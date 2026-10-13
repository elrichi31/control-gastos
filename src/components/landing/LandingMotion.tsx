"use client"

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pause, Play } from 'lucide-react'
import styles from './landing.module.css'

const MotionContext = createContext({ paused: false, reduced: false, toggle: () => {} })
export const useLandingMotion = () => useContext(MotionContext)

export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const pauseRef = useRef(false)
  const reveals = useRef<Animation[]>([])
  const [userPaused, setUserPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [hidden, setHidden] = useState(false)
  const paused = userPaused || reduced || hidden
  useEffect(() => {
    pauseRef.current = paused
    if (paused) reveals.current.forEach(animation => { if (animation.playState === 'running') animation.finish() })
  }, [paused])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    const visibility = () => setHidden(document.hidden)
    update(); visibility()
    media.addEventListener('change', update)
    document.addEventListener('visibilitychange', visibility)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        target.setAttribute('data-in-view', String(isIntersecting))
        if (isIntersecting && !target.hasAttribute('data-revealed')) {
          target.setAttribute('data-revealed', 'true')
          if (!media.matches && !pauseRef.current) reveals.current.push(target.animate([{ opacity: 0.65, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }))
        }
      })
    }, { threshold: 0.12 })
    root.current?.querySelectorAll('[data-scene], [data-reveal]').forEach(element => observer.observe(element))
    return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  return <MotionContext.Provider value={{ paused, reduced, toggle: () => setUserPaused(value => !value) }}><div ref={root} className={styles.landing} data-motion-paused={paused}>{children}</div></MotionContext.Provider>
}

export function MotionToggle() {
  const { paused, reduced, toggle } = useLandingMotion()
  const label = reduced ? 'Movimiento reducido activado' : paused ? 'Reanudar animaciones' : 'Pausar animaciones'
  return <button type="button" className={styles.motionToggle} onClick={toggle} disabled={reduced} aria-pressed={paused} aria-label={label} title={label}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>
}
