# MCP de BethaSpend para ChatGPT

Servidor remoto en `https://TU_DOMINIO/api/mcp`, con **Streamable HTTP**, SDK oficial MCP y OAuth (authorization code + PKCE S256). ChatGPT se identifica automáticamente mediante **CIMD + private_key_jwt (RS256)**: no hay que copiar client ID ni secreto al conector. No es una API key pública ni un endpoint anónimo con acceso a los gastos.

## Herramientas

| Herramienta | Permiso | Alcance |
|---|---|---|
| `listar_gastos` | `expenses:read` | Gastos propios, filtros por fechas/categoría/método; paginación de hasta 100 |
| `obtener_gasto` | `expenses:read` | Un gasto propio por ID |
| `listar_categorias` | `expenses:read` | Catálogo compartido, ID y nombre |
| `listar_metodos_pago` | `expenses:read` | Catálogo compartido, ID y nombre |
| `crear_gasto` | `expenses:write` | Un gasto manual propio |
| `editar_gasto` | `expenses:write` | Un gasto propio que no pertenezca a una serie recurrente existente, previa confirmación |
| `eliminar_gasto` | `expenses:write` | Un gasto propio que no pertenezca a una serie recurrente existente, previa confirmación |
| `resumen_mes` | `expenses:read` | Gastado, restante, recurrentes por venir, disponible, proyección, alertas y avance por categoría (mismo cálculo que el dashboard) |

Los gastos recurrentes se pueden consultar, pero **no editar ni borrar** desde MCP: no se gestionan las relaciones entre series, instancias y gastos. No hay herramientas de SQL libre, administración de usuarios ni cambios en presupuestos.

## 1. Preparar Supabase

Ejecutar una vez, con permisos de administrador, las migraciones en este orden:

1. `supabase/migrations/20261001_mcp_oauth.sql` (omitir si ya está aplicada).
2. `supabase/migrations/20261002_mcp_cimd_assertions.sql` (**nueva**, aplicar antes de desplegar CIMD).

La primera agrega tres tablas privadas y cinco funciones para OAuth; la segunda agrega una tabla y una función de consumo atómico de firmas para bloquear replays entre workers de Vercel. No modifica las tablas existentes de gastos ni sus políticas. Las tablas nuevas tienen RLS y no son accesibles para `anon` ni `authenticated`; las funciones solamente pueden ejecutarse por `service_role`.

Se necesita una cuenta existente cuyo ID sea el UUID de `auth.users` de Supabase. Conecta mediante el login de **correo y contraseña** de la aplicación. El login Google existente guarda un subject del proveedor sin mapearlo a `auth.users`; por seguridad, esa identidad no se autoriza para MCP. No se cambió el login normal ni se habilitó registro nuevo.

## 2. Variables privadas de Vercel

Usar el dominio HTTPS definitivo, sin barra final, sin rutas y sin parámetros:

```env
MCP_PUBLIC_ORIGIN=https://TU_DOMINIO
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_PRIVADA_SERVICE_ROLE_DE_SUPABASE
```

La app ya requiere `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXTAUTH_URL` y `NEXTAUTH_SECRET`. `NEXTAUTH_URL` debe corresponder al dominio público real y el secreto de sesión debe ser fuerte y privado.

### Compatibilidad con conexiones manuales existentes

Si ya están configuradas `MCP_CLIENT_ID`, `MCP_CLIENT_SECRET` y `MCP_REDIRECT_URIS`, **pueden mantenerse las tres sin cambios**: CIMD funciona a la vez y no requiere copiarlas a ChatGPT. Para una instalación solo CIMD, omitir las tres. No quitar solo una: una configuración manual incompleta se rechaza. Quitar las tres deshabilita las conexiones manuales anteriores; sus usuarios necesitarán reconectar mediante CIMD.

Solo si se necesita el modo manual, configurar un ID propio, un secreto aleatorio de al menos 32 caracteres y callbacks exactos. Para generar ese secreto localmente:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

**No pegar secretos ni la service-role key en chats, código, Git o variables `NEXT_PUBLIC_*`.** CIMD no usa un secreto compartido: ChatGPT firma con su clave privada y el servidor verifica con las claves públicas oficiales. La service-role key nunca se entrega a ChatGPT.

### Callback de ChatGPT

El servidor publica soporte RFC 9207 y devuelve `iss` en las respuestas de autorización, por lo que ChatGPT puede usar su callback estable documentado:

`https://chatgpt.com/connector_platform_oauth_redirect`

CIMD solo admite el documento estable `https://chatgpt.com/oauth/client.json` y el callback estable anterior, validados contra los metadatos oficiales. No se aceptan documentos arbitrarios ni callbacks con comodines. Si una conexión manual anterior usa un callback específico, mantenerlo en `MCP_REDIRECT_URIS`; eso no amplía los callbacks permitidos para CIMD.

La URL del MCP se vincula a cada grant: `https://TU_DOMINIO/api/mcp`. Los pedidos OAuth deben incluir ese valor como `resource` al autorizar y al intercambiar/renovar tokens.

## 3. Desplegar y conectar ChatGPT

1. Aplicar ambas migraciones y configurar las variables **en el entorno de producción**. Si la primera ya se aplicó, ejecutar solamente la nueva de CIMD.
2. Desplegar esta rama en el dominio configurado. No asumir que un push ya es un despliegue.
3. Si tu cuenta/workspace tiene disponibles apps personalizadas con Developer Mode, crear una app/conector MCP desde la configuración de ChatGPT.
4. URL del servidor: `https://TU_DOMINIO/api/mcp`.
5. Elegir **OAuth**, no "No Authentication" ni autenticación mixta.
6. Dejar vacíos el client ID y el secreto en la configuración avanzada. ChatGPT descubre CIMD y se identifica automáticamente; no se necesita DCR. Si un conector anterior conserva las credenciales manuales, crear uno nuevo sin esos valores.
7. Conectar: iniciar sesión en BethaSpend, revisar el permiso y pulsar **Autorizar conexión**. La app retoma el consentimiento después del login.
8. Verificar primero con una consulta, por ejemplo: "Muéstrame mis últimos cinco gastos".
9. Probar crear/editar/eliminar solamente con un gasto de prueba identificado y confirmado explícitamente.

