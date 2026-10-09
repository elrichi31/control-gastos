# PWA - Progressive Web App

BethaSpend ahora es una Progressive Web App (PWA) completamente funcional que se puede instalar en dispositivos móviles y de escritorio.

## Características PWA Implementadas

### ✅ Instalación
- La app se puede instalar en iOS, Android, Windows, macOS y Linux
- Prompt de instalación personalizado que aparece automáticamente
- Iconos optimizados para todas las plataformas
- Shortcuts de acceso rápido a funciones principales

### ✅ Funcionalidad Offline
- Cache inteligente de assets estáticos
- Cache de llamadas API con estrategia NetworkFirst
- Cache de imágenes y fuentes
- Funciona sin conexión después de la primera carga

### ✅ Optimizaciones
- Service Worker configurado con Workbox
- Cache selectivo por tipo de recurso:
  - **Supabase API**: NetworkFirst (24h cache)
  - **Google Fonts**: CacheFirst (1 año)
  - **Imágenes**: CacheFirst (30 días)
  - **API Routes**: NetworkFirst (24h cache)

### ✅ Experiencia Nativa
- Pantalla de inicio personalizada
- Color de tema coherente
- Se ejecuta en modo standalone (sin barra del navegador)
- Integración con el sistema operativo

## Cómo Instalar

### En Móvil (iOS/Android)

#### iOS (Safari)
1. Abre la app en Safari
2. Toca el botón de compartir (cuadrado con flecha)
3. Selecciona "Añadir a pantalla de inicio"
4. Confirma el nombre y toca "Añadir"

#### Android (Chrome)
1. Abre la app en Chrome
2. Aparecerá un banner de instalación automáticamente (o toca el menú ⋮)
3. Selecciona "Instalar app" o "Añadir a pantalla de inicio"
4. Confirma la instalación

### En Desktop (Windows/Mac/Linux)

#### Chrome/Edge
1. Abre la app en el navegador
2. Busca el ícono de instalación en la barra de direcciones (➕ o 💻)
3. Click en "Instalar BethaSpend"
4. La app se instalará como aplicación de escritorio

## Shortcuts Disponibles

Una vez instalada, la app incluye shortcuts de acceso rápido:
- **Nuevo Gasto**: Ir directo al formulario de registro
- **Ver Estadísticas**: Acceso rápido a dashboard de análisis
- **Presupuesto**: Gestión de presupuestos

Para acceder a los shortcuts:
- **Android**: Mantén presionado el ícono de la app
- **iOS**: No soporta shortcuts (limitación de iOS)
- **Desktop**: Click derecho en el ícono de la app

## Desarrollo

### Generar Iconos
Si necesitas regenerar los iconos:
```bash
node scripts/generate-icons.js
```

### Modo Desarrollo
En desarrollo, el service worker está deshabilitado para facilitar el debugging.

### Modo Producción
El service worker solo se activa en producción:
```bash
npm run build
npm start
```

## Archivos PWA

- `public/manifest.json` - Configuración de la PWA
- `public/icon-*.png` - Iconos en diferentes tamaños
- `public/sw.js` - Service Worker (generado automáticamente)
- `next.config.ts` - Configuración de next-pwa
- `src/components/PWAInstallPrompt.tsx` - Prompt personalizado de instalación

## Notas Importantes

1. **HTTPS Requerido**: Las PWAs solo funcionan en HTTPS (excepto localhost)
2. **Service Worker**: Se genera automáticamente en cada build
3. **Cache**: El cache se actualiza automáticamente en cada nueva versión
4. **Offline**: Algunas funciones requieren conexión (login, sincronización con Supabase)

## Testing

Para probar la PWA localmente:

1. Build de producción:
```bash
npm run build
npm start
```

2. Abre `http://localhost:3000` en Chrome
3. Abre DevTools > Application > Service Workers
4. Verifica que el service worker esté registrado
5. Prueba el modo offline en DevTools > Network > Offline

## Lighthouse Score

Puedes verificar la calidad PWA con Lighthouse:
1. Abre DevTools
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Progressive Web App"
4. Click en "Analyze page load"

Objetivo: Score de 100/100 en PWA
