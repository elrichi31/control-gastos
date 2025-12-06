"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

const typingWords = ["simplificadas", "organizadas", "bajo control", "en orden"]

// Dot configurations with their anchor points and max radius
const dots = [
  { anchorX: 0.2, anchorY: 0.25, maxRadius: 80, size: 'w-4 h-4', color: 'bg-blue-400/60', duration: 'duration-1000' },
  { anchorX: 0.75, anchorY: 0.3, maxRadius: 100, size: 'w-3 h-3', color: 'bg-blue-500/50', duration: 'duration-700' },
  { anchorX: 0.35, anchorY: 0.65, maxRadius: 70, size: 'w-2 h-2', color: 'bg-indigo-400/60', duration: 'duration-500' },
  { anchorX: 0.65, anchorY: 0.7, maxRadius: 90, size: 'w-3 h-3', color: 'bg-blue-300/60', duration: 'duration-800' },
  { anchorX: 0.15, anchorY: 0.5, maxRadius: 60, size: 'w-2 h-2', color: 'bg-indigo-300/50', duration: 'duration-900' },
  { anchorX: 0.85, anchorY: 0.55, maxRadius: 85, size: 'w-3 h-3', color: 'bg-blue-400/45', duration: 'duration-600' },
]

export function Hero() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const heroRef = useRef<HTMLElement>(null)

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

  // Get dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Mouse tracking for floating dots
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Calculate dot position with max radius constraint
  const getDotPosition = (anchorX: number, anchorY: number, maxRadius: number) => {
    const anchorPxX = anchorX * dimensions.width
    const anchorPxY = anchorY * dimensions.height
    
    const deltaX = mousePosition.x - anchorPxX
    const deltaY = mousePosition.y - anchorPxY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance <= maxRadius) {
      // Within radius - follow cursor
      return { x: mousePosition.x, y: mousePosition.y }
    } else {
      // Outside radius - stay at max radius in direction of cursor
      const angle = Math.atan2(deltaY, deltaX)
      return {
        x: anchorPxX + Math.cos(angle) * maxRadius,
        y: anchorPxY + Math.sin(angle) * maxRadius
      }
    }
  }

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pt-24">
      {/* Abstract background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large blue blob - top right */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl animate-blob"
        />
        
        {/* Medium blue blob - bottom left */}
        <div 
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-500/15 dark:bg-blue-500/10 blur-3xl animate-blob animation-delay-2000"
        />
        
        {/* Small accent blob - center */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10 dark:from-blue-500/5 dark:to-indigo-500/5 blur-3xl animate-pulse-slow"
        />
        
        {/* Interactive floating dots that follow cursor within radius */}
        {dots.map((dot, index) => {
          const pos = getDotPosition(dot.anchorX, dot.anchorY, dot.maxRadius)
          return (
            <div
              key={index}
              className={`absolute rounded-full pointer-events-none transition-all ease-out ${dot.size} ${dot.color} ${dot.duration}`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)'
              }}
            />
          )
        })}
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Simple, intuitivo y poderoso
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="text-gray-900 dark:text-white">Tus finanzas personales,</span>
          <br />
          <span className="text-gradient-blue">
            {displayText}
            <span className="animate-pulse">|</span>
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200">
          Registra tus gastos, establece presupuestos y visualiza tu progreso financiero. 
          Todo en un solo lugar.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-300">
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300 group"
            >
              Comenzar gratis
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#features">
            <Button 
              variant="outline" 
              size="lg" 
              className="text-gray-600 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-lg px-8 py-6 rounded-xl"
            >
              Conocer más
            </Button>
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-16 animate-fade-in animation-delay-500">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Diseñado para quienes quieren control total de sus finanzas
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm">100% Gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm">Fácil de usar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-sm">Datos seguros</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent" />
    </section>
  )
}
