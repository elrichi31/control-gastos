"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap } from "lucide-react"
import { useTheme } from "next-themes"

const typingWords = ["simplificadas", "organizadas", "bajo control", "en orden"]

// Particle type
interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

// Particle system configuration
const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.1,
  }))
}

export function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const heroRef = useRef<HTMLElement>(null)
  const { resolvedTheme } = useTheme()
  
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
    // Generate particles only on client side
    setParticles(generateParticles(40))
  }, [])

  // Typing effect
  useEffect(() => {
    const currentWord = typingWords[currentWordIndex]
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentWord.length) {
          setDisplayText(currentWord.slice(0, displayText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentWordIndex((prev) => (prev + 1) % typingWords.length)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentWordIndex])

  // Mouse tracking for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Colores dinámicos según el tema
  const colors = mounted ? {
    gradientStart: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)',
    gradientMid: isDark ? 'rgba(14, 165, 233, 0.25)' : 'rgba(14, 165, 233, 0.12)',
    gradientEnd: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
    spotlightColor: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)',
    particleColor: isDark ? 'bg-white' : 'bg-blue-500',
    gridOpacity: isDark ? '0.03' : '0.04',
    rayColor: isDark ? 'via-blue-500/20' : 'via-blue-500/10',
  } : {
    gradientStart: 'rgba(59, 130, 246, 0.15)',
    gradientMid: 'rgba(14, 165, 233, 0.12)',
    gradientEnd: 'rgba(6, 182, 212, 0.1)',
    spotlightColor: 'rgba(59, 130, 246, 0.06)',
    particleColor: 'bg-blue-500',
    gridOpacity: '0.04',
    rayColor: 'via-blue-500/10',
  }

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-950 pt-24">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950" />
        
        {/* Animated mesh gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at ${30 + mousePosition.x * 10}% ${20 + mousePosition.y * 10}%, ${colors.gradientStart} 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at ${70 - mousePosition.x * 10}% ${60 - mousePosition.y * 10}%, ${colors.gradientMid} 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at ${50 + mousePosition.x * 5}% ${80 - mousePosition.y * 5}%, ${colors.gradientEnd} 0%, transparent 50%)
            `,
            transition: 'all 0.3s ease-out'
          }}
        />

        {/* Floating orbs with parallax - solo azules y cyan */}
        <div
          className="absolute rounded-full bg-gradient-to-br from-blue-500/25 to-cyan-500/15 dark:from-blue-500/30 dark:to-cyan-500/20 blur-3xl animate-float-orb"
          style={{
            width: 300,
            height: 300,
            left: `${15 + (mousePosition.x - 0.5) * 5}%`,
            top: `${20 + (mousePosition.y - 0.5) * 5}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.5s ease-out, top 0.5s ease-out'
          }}
        />
        <div
          className="absolute rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/10 dark:from-sky-500/25 dark:to-blue-500/15 blur-3xl animate-float-orb"
          style={{
            width: 350,
            height: 350,
            left: `${75 + (mousePosition.x - 0.5) * 5}%`,
            top: `${15 + (mousePosition.y - 0.5) * 5}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: '2s',
            transition: 'left 0.5s ease-out, top 0.5s ease-out'
          }}
        />
        <div
          className="absolute rounded-full bg-gradient-to-br from-blue-400/15 to-sky-400/10 dark:from-blue-400/20 dark:to-sky-400/10 blur-3xl animate-float-orb"
          style={{
            width: 400,
            height: 400,
            left: `${50 + (mousePosition.x - 0.5) * 5}%`,
            top: `${60 + (mousePosition.y - 0.5) * 5}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: '4s',
            transition: 'left 0.5s ease-out, top 0.5s ease-out'
          }}
        />
        <div
          className="absolute rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/10 dark:from-cyan-400/25 dark:to-blue-400/15 blur-2xl animate-float-orb"
          style={{
            width: 250,
            height: 250,
            left: `${85 + (mousePosition.x - 0.5) * 5}%`,
            top: `${70 + (mousePosition.y - 0.5) * 5}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: '1s',
            transition: 'left 0.5s ease-out, top 0.5s ease-out'
          }}
        />

        {/* Particle field - only render on client to avoid hydration mismatch */}
        {mounted && particles.length > 0 && (
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className={`absolute rounded-full ${colors.particleColor} animate-float-particle`}
                style={{
                  width: particle.size,
                  height: particle.size,
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  opacity: isDark ? particle.opacity : particle.opacity * 0.6,
                  animationDuration: `${particle.duration}s`,
                  animationDelay: `${particle.delay}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Spotlight effect following cursor */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.spotlightColor} 0%, transparent 70%)`,
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s ease-out'
          }}
        />

        {/* Grid pattern - only render after mount to avoid hydration mismatch */}
        {mounted && (
          <div 
            className="absolute inset-0"
            style={{
              opacity: colors.gridOpacity,
              backgroundImage: isDark 
                ? `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
                : `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">
            Simple, intuitivo y poderoso
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-gray-900 dark:text-white">Tus finanzas personales,</span>
          <br />
          <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {displayText}
            <span className="text-blue-500 animate-pulse">|</span>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200">
          Registra tus gastos, establece presupuestos y visualiza tu progreso financiero. 
          <span className="text-gray-700 dark:text-gray-300"> Todo en un solo lugar.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-300">
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Comenzar gratis
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </Link>
          <Link href="#features">
            <Button 
              variant="outline" 
              size="lg" 
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/30 text-lg px-8 py-6 rounded-xl backdrop-blur-sm"
            >
              Conocer más
            </Button>
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in animation-delay-500">
          <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Seguimiento en tiempo real</span>
          </div>
          <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">100% Gratis</span>
          </div>
          <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-500/20">
              <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Datos 100% seguros</span>
          </div>
        </div>

        {/* Stats or social proof */}
        <div className="mt-12 flex items-center justify-center gap-12 animate-fade-in animation-delay-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">∞</div>
            <div className="text-sm text-gray-500">Gastos ilimitados</div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">24/7</div>
            <div className="text-sm text-gray-500">Acceso total</div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-white/10" />
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">0%</div>
            <div className="text-sm text-gray-500">Comisiones</div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-neutral-950 via-white/80 dark:via-neutral-950/80 to-transparent" />
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-gray-300 dark:border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-gray-400 dark:bg-white/40 rounded-full animate-scroll-indicator" />
        </div>
      </div>
    </section>
  )
}
