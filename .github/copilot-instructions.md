# Instrucciones COPILOT - Arquitectura de Proyecto

Estas reglas aplican para todas las sugerencias de Copilot en este repositorio.  
Las sugerencias nuevas deben alinearse con ellas.

---

## Contexto del proyecto

- Proyecto construido con **Next.js** usando App Router.  
- TipoScript para seguridad de tipos.  
- Tailwind CSS para los estilos.  
- Components server/client según convenga (usar `use client` solo cuando se necesite).  
- Seguir convenciones de rutas/layouts propias de Next.js. :contentReference[oaicite:0]{index=0}

---

## Estructura de carpetas

- Usa estas carpetas principales:

```

src/
app/                      # Rutas/layouts de Next.js, composición de features
features/                 # Casos de uso completos (UI + hooks + llamadas)
entities/                 # Modelos de dominio: tipos/validaciones/helpers puros
components/               # UI reusable (design system, charts, forms), sin lógica de negocio
shared/                   # Toolbox universal: hooks genéricos, utilitarios, tipos globales, cliente HTTP genérico
services/                 # Repositorios de negocio / lógica de acceso a API o DB (usa entities, shared)
assets/                   # Imágenes/íconos
test/ / **tests**/        # Mocks, factories, tests cerca de lo que prueban
middleware.ts             # (si aplica)

```

- No se requiere carpeta `styles/` si Tailwind cubre estilos globales.  
- Carpeta `store/` solo si varios features comparten estado global complejo; si no, mantener estado local en cada feature.

---

## Dependencias permitidas

- `app` puede importar desde `features`, `components`, `shared`.  
- `features` puede importar desde `entities`, `components`, `services`, `shared`.  
- `components` solo pueden importar de `shared`.  
- `services` pueden importar de `entities` y `shared`.  
- `entities` no importar de capas superiores.

---

## Convenciones de nombres

- Componentes React: `PascalCase.tsx`  
- Hooks / funciones utilitarias: `camelCase.ts`  
- Validaciones / esquemas: `*.schema.ts`  
- Repositorios: `*.repository.ts`, con métodos como `list`, `create`, `delete`, etc.  
- Usar `index.ts` en carpetas para re-exportaciones (“barrels”)  
- TypeScript con alias de paths: `@features/*`, `@entities/*`, `@components/*`, `@shared/*`, `@services/*`

---

## Prácticas recomendadas

- Mantener las páginas / rutas en `app/` finas: solo orquestación de features, UI, import de servicios.  
- Componentes presentacionales, sin lógica de dominio.  
- Hooks compartidos genéricos en `shared/hooks`; si son específicos de un feature, en ese feature.  
- Usar la estructura de rutas/layouts de Next.js: colocar metadata, layouts, server/client components donde correspondan. :contentReference[oaicite:1]{index=1}  

---

## Objetivo general

Que todas las sugerencias de Copilot:

1. Respeten esta arquitectura adaptada con Next.js y Tailwind.  
2. Generen código consistente con reglas de dependencias, convenciones de nombres y estructura de rutas/layouts de Next.js.  
3. Faciliten mantenimiento y escalabilidad del proyecto sin confusión.