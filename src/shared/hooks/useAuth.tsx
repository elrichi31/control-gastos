"use client"

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  isLoading: boolean
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario logueado al cargar la aplicación
    const checkAuth = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // Simular autenticación
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // En una aplicación real, aquí harías la llamada a tu API
    const mockUser: User = {
      id: '1',
      firstName: 'Usuario',
      lastName: 'Demo',
      email: email
    }

    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))
  }

  const register = async (userData: RegisterData) => {
    // Simular registro
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // En una aplicación real, aquí harías la llamada a tu API
    const newUser: User = {
      id: Date.now().toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email
    }

    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
