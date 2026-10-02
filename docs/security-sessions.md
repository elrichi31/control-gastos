# Acceso privado y revocación de sesiones

## Cambios del código
- `/api/auth/register` responde 403 sin crear clientes ni llamar a Supabase. `/auth/register` informa que el acceso es privado. El acceso por contraseña sigue usando las cuentas existentes.
- Google se publica como proveedor únicamente con credenciales OAuth y un mapeo explícito `AUTH_GOOGLE_ACCOUNTS`. Se exige `email_verified === true`, se comprueba la cuenta real y su bloqueo con la API administrativa de Supabase y se usa su UUID, nunca el `sub` de Google. Google requiere la clave privada de servicio; si no se puede verificar la cuenta, se deniega el login.
- Web/móvil tienen una duración máxima absoluta de 30 días desde el login. El refresh móvil mantiene el identificador y la fecha original, no prolonga indefinidamente el acceso. Su ventana ordinaria sigue siendo 72 horas.
- `AUTH_SESSION_NOT_BEFORE` permite revocar globalmente las sesiones de la app anteriores a una fecha ISO UTC. Valores inválidos fallan cerrados. No es una fecha deslizante ni debe colocarse en el futuro salvo que se desee bloquear todos los logins hasta entonces.

## Activación en producción (no ejecutada por estos cambios)
1. **Supabase → Authentication → configuración de usuarios:** desactivar las altas de usuarios nuevos. El bloqueo de nuestra ruta no impide llamar directamente al endpoint público de Supabase. Verificar la opción en el proyecto real, conservar usuarios actuales y probar login existente. Provisionar nuevas cuentas administrativamente cuando corresponda.
2. Si Google no se usa, dejar `AUTH_GOOGLE_ACCOUNTS` sin configurar y desactivar el proveedor Google también en Supabase si allí estaba habilitado. Si se usa, configurar un objeto JSON que mapee cada email verificado a **su UUID real de una cuenta existente** de Supabase, junto con `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Ejemplo exclusivamente ficticio:
   ```json
   { "existing@example.invalid": "11111111-1111-4111-8111-111111111111" }
   ```
   Usar emails en minúsculas. Comprobar la correspondencia con la cuenta real; no inventar IDs, enlazar por coincidencia de nombre ni crear usuarios automáticamente. Esta variable es privada del servidor.
3. Aplicar `supabase/migrations/20261004_app_auth_sessions.sql` con la consola SQL autorizada del proyecto. La migración crea una tabla privada con RLS, permisos solo de `service_role`, FK con borrado en cascada y triggers que impiden emitir sesiones para cuentas bloqueadas y revocan sesiones tras cambios de contraseña o de bloqueo. No borra usuarios ni datos financieros. La migración se probó en PostgreSQL aislado y es repetible.
4. Configurar `AUTH_SESSION_REGISTRY_ENABLED` con el texto `true`, `SUPABASE_SERVICE_ROLE_KEY` **solo en servidor** y `NEXTAUTH_URL` con la URL canónica HTTPS de la app. Desplegar solo después de aplicar la migración. No habilitar el registro antes: al activarlo sin tabla/clave, el acceso falla cerrado.
5. Volver a iniciar sesión. Las cookies/tokens antiguos sin fecha original se rechazan; al activar el registro también se rechazan sesiones emitidas sin fila persistida y Bearer nativos antiguos de Supabase. Los clientes móviles deben obtener el token de `/api/mobile/login`, manteniendo el contrato de respuesta actual.
6. **Conexiones → Seguridad de tu cuenta:** confirmar que la activación ya no aparece pendiente y probar «Cerrar todas mis sesiones» con dos dispositivos de la misma cuenta y otra cuenta de control. Debe negar APIs/refresh de las primeras, permitir la cuenta de control y permitir un login nuevo válido. El cierre requiere sesión válida, Origin canónico y JSON; nunca acepta un usuario objetivo desde el cliente.

## Alcance y operación
- `POST /api/auth/sessions` revoca todas las sesiones emitidas por BethaSpend para la cuenta autenticada, incluida la actual. `GET` informa si la función está habilitada. Desactivada, no simula éxito ni ejecuta revocaciones.
- Las comprobaciones en las APIs y el callback de NextAuth consultan el registro cuando está activo. Una caída/denegación de la base bloquea el acceso, no lo concede. Middleware valida el límite firmado/global; la revocación persistida se verifica del lado servidor antes de dar acceso a datos.
- El botón no revoca concesiones OAuth MCP/ChatGPT ni administra sesiones directas de servicios externos. Gestionar estas autorizaciones por separado. Las políticas RLS de los datos financieros requieren su propia revisión.
- Esta activación no añade rate limiting de login, CSP ni una nueva revisión de RLS de negocio. Siguen siendo mejoras posteriores, no resueltas aquí.
- Nunca desactivar el registro como rollback después de haber revocado sesiones: eso podría volver a admitir tokens firmados todavía no expirados. Para una incidencia, mantenerlo activo, reparar disponibilidad/configuración o fijar un corte global `AUTH_SESSION_NOT_BEFORE` posterior a los tokens afectados antes de cualquier cambio de enforcement.
- Programar mantenimiento autorizado para eliminar filas antiguas expiradas/revocadas según la retención elegida. No hay tarea automática instalada por esta migración.

## Comprobaciones locales
`npm run typecheck` y `node --test tests/*.test.cjs`. Las nuevas pruebas cubren registro cerrado, login existente, Google verificado y explícito, renovación acotada, corte global, revocación por propietario, CSRF, caída de DB, ausencia de bypass con tokens antiguos, aislamiento SQL y cambios de contraseña/bloqueo. No se usan cuentas ni secretos reales en ellas.
