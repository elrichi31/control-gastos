# Revisión de código y primera limpieza

## Alcance y límites

Base: `origin/main` en `3d7dc40`, que ya contiene el MCP operativo y el fix CSP. Trabajo en `chore/review-cleanup`, separado de producción.

Se inventariaron 181 módulos de código fuente y se analizó su grafo de imports/reexports/imports dinámicos literales con TypeScript, incluyendo las entradas automáticas de Next (también `src/app/page.tsx` y `src/app/layout.tsx`). Se revisaron en profundidad MCP/OAuth, ambas migraciones, autenticación, cliente de base de datos, cron, consultas de presupuestos, caché PWA y componentes afectados por la limpieza. El inventario y el análisis estático abarcan el repo; esto no equivale a una prueba manual de todas las pantallas ni a una auditoría de las políticas RLS desplegadas.

No se ejecutaron cron, migraciones, escrituras ni pruebas destructivas en producción. Las reproducciones de fallos usan los handlers reales y una frontera de base de datos simulada: demuestran comportamiento de la aplicación, no acceso real a registros ajenos en Supabase.

## Limpieza aplicada (sin cambios de contrato)

- Eliminados seis módulos sin referencias ni uso como entradas del framework: `hooks/useAuth.tsx` (autenticación ficticia con localStorage), `hooks/useDashboardData.ts`, `hooks/useFetch.ts`, `components/ProtectedRoute.tsx`, `lib/utils/format.ts` (formateador duplicado; sigue activo el export de `lib/utils/common.ts`) y el archivo vacío `app/api/movimientos-categoria/nuevo.ts`.
- Eliminado el stub local `setExpenses` que lanzaba `Function not implemented` y nunca se llamaba.
- Eliminados imports, variables y parámetros sin uso, `handleQuickAmount`, estados que no se mostraban (`submitSuccess`, `loadingBudget`) y el temporizador de un estado invisible.
- Eliminados logs de gastos completos en render y del objeto de usuario al autenticar. Se conservaron errores operativos y el diagnóstico MCP limitado a operación/código.
- Añadidos `npm test` y `npm run typecheck` como comandos reproducibles. No se cambiaron dependencias, esquema, permisos, contratos API ni configuración de despliegue.
- No se eliminaron automáticamente componentes UI reutilizables que hoy no se importan, rutas públicas que pueden consumir clientes externos ni dependencias potencialmente utilizadas fuera del repo.

## Hallazgos pendientes, por prioridad

### P1 — Los cron no autentican la invocación

**Estado actualizado:** resuelto en el procesador único de recurrentes: valida `CRON_SECRET` antes de acceder a Supabase, utiliza service role privada y la RPC está restringida a `service_role`. El cron mensual fue eliminado. Requiere [activar la migración y configuración](RECURRING_EXPENSES.md). El hallazgo siguiente describe el estado original revisado.

Archivos: `src/app/api/cron/process-recurring-expenses/route.ts:9`, `generate-monthly-instances/route.ts:8` y `src/middleware.ts:52`.

Los handlers no reciben/verifican `Authorization` ni `CRON_SECRET`; el middleware excluye las rutas API. En un probe aislado, invocaciones sin credenciales llegaron a la escritura y respondieron 200. La escritura efectiva en producción depende además de permisos de Supabase y protecciones externas, que no se comprobaron.

Corrección propuesta: validar el secreto antes de crear el cliente/consultar datos. Configurar el secreto en Vercel antes de desplegar esa protección para no detener el scheduler. Los cron usan actualmente la clave anon; no sustituirla a ciegas por service_role antes de asegurar el endpoint.

### P1 — El procesamiento recurrente no es atómico ni idempotente

Archivo: `src/app/api/cron/process-recurring-expenses/route.ts:90-125`.

Se inserta el gasto y después se actualiza la instancia en otra operación. Si falla la segunda, el gasto queda creado y la instancia pendiente. Reproducción aislada: dos invocaciones, dos inserciones, dos fallos al marcar la instancia y ambas respuestas HTTP 200. Dos invocaciones concurrentes también pueden seleccionar la misma instancia pendiente.

Corrección propuesta: transacción/RPC con bloqueo de instancia y una garantía de unicidad por instancia; verificar rollback, repetición y concurrencia en PostgreSQL aislado. Esto requiere una migración nueva, no editar retrospectivamente las migraciones ya aplicadas. El resultado HTTP debe reflejar fallos de procesamiento, no solo incluir un contador de errores bajo 200.

