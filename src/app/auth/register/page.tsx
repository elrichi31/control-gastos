'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageTitle } from '@/components/PageTitle'
import { ModeToggle } from '@/components/mode-toggle'
import { Eye, EyeOff, Wallet } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta')
      }

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Cuenta creada, pero error al iniciar sesión')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex">
      <PageTitle customTitle="Crear Cuenta - BethaSpend" />
      
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
        {/* Subtle Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 border border-white/20">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-semibold text-white mb-4">
              Empieza a organizar tus finanzas
            </h2>
            
            <p className="text-white/70 text-lg leading-relaxed mb-10">
              Un espacio simple para entender tus gastos y tomar mejores decisiones financieras.
            </p>

            {/* Tips */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-left">
              <p className="text-white/60 text-xs uppercase tracking-wider mb-4">💡 Tip para empezar</p>
              <p className="text-white text-sm leading-relaxed">
                Comienza registrando tus gastos del día a día. No necesitas ser perfecto, solo constante. Con el tiempo verás patrones que te ayudarán a ahorrar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-24 bg-white dark:bg-neutral-950 relative">
        {/* Logo and Theme Toggle */}
        <div className="absolute top-6 left-6 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              BethaSpend
            </span>
          </Link>
        </div>
        
        <div className="absolute top-6 right-6 sm:right-8">
          <ModeToggle />
        </div>

        <div className="max-w-md w-full mx-auto mt-16 lg:mt-0">
          <div className="mb-6">
            <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-3">
              Crear cuenta
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Ingresa tus datos para comenzar a gestionar tus finanzas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                  Nombre
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                  Apellido
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Correo electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                className="h-12 px-4 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-12 px-4 pr-12 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirma tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-12 px-4 pr-12 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-neutral-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-950 text-gray-500 dark:text-gray-400">
                O continúa con
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl font-medium transition-all"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Registrarse con Google
          </Button>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
