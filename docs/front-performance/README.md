# Optimizaciones de front — cierre de las dos fases

Rama `perf/front-optimizations`, desde `d5e9fc4`. Trabajo local del 24 de octubre de 2026. Sin push, PR, cambios en main, migraciones ni datos reales de Supabase.

## Implementación

1. **Estado remoto.** TanStack Query sustituye las lecturas con estado local del detalle de presupuesto, lista y agenda de recurrentes, precios y confirmaciones por correo, proyecciones, estado MCP, permisos, seguridad de sesiones, catálogos de formularios, años de presupuesto, banner de correo y cron. Se conserva el estado local de los borradores y modales. `src/hooks/useRemoteData.ts` concentra consultas habilitadas solo con sesión autenticada y mutaciones sin reintentos automáticos. Los catálogos se comparten con el detalle de gastos durante cinco minutos. Los avisos de umbral presupuestario usan lecturas de la caché.

   Crear, editar, eliminar, omitir y convertir recurrentes invalida sus vistas relacionadas. Las operaciones de presupuesto invalidan detalle, años y plan mensual; borrar un presupuesto invalida también detalles que quedaron inactivos. Las mutaciones de gastos invalidan historial, plan, presupuestos y proyección. Los errores de carga de presupuesto se distinguen de un presupuesto vacío. Un fallo al verificar MCP no mantiene una tarjeta de estado anterior como si estuviera recién verificada.

2. **Correo.** La clave de consulta contiene pestaña, página, búsqueda y los IDs marcados como gastos distintos. La petición recibe AbortSignal para descartar páginas superadas. Alias y sincronización son mutations; las aceptaciones, vinculaciones y descartes usan mutations dentro de la cola serial existente. La conciliación ocurre una vez por lote y pertenece a la sesión, por lo que sigue funcionando al salir de la página.

   La cola se identifica por QueryClient, no por un singleton común del navegador. Al cerrar/cambiar sesión se aborta la petición activa, se impide enviar lo pendiente y se retiran sus avisos. Una petición ya procesada por el servidor no se puede deshacer abortando; no se reintenta automáticamente una escritura de resultado incierto.

3. **API de gastos.** `GET /api/gastos` acepta `from` y `to` como fechas reales `YYYY-MM-DD`, inclusivas; rechaza rangos invertidos. `page`/`limit` activan una respuesta `{items,total,page,limit}` con conteo del rango, orden estable por fecha e ID y máximo de 500 filas por petición. El propietario autenticado se aplica a cada consulta, incluida la alternativa compatible sin la columna de impuestos. Sin paginación se conserva la respuesta array para clientes existentes. No se requieren cambios de esquema.

   `src/services/expenses.ts` distingue `fetchExpensesPage` de `fetchExpenses`: esta última recorre páginas de 500 filas y devuelve el historial completo que consumen filtros, agregados de la UI y exportación. No se sustituye silenciosamente ese historial por una sola página ni por el límite de 1.000 filas de PostgREST. Si cambia el conteo, aparecen IDs duplicados o se interrumpe el recorrido, se devuelve error en lugar de publicar un total parcial.

   Esto pagina las peticiones; los consumidores que necesitan todo el historial siguen descargándolo completo. No se introduce un snapshot transaccional entre páginas: cambios simultáneos que no alteren el conteo pueden representar instantes distintos. Un endpoint de agregados/snapshot para historiales muy grandes queda propuesto para coordinar con BD, sin migraciones en esta entrega.

4. **Entrada móvil/PWA en servidor.** El proxy decide `/form` o `/auth/login` usando la misma política de sesión existente. Detecta UA móvil y la entrada explícita `/?pwa=1`; el manifiesto nuevo usa esta última. La landing de escritorio normal conserva su comportamiento. Las PWA ya instaladas con el manifiesto anterior conservan un adaptador mínimo: detecta standalone (incluido iOS) y navega a `/?pwa=1`; la decisión de autenticación se toma después en el servidor. No se deja una cookie persistente que redirija también el navegador de escritorio normal. El servidor no puede leer directamente la media query `display-mode`.

5. **Chunks.** Se separan el drawer Radix móvil (solo al abrir), los diálogos de borrado (solo al abrir), el formulario recurrente de la pestaña normal, exportación y el estado de cron. El contenedor de notificaciones se descarga en un chunk cliente separado. Se conservan las optimizaciones de la primera fase: layout raíz servidor, AppShell, fallbacks de ruta, gráficos/editores/PWA diferidos, claves estables, formato monetario compartido, corrección de rollover y de doble DELETE.

