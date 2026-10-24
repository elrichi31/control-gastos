# Optimizaciones de front

Rama: `perf/front-optimizations`, creada desde `d5e9fc4`. Revisión e implementación local del 24 de octubre de 2026. Sin push, PR, cambios en main, migraciones ni acceso a datos reales de Supabase.

## Cambios

- **#1, layout servidor:** `src/app/layout.tsx` conserva HTML, fuente y metadatos; `src/components/layout/AppShell.tsx:16` contiene navegación y comportamiento interactivo.
- **#4, estados de ruta:** `src/app/loading.tsx`, `error.tsx` y `not-found.tsx` añaden carga accesible, recuperación con `retry` de Next 16.3 y navegación de regreso. Se mantienen los estados de carga de las consultas cliente.
- **#5, carga diferida:** `next/dynamic` separa gráficos de estadísticas y presupuesto, el panel de proyección, los editores de gasto normal/presupuestado y `PWAInstallPrompt`. Los editores se montan al abrirlos; los gráficos reservan espacio durante la descarga. El aviso PWA se descarga en cliente al montar el shell.
- **#7, sidebar:** se elimina el efecto que abría el drawer durante la detección inicial del viewport; CSS controla la visibilidad de escritorio y el estado solo abre el drawer móvil.
- **#11, moneda:** se reutiliza un único `Intl.NumberFormat` en `src/lib/utils/common.ts:14`; listas, resumen, exportación y correo usan `formatMoney`. Se conserva la presentación compacta de ejes y los ejemplos ilustrativos de la landing.
- **#13, identidad de listas:** grupos, breadcrumbs, secciones y alertas usan claves de dominio. La expansión conserva la identidad del grupo al filtrar. La clave semanal usa la fecha del lunes para evitar la colisión entre la primera y última semana de ciertos años (`src/hooks/useGastosGrouping.ts:55`).
- **#8 y parte de #2, TanStack Query:** cliente por sesión, consultas con 30 segundos de frescura, catálogos con cinco minutos, deduplicación y errores con datos previos. Un cambio de identidad remonta la caché antes de que los hijos puedan leerla; al desmontar se limpian consultas en vuelo (`SessionQueryProvider.tsx:15`). No hay caché remota global a nivel de módulo ni persistencia de consultas en disco.
- **Cobertura de consultas:** gastos compartidos por dashboard, detalle, estadísticas, formulario y recurrentes; catálogos del detalle; plan del dashboard por mes; presupuestos por año. Los hooks usan la capa existente de `src/services`. Crear/editar gastos sigue usando los callbacks existentes para invalidar; borrar gastos y crear/borrar presupuestos usan mutations. Importación por correo y cambios de recurrentes invalidan también el plan y los presupuestos. Los cambios de distribución del presupuesto invalidan los totales y el plan.
- **Correcciones adicionales:** el dashboard ordena una copia de los gastos y recalcula al cambiar de día/mes; una confirmación de borrado ejecuta una única mutación y espera su resultado, evitando el doble DELETE entre fila y padre (`ExpenseItem.tsx:45`).

## Comprobaciones

Se instaló Node 22.21.1 en `/data/.local/node-runtime` porque el entorno no tenía Node/npm en PATH; se ejecutaron `npm ci` y `npm install @tanstack/react-query`. La dependencia instalada y fijada en lockfile es TanStack Query 5.104.5. Se leyeron las guías locales de Next sobre componentes servidor/cliente, lazy loading, loading, error y not-found antes de editar.

El baseline de tests tuvo **325 tests: 321 correctos y 4 fallos**. Los cuatro fallos previos son:

1. `tests/email-review-ui.test.cjs`: falta el input de alias en el harness.
2. El mismo archivo: el escenario de alias fallido no encuentra el control esperado.
3. `tests/favicon-transparency.test.cjs`: el SVG tiene fondo.
4. `tests/navigation-ux.test.cjs`: la landing contiene tratamientos de color que la aserción rechaza.

Los tests de caché cubren deduplicación, invalidación activa/inactiva, error conservando datos y cancelación/aislamiento entre sesiones. Los nuevos tests cubren una sola solicitud de borrado, espera de la mutación e identidad/expansión de semanas a ambos extremos de un año. Se adaptaron los harnesses que simulan hooks sin montar contextos y la aserción de SSR de gráficos diferidos.

No se ha realizado una prueba de navegador autenticado con datos reales. El build inicial ya compilaba y pasaba TypeScript, pero fallaba al recopilar `/api/auth/[...nextauth]` con `supabaseUrl is required`. No se añadieron variables ficticias ni se cambió la inicialización de autenticación para ocultar ese requisito.

Resultado final: **327 tests, 323 correctos y los mismos 4 fallos previos**; sin regresiones adicionales en la suite. Lint: **0 errores y 57 avisos**, frente a 64 avisos del baseline. El build final vuelve a compilar y pasar TypeScript; se detiene durante la recopilación de rutas de autenticación (en la última ejecución, `/api/auth/sessions`) por la misma ausencia de `supabaseUrl`.

## Medición

No hay un build completo para obtener una comparación de First Load JS por ruta. `before.json` y `after.json` registran una **estimación de los chunks de entrada emitidos**: runtime común más entradas de página, layout, providers y shell, sin contar dos veces chunks compartidos. También se guarda su suma comprimida con gzip por archivo.

Se excluyen chunks asíncronos. Estas cifras no son medidas de red, FCP, LCP ni del total descargado tras resolver datos o abrir editores. El nuevo cliente de caché tiene coste de JavaScript compartido; se debe valorar junto con la reducción de los gráficos y la eliminación de solicitudes repetidas. No se comparan tiempos de build porque la caché y la carga de los tests difieren.

| Ruta | Antes, KiB gzip | Después, KiB gzip | Cambio |
| --- | ---: | ---: | ---: |
| /dashboard | 207.2 | 219.9 | 6.1% |
| /detalle-gastos | 225.2 | 237.7 | 5.5% |
| /estadisticas | 343.3 | 239.2 | -30.3% |
| /form | 243.9 | 256.4 | 5.1% |
| /presupuesto | 319.4 | 231.4 | -27.6% |
| /presupuesto/[id] | 222.9 | 217.9 | -2.2% |

Reproducción, desde la raíz y con Node/npm disponibles:

```sh
npm ci
npm run build
node scripts/measure-front-bundles.mjs > docs/front-performance/after.json
npm run typecheck
npm run lint
npm test
```

El script de medición puede funcionar después de un build cuyo webpack haya emitido los chunks, aunque falle más tarde recopilando datos de página.

## Pendiente

- Configurar las variables reales mediante el mecanismo seguro del entorno, completar el build y probar navegación autenticada, cambios de usuario, móvil, edición/borrado y PWA en navegador.
- Resolver por separado los cuatro fallos previos de tests.
- Migrar el fetch local restante de detalle de presupuesto, lista de recurrentes, proyecciones, conexiones, formularios y cola paginada de correo. Esta entrega evita reescribir de golpe sus estados de formulario y mecanismos de conciliación.
- Diseñar filtro por rango/paginación en API junto con agregados de estadísticas y exportación: limitar solo la lista actual puede truncar totales del historial.
- Evaluar MobileRedirect en servidor conservando la detección de instalación PWA, que hoy depende de `display-mode` en navegador.
