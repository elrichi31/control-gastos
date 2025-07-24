# 🔐 Configuración del Sistema de Autenticación

¡Se ha implementado exitosamente un sistema de autenticación completo usando **NextAuth.js** con **Supabase Auth**!

## ⚙️ Configuración Requerida

### 1. Variables de Entorno

El archivo `.env.local` ya tiene las variables necesarias:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-nextauth-secret
```

**No necesitas el Service Role Key** porque usamos Supabase Auth directamente.

### 2. Configuración de Supabase

**Habilitar autenticación por email:**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** → **Settings**
3. Asegúrate de que **Enable email confirmations** esté habilitado
4. Configura la **Site URL** como `http://localhost:3000` (y tu dominio de producción)

### 3. Configuración de Google OAuth (Opcional)

Si quieres usar Google Sign-In:
1. Ve a **Authentication** → **Providers** en Supabase
2. Habilita **Google**
3. Agrega tus credenciales de Google OAuth
4. Configura las URLs de redirección

## 🚀 Características Implementadas

### ✅ Lo que ya funciona:
- **Registro de usuarios** con Supabase Auth
- **Inicio de sesión** con email y contraseña
- **Autenticación con Google** (cuando se configure)
- **Protección de rutas** automática
- **Sesiones persistentes**
- **Redirección automática** después del login
- **Validación de formularios**
- **Confirmación por email** (opcional en Supabase)
- **Interfaz moderna** con Tailwind CSS

### 📁 Páginas de Autenticación:
- `/auth/login` - Iniciar sesión
- `/auth/register` - Crear cuenta

### 🔒 Seguridad:
- Autenticación manejada por Supabase
- Tokens JWT seguros
- Middleware de protección de rutas
- Hasheo automático de contraseñas por Supabase

## 🛠️ Uso en el Código

### Obtener la sesión del usuario:
```tsx
import { useSession } from 'next-auth/react'

function MiComponente() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <p>Cargando...</p>
  if (status === 'unauthenticated') return <p>No autenticado</p>
  
  return <p>Hola {session?.user.name}!</p>
}
```

### Cerrar sesión:
```tsx
import { signOut } from 'next-auth/react'

<button onClick={() => signOut()}>
  Cerrar Sesión
</button>
```

### Proteger páginas:
```tsx
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function PaginaProtegida() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])
  
  if (status === 'loading') return <div>Cargando...</div>
  if (!session) return null
  
  return <div>Contenido protegido</div>
}
```

## 📝 Próximos Pasos

1. **Prueba el registro** de un nuevo usuario
2. **Verifica el email** (si tienes confirmación habilitada)
3. **Prueba el login** con las credenciales
4. **Integra la autenticación** en tu aplicación existente
5. **Opcional**: Configura Google OAuth en Supabase

## 🚨 Problemas Comunes

### Error de configuración de Supabase
- Verifica que las URLs en `.env.local` sean correctas
- Asegúrate de que Supabase Auth esté habilitado

### No recibe emails de confirmación
- Verifica la configuración de SMTP en Supabase
- Revisa la carpeta de spam

### No redirige después del login
- Verifica que `NEXTAUTH_URL` esté configurado correctamente

## 💡 Integración con tu App Existente

Para integrar con tus gastos existentes, puedes:
1. Asociar gastos a usuarios por `user_id` (ID de Supabase Auth)
2. Filtrar gastos por usuario autenticado
3. Usar Row Level Security (RLS) en Supabase para seguridad automática

## 🎯 Ventajas de Supabase Auth

- ✅ **Sin tablas personalizadas** - Supabase maneja todo
- ✅ **Confirmación por email** integrada
- ✅ **OAuth providers** fáciles de configurar
- ✅ **Seguridad robusta** out-of-the-box
- ✅ **Escalabilidad** automática

¡El sistema está listo para usar! 🎉