## Validación

- Baseline `d5e9fc4`: 325 tests, 321 correctos y cuatro fallos; lint sin errores y 64 avisos.
- Primera fase: 327 tests, 323 correctos y los mismos cuatro fallos; lint sin errores y 57 avisos.
- Segunda fase: **334 tests, 330 correctos y los mismos cuatro fallos**. Las comprobaciones dirigidas finales de API, PWA, cola, MCP y handlers de presupuesto pasan: **23/23**. Lint final: **0 errores y 53 avisos**, frente a 57 de la fase anterior.
- Typecheck independiente pasa. El build emite webpack y pasa TypeScript, pero no puede completar la recopilación de rutas de autenticación sin las variables reales de Supabase. Se mantiene el error `supabaseUrl is required`; no se añadieron valores ficticios.
- Los cuatro fallos previos son dos escenarios de alias en `email-review-ui.test.cjs`, transparencia de favicon en `favicon-transparency.test.cjs` y paleta de landing en `navigation-ux.test.cjs`. Se adaptaron los harnesses al nuevo origen del estado remoto; las aserciones funcionales se mantienen.
- Las nuevas pruebas comprueban rangos/límites, propietario y orden en cada consulta, compatibilidad de impuestos, clientes legacy, recorrido de 1.201 gastos, detección de lecturas incompletas, entrada móvil/PWA y cierre de una cola con escrituras pendientes. Las pruebas de la fase anterior siguen cubriendo invalidación, deduplicación, aislamiento de sesión y borrado único.
- No se ejecutó navegador autenticado, conforme al alcance. Los tests de BD usan fixtures locales/PGlite; no se conectaron a Supabase real.

Se usó Node 22.21.1 instalado en `/data/.local/node-runtime`; las dependencias permanecen fijadas por el lockfile. Se consultaron las guías incluidas de Next 16.3.8 antes de editar, incluida la convención proxy.

## Medición de JavaScript

`before.json` corresponde al baseline; `phase1.json` conserva la primera entrega; `after.json` recoge la segunda fase.

Se estima la suma de chunks de entrada emitidos: runtime común más página, layout, providers y shell, sin duplicar archivos compartidos. Se comprime cada archivo con gzip. **No es First Load JS oficial, una medida de red, FCP o LCP.** Se excluyen los chunks asíncronos; algunos, como cron y notificaciones, se descargan al montar el cliente. Su separación reduce la entrada crítica, pero no equivale a eliminar su descarga total. Los gráficos, formularios alternativos y modales se descargan al necesitarlos.

| Ruta | Baseline KiB gzip | Fase 1 | Fase 2 | Fase 2 vs. fase 1 | Fase 2 vs. baseline |
| --- | ---: | ---: | ---: | ---: | ---: |
| /dashboard | 207.2 | 219.9 | 199.1 | -9.5% | -3.9% |
| /detalle-gastos | 225.2 | 237.7 | 230.5 | -3.0% | 2.4% |
| /estadisticas | 343.3 | 239.2 | 226.3 | -5.4% | -34.1% |
| /form | 243.9 | 256.4 | 247.4 | -3.5% | 1.4% |
| /presupuesto | 319.4 | 231.4 | 218.5 | -5.6% | -31.6% |
| /presupuesto/[id] | 222.9 | 217.9 | 215.6 | -1.0% | -3.2% |

Reproducción desde la raíz, con Node/npm en PATH:

```sh
npm ci
npm run build
node scripts/measure-front-bundles.mjs > docs/front-performance/after.json
npm run typecheck
npm run lint
npm test
```

El script puede leer los chunks de un build que haya compilado y falle más tarde recopilando datos de página. Los tiempos de build no se comparan como métrica de rendimiento porque la caché y la carga concurrente de tests difieren.

## Pendiente

- Variables reales mediante el mecanismo seguro del entorno, para completar build y prueba integrada. No se solicita ni se inventa ningún secreto en esta entrega.
- Prueba autenticada en navegador, excluida por el usuario por ahora: móvil, instalación/actualización PWA, cambio de cuenta, permisos, cola al navegar y edición/borrado.
- Resolver por separado los cuatro fallos previos de tests.
- Para volúmenes muy grandes, proponer agregados o snapshots desde servidor y paginación visual del detalle, conservando estadísticas y exportación completas; no se añadieron migraciones.