Metadatos públicos (solo configuración OAuth; no contienen datos de gastos ni secretos):

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-authorization-server`

## Revocar acceso

Entrar, con tu sesión de BethaSpend, en:

`https://TU_DOMINIO/api/mcp/connections`

Revocar una conexión invalida todos sus access/refresh tokens inmediatamente. También existe revocación OAuth en `/api/mcp/oauth/revoke`, autenticada mediante firma de ChatGPT o las credenciales del cliente manual anterior.

## Controles implementados

- Consentimiento vinculado a una sesión real, protección CSRF, comprobación de Origin y bloqueo de iframes.
- CIMD restringido al documento HTTPS y JWKS oficiales de ChatGPT; sin seguir redirects de metadatos ni URLs proporcionadas por usuarios; timeout de 5 segundos, tamaño y caché acotados.
- Firmas **RS256** con `kid`, issuer/subject/audiencia exactos, expiración y `jti` de un solo uso en PostgreSQL. No se admite el método sin autenticación de cliente (`none`), ni mezclar firma y secreto.
- Client secret obligatorio solo para el modo manual anterior; PKCE **S256** obligatorio en ambos modos; redirects exactos y recurso/audiencia fijo.
- Identificación del issuer con `iss` para prevenir OAuth mix-up.
- Códigos aleatorios de un solo uso, vigentes durante 5 minutos; canje atómico en PostgreSQL.
- Access tokens opacos de hasta 15 minutos; grants y refresh tokens de hasta 30 días.
- Solo se guardan hashes SHA-256 de códigos y tokens.
- Refresh tokens rotativos: reutilizar uno consumido revoca la conexión completa.
- Cada operación vincula `user_id` en el servidor. Las herramientas no aceptan `user_id`, SQL, nombres de tablas ni URLs arbitrarias.
- Verificación de Host y Origin; no se construyen URLs OAuth usando cabeceras controladas por el solicitante.
- Límite distribuido de 120 peticiones MCP por minuto por conexión, persistido en PostgreSQL.
- Cuerpo MCP máximo de 64 KiB y formularios OAuth máximo de 16 KiB.
- Respuestas privadas sin caché y errores de base de datos sin detalles internos.
- Si faltan variables, permisos o migración, se **rechaza el acceso**; nunca se degrada a acceso anónimo.

### Límites importantes

- Las anotaciones MCP y `confirmado=true` ayudan a ChatGPT a pedir autorización antes de escribir. **No son una prueba criptográfica de que el humano confirmó cada llamada.** Una persona o cliente que posee un token con `expenses:write` puede ejecutar esas operaciones. El consentimiento inicial sí se valida con sesión y CSRF.
- Un bearer token robado puede usarse hasta que expire o se revoque. No compartir tokens; usar HTTPS, proteger sesiones y mantener dependencias actualizadas.
- Las creaciones no tienen clave de idempotencia. Ante un fallo de red, consultar primero si se creó el gasto; no reintentar a ciegas.
- El rate limit no reemplaza protección de la plataforma contra DDoS o tráfico anónimo masivo.
- Este módulo protege el acceso por MCP; no corrige ni certifica la seguridad de todos los endpoints preexistentes de la aplicación, incluidos los crons.

## Verificación local

```bash
npm ci
node --test tests/*.test.cjs
npx tsc --noEmit
npm run build
```

El build necesita las variables existentes de Supabase/Auth. Las pruebas MCP no necesitan una base de producción: usan un PostgreSQL real aislado mediante **PGlite** para los grants, códigos, tokens, firmas de un solo uso, permisos y transacciones; simulan las consultas de gastos y la sesión en las pruebas de integración. Las pruebas CIMD generan claves RSA propias y documentos de fixture claramente aislados; no simulan una autorización real de ChatGPT. Ejercitan el SDK MCP real con `initialize`, `tools/list` y `tools/call`.

No equivale a haber conectado una cuenta real de ChatGPT: esa validación final requiere el despliegue HTTPS y la autorización del usuario.

Diagnóstico:

- `503`: falta configuración/migración, base inaccesible o permisos privados incorrectos.
- `503` durante CIMD: comprobar la migración nueva y la disponibilidad de los documentos/JWKS oficiales de ChatGPT.
- `invalid_client`: credencial manual incorrecta, firma inválida/vencida, claims incorrectos o assertion reutilizada.
- `401` en `/api/mcp`: falta token o está vencido/revocado; incluye `WWW-Authenticate` para descubrir OAuth.
- `403`: Host/Origin no permitido, CSRF incorrecto o cuenta no compatible.
- `invalid_grant`: código/refresh vencido, usado o con bindings incorrectos.
- `429`: esperar el `Retry-After` indicado.

Mantenimiento opcional: eliminar grants vencidos desde un proceso administrativo; sus tokens/códigos se eliminan por cascada. **No borrar los hashes de refresh tokens consumidos mientras el grant siga vigente**, porque sirven para detectar replay.

Referencias oficiales consultadas:

- https://developers.openai.com/plugins/build/auth
- https://chatgpt.com/oauth/client.json
- https://developers.openai.com/api/docs/guides/developer-mode
