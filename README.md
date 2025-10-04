# 💰 Control de Gastos

Sistema de gestión de gastos personales con presupuestos mensuales, gastos recurrentes automatizados y análisis estadístico.

## 🚀 Características

- **Registro de Gastos**: Interfaz intuitiva para registrar gastos diarios con categorías y métodos de pago
- **Gastos Recurrentes**: Sistema automatizado que genera gastos periódicos (mensuales/semanales) mediante cron jobs
- **Presupuestos Mensuales**: Control detallado de presupuestos por categoría con seguimiento en tiempo real
- **Estadísticas Detalladas**: Análisis visual de gastos por categoría, período y tendencias
- **Multi-Usuario**: Autenticación segura con NextAuth.js y Supabase
- **Filtros Avanzados**: Búsqueda y agrupación por día, semana o mes

## 🛠️ Tecnologías

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: NextAuth.js + Supabase Auth
- **Automatización**: Vercel Cron Jobs
- **Utilidades**: date-fns, react-hot-toast

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/elrichi31/control-gastos.git
cd control-gastos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Configuración de Base de Datos

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta los scripts SQL en orden:
   - `db/setup-recurring-expenses.sql` - Tablas de gastos recurrentes
   - `db/add-is-recurrent-field.sql` - Campo de identificación de gastos recurrentes

## ⚙️ Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secret_generado
CRON_SECRET=tu_cron_secret
```

## 🤖 Cron Jobs (Vercel)

El sistema incluye dos cron jobs automatizados:

- **Diario (1:00 AM)**: Procesa instancias pendientes y genera gastos recurrentes
- **Mensual (Día 1, 1:00 AM)**: Genera instancias del próximo mes

Configurados en `vercel.json`.

## 📱 Estructura del Proyecto

```
src/
├── app/                      # App Router de Next.js
│   ├── api/                  # API Routes
│   ├── auth/                 # Páginas de autenticación
│   ├── detalle-gastos/       # Vista detallada de gastos
│   ├── estadisticas/         # Análisis y gráficos
│   ├── form/                 # Formulario de gastos
│   ├── gastos-recurrentes/   # Gestión de gastos recurrentes
│   └── presupuesto/          # Gestión de presupuestos
├── components/               # Componentes React
│   ├── ui/                   # shadcn/ui components
│   ├── detalle-gastos/       # Componentes de vista detallada
│   ├── presupuesto/          # Componentes de presupuestos
│   └── stats/                # Componentes de estadísticas
├── hooks/                    # Custom React hooks
├── lib/                      # Utilidades y configuración
│   ├── auth/                 # Configuración de autenticación
│   ├── database/             # Clientes de Supabase
│   └── constants/            # Constantes globales
├── services/                 # Capa de servicios/API
└── types/                    # Definiciones de TypeScript
```

## 🎯 Flujo de Gastos Recurrentes

1. Usuario crea gasto recurrente con frecuencia (mensual/semanal)
2. Sistema genera instancia pendiente automáticamente
3. Cron diario procesa instancias cuya fecha programada llegó
4. Gasto real se crea en la tabla `gasto` con flag `is_recurrent: true`
5. Instancia se marca como `generado`
6. Usuario puede eliminar gasto individual o desactivar serie completa

## 🎨 Características de UI

- Diseño responsive (móvil y desktop)
- Tema claro con Tailwind CSS
- Componentes accesibles de Radix UI
- Notificaciones toast elegantes
- Modales de confirmación intuitivos
- Badges visuales para gastos recurrentes

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.

## 👨‍💻 Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar linter
npm run lint
```

## 🚢 Despliegue en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/elrichi31/control-gastos)

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno
3. Despliega automáticamente

---

Desarrollado con ❤️ usando Next.js y Supabase