### P1 — Falta ownership explícito en dos lecturas de presupuesto

Archivos: `src/app/api/movimientos-categoria/route.ts:7-32` (GET) y `src/app/api/presupuesto-mensual-detalle/route.ts:7-32`.

Ambos reciben `userId` autenticado, pero no lo usan para filtrar las categorías ni sus movimientos. Un presupuesto recibido por query string no prueba propiedad. Las consultas equivalentes en `presupuesto-categoria` sí filtran por `user_id`.

Reproducción aislada: usuario A + categorías/movimientos de B devuelve 200 con el registro de B en ambos handlers. Esto demuestra ausencia de protección en el handler; no confirma que la RLS de producción permita ese acceso. El cliente de servidor usa anon/cookies, y NextAuth/Bearer no implica por sí solo que esas consultas lleven el JWT de Supabase del usuario.

Corrección propuesta: restringir por propietario (incluyendo validación del presupuesto padre en las creaciones relacionadas) y comprobar RLS. Probar lectura propia, ID ajeno, ausencia de sesión y token mobile. Se mantuvieron los bindings `userId`: no ocultar el hallazgo borrando la variable que debería usarse.

### P1 — El callback NextAuth confunde prefijo con origen

Archivo: `src/lib/auth/auth.ts:96-106`.

`url.startsWith(baseUrl)` acepta un dominio como `https://bethaspend.bethalabs.com.attacker.example/steal`. Se reprodujo llamando al callback real; devolvió la URL externa. Esto demuestra el defecto del callback, no una explotación completa del proveedor.

Corrección propuesta: parsear URLs y comparar `URL.origin` exacto, conservar callbacks relativos válidos y fallback al dashboard; probar dominios parecidos, credenciales en URL y URLs inválidas. No se alteró el login durante esta limpieza.

### P1 — PWA puede reutilizar respuestas privadas entre sesiones

Archivo: `next.config.ts:13-59`.

`NetworkFirst` cachea URLs Supabase y `/api/*` con nombres globales y TTL de 24 horas. No hay separación por usuario ni exclusión explícita de auth/OAuth/MCP. Cache Storage no debe tratarse como si automáticamente respetara la intención `Cache-Control: no-store` de las respuestas.

Riesgo: con fallback offline/timeout, una misma URL puede devolver contenido de una sesión anterior; formularios OAuth cacheados también pueden tener confirmaciones obsoletas. Es un hallazgo de configuración; no se reprodujo un cambio de cuentas en el service worker de producción.

Corrección propuesta: `NetworkOnly` para autenticación/OAuth/MCP; decidir si se mantienen datos financieros offline con partición por usuario y limpieza de cachés al salir. Conservar caché de recursos públicos. No desactivar el modo offline financiero sin acordar su comportamiento.

### P1 — Dependencias con avisos de seguridad pendientes

`npm audit --omit=dev` devolvió 39 paquetes afectados (4 critical, 27 high, 6 moderate, 2 low), contando dependencias directas y transitivas. No significa 39 vulnerabilidades explotables en esta aplicación.

Entre las directas señaladas: Next 15.3.9, NextAuth, next-pwa y dependencias de correo/adapters. Los avisos de proveedor email no prueban afectación al login Credentials/Google. Algunos avisos de Next dependen de runtime, plataforma y features concretas.

El árbol del repo no tiene referencias de código a 14 dependencias directas (adapters Prisma/Supabase, auth-ui, bcryptjs/tipos, chart.js/react-chartjs-2, dotenv, imap-simple, imapflow, mailparser, nodemailer, uuid). Confirmar consumidores externos antes de retirarlas. No se ejecutó `audit fix --force`: su propuesta incluye cambios mayores e incluso versiones antiguas de next-pwa.

