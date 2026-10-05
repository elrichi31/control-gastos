# Activación de las correcciones de seguridad

Las correcciones web requieren desplegar la aplicación. La revocación MCP requiere además aplicar la migración SQL; un push o despliegue no ejecuta las migraciones de Supabase automáticamente.

## Supabase

Aplicar `supabase/migrations/20261013_mcp_account_security.sql` en el SQL Editor de la instancia correcta, después de `20261001_mcp_oauth.sql`. El identificador sigue la secuencia existente de migraciones, no indica la fecha de ejecución. Es idempotente y transaccional. No borra gastos ni cambia scopes, rotación o duración de tokens. Invalida los grants de cuentas ya bloqueadas; futuros cambios de contraseña o bloqueo/desbloqueo revocan todos sus grants MCP, incluidos los códigos pendientes. Desbloquear una cuenta no resucita tokens: debe volver a autorizar la conexión.

Comprueba con dos cuentas de prueba y datos ficticios que el bloqueo/cambio de contraseña de una cuenta invalida sus tokens de acceso, refresh y consentimiento pendiente sin afectar a la otra. Verifica las definiciones de las funciones/trigger y sus permisos en la instancia desplegada. El test PostgreSQL local no sustituye esa verificación de producción.

## Aplicación / proxy

Mantener `NEXTAUTH_URL` con el origen HTTPS público efectivo, por ejemplo `https://spend.zenlorlabs.com`. No se deriva la autorización de `Host`, `X-Forwarded-Host` ni la URL interna del proxy. Las escrituras con sesión web requieren un `Origin` que coincida exactamente; cuerpos de mutación requieren `Content-Type: application/json`. Los clientes con Bearer verificado conservan acceso sin Origin, pero también deben usar JSON si envían cuerpo. Los DELETE/POST sin cuerpo siguen permitidos con el origen/autenticación apropiados.

Los gastos POST/PUT validan monto positivo, finito y máximo de 999999999 con dos decimales; descripción no vacía hasta 500 caracteres; fecha real YYYY-MM-DD; IDs positivos seguros y booleanos. PATCH parcial vía PUT y etiquetas conservan su contrato. No se aceptan cambios de propietario ni IDs inconsistentes entre URL y cuerpo.

El CSV neutraliza fórmulas y escapa comillas, separadores y saltos de línea; los campos peligrosos llevan un apóstrofo inicial. El JSON no cambia.

El registro público y la opción de confirmación por correo no cambian. Estas correcciones tampoco activan por sí solas `AUTH_SESSION_REGISTRY_ENABLED`: la revocación web/móvil sigue necesitando su configuración/migración existente.

## Verificación local

`node --test --test-concurrency=4 tests/*.test.cjs`

`npm run typecheck`

`git diff --check`

Las pruebas nuevas incluyen reproducciones del componente CSV real, rutas de gasto reales, frontera de autenticación y PostgreSQL aislado con la migración aplicada dos veces. Los flujos OAuth legacy y CIMD existentes cargan también la nueva migración para comprobar compatibilidad.
