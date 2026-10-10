'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageTitle } from '@/components/layout/PageTitle'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { Eye, EyeOff, Wallet } from 'lucide-react'
import { registerUser } from '@/services/auth'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || success) return
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const data = await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      })

      if (typeof data.needsEmailConfirmation !== 'boolean') throw new Error('Respuesta de registro inválida')
      setSuccess(data.message || (data.needsEmailConfirmation
        ? 'Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.'
        : 'Cuenta creada. Ya puedes iniciar sesión.'))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <PageTitle customTitle="Crear Cuenta - BethaSpend" />

      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(141_45%_26%)]">
        {/* Subtle Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-xs rounded-lg mb-8 border border-white/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl font-semibold text-white mb-4">
              Empieza a organizar tus finanzas
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-10">
              Un espacio simple para entender tus gastos y tomar mejores decisiones financieras.
            </p>

            {/* Tips */}
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-6 border border-white/20 text-left">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-4">💡 Tip para empezar</p>
              <p className="text-white text-sm leading-relaxed">
                Comienza registrando tus gastos del día a día. No necesitas ser perfecto, solo constante. Con el tiempo verás patrones que te ayudarán a ahorrar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-card relative">
        {/* Logo and Theme Toggle */}
        <div className="absolute top-6 left-6 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">
              BethaSpend
            </span>
          </Link>
        </div>

        <div className="absolute top-6 right-6 sm:right-8">
          <ModeToggle />
        </div>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-6">
            <h1 className="text-4xl font-light text-foreground mb-3">
              Crear cuenta
            </h1>
            <p className="text-muted-foreground">
              Ingresa tus datos para comenzar a gestionar tus finanzas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-muted border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-muted border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                autoComplete="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="h-12 px-4 bg-muted border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 px-4 pr-12 bg-muted border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-12 px-4 pr-12 bg-muted border-border rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div role="status" className="text-sm text-center bg-primary/10 border border-primary/20 p-3 rounded-lg">
                {success}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
              disabled={isLoading || Boolean(success)}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}