Corrección propuesta: retirar dependencias realmente huérfanas y actualizar Next/NextAuth por separado, con build y smoke de login, MCP y PWA. Referencias de ejemplo: [Next Middleware bypass](https://github.com/advisories/GHSA-26hh-7cqf-hhc6), [NextAuth getToken](https://github.com/advisories/GHSA-xmf8-cvqr-rfgj). El JSON completo del audit se obtuvo durante la revisión; no contiene una prueba de exploitabilidad.

### P2 — Fechas recurrentes y reloj del dashboard

- El generador mensual construye el día directamente; un día 31 en un mes más corto produce una fecha inválida. Solo prepara el mes siguiente y no repara huecos del actual. Su generación no comprueba `fecha_inicio`. Definir política de fin de mes y recuperación antes de modificarlo.
- `vercel.json` programa `0 1 * * *` / `0 1 1 * *`; no hay zona horaria local declarada. Los comentarios de “1am” no especifican UTC.
- `src/app/dashboard/page.tsx:21-25` captura fechas a nivel de módulo. Una pestaña que atraviesa medianoche/mes puede seguir usando límites antiguos aunque se refresquen gastos. Corregir con reloj reactivo y una zona temporal acordada, no reescribiendo cálculos financieros durante una limpieza.
- Hay servicios que hacen `res.json()` sin comprobar `res.ok` (por ejemplo `src/services/budget.ts:6-8`). Los errores pueden confundirse con datos; separar una mejora de resiliencia con pruebas de respuesta/error y cambios de entidad.

## Qué no es código muerto en MCP

- `cimd.ts`: valida metadata/RS256, claves públicas y uso único de assertions de ChatGPT. La rama legacy con client secret es compatibilidad deliberada, no un bypass sin autenticación.
- `security.ts`: configuración canónica, validación de OAuth/PKCE, límites de body y respuestas privadas.
- `oauth.ts`: consentimiento y revocación con sesión, CSRF, callbacks validados y RPC. El HTML separado de React evita cargar UI/sesión cliente y conserva headers de seguridad; todo texto interpolado externo se escapa.
- `runtime.ts`: único cliente privado para MCP; no importar en código cliente. La identidad viene de la sesión/grant, nunca de parámetros de herramienta.
- `http.ts` / `tools.ts`: bearer verificado, scopes, límites y predicates `user_id` en gastos, con protección de gastos recurrentes. Las anotaciones y `confirmado=true` orientan al cliente, pero no acreditan una aprobación humana por cada operación en el servidor.
- SQL: consumo único, rotación/replay y revocación compartidos entre workers. No modificar migraciones aplicadas para cambios futuros.
- CSP permite únicamente el origen del callback validado en consentimiento. La administración de conexiones permanece `form-action 'self'`; CSRF sigue rechazando origen ausente/null/ajeno. Conservar la excepción `Referrer-Policy: same-origin` de los formularios.

## Verificación y seguimiento

Baseline: 28 pruebas aprobadas. TypeScript con `--noUnusedLocals --noUnusedParameters` detectó 20 diagnósticos; la limpieza conserva las dos señales de `userId` asociadas al hallazgo de ownership, en vez de esconderlas.

Verificación final: 28/28 pruebas aprobadas, `npm run typecheck` aprobado y `git diff --check` limpio. El build inicialmente compiló pero falló al recoger rutas por faltar `NEXT_PUBLIC_SUPABASE_URL` en este entorno. La repetición con configuración ficticia (`https://build-only.invalid`, clave placeholder y secreto local no productivo) completó `npm run build` con exit 0. Eso comprueba el empaquetado, no la configuración de Vercel ni una integración con Supabase real.

Smoke HTTP sobre el build local: `/` y `/auth/login` 200; `/dashboard` 307 sin sesión; `/api/gastos` 401; metadata OAuth 200. `/api/mcp` respondió 503 con «Falta la configuración privada de Supabase para MCP», porque deliberadamente no se proporcionó una service_role real. No se presenta ese smoke como un handshake MCP exitoso; el protocolo/OAuth sigue cubierto por las pruebas aisladas existentes y el usuario confirmó funcionamiento antes de esta limpieza. Los servidores locales se detuvieron después de verificar.

Comandos reproducibles: `npm test`, `npm run typecheck`, `npm run build` (con variables válidas de su entorno) y `git diff --check`. El script `npm run lint` actualmente inicia el asistente de ESLint porque el repo no tiene configuración/dependencias de lint listas; no se presenta como un check aprobado.

Esta pasada no certifica todos los flujos de la aplicación, ausencia de vulnerabilidades ni comportamiento RLS de producción. Priorizar un lote pequeño de hardening (cron + ownership + redirect) con sus regresiones, y después la transacción recurrente/migración y el aislamiento de cachés. No mezclar un upgrade de dependencias, una migración y una limpieza visual en un único despliegue.
