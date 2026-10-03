# Gastos recurrentes: un único cron

## Modelo

- `gasto_recurrente`: regla y estado interno (`proxima_fecha`, `ultima_fecha_generada`).
- `gasto`: gasto real, con enlace opcional `gasto_recurrente_id`.
- `gasto_recurrente_instancia`: **historial heredado**, no se elimina ni se utiliza para generar nuevas ocurrencias.
- Un único Schedule en Dokploy: `/api/cron/process-recurring-expenses`, `5 5 * * *` (UTC = 00:05 en Ecuador). Desde `20261005_recurring_calendar_tz.sql` el día de referencia es el local (`app_today()`, `America/Guayaquil`); antes era UTC y los gastos aparecían la noche anterior.

Guardar una recurrente ya no genera inmediatamente un gasto. El trigger calcula la primera fecha válida a partir de `fecha_inicio`, y el cron genera las fechas vencidas. Una regla nueva con inicio pasado recuperará esas ocurrencias: usar inicio de hoy/futuro si no se desea recuperación histórica.

La RPC bloquea reglas (`FOR UPDATE SKIP LOCKED`), inserta y avanza sus fechas en una transacción. El índice único impide repetir una regla/fecha. Un fallo revierte el lote completo; no se avanza una fecha sin generar su gasto. Se procesan hasta 200 ocurrencias por llamada; `pending: true` indica trabajo restante para otra llamada o el siguiente cron.

## Comportamiento y compatibilidad

- Semanal: lunes=1, domingo=7. Mensual: días 1–31; si el mes es más corto se cobra su último día (31 = último día del mes). Anual: `mes_anual` 1–12 + `dia_mes` 1–31, con la misma regla (29 de febrero cae el 28 en años no bisiestos). Inicio y fin son inclusivos. Requiere `20261005_recurring_calendar_tz.sql`; sin ella, semanal/mensual 1–28 siguen funcionando los días 29–31 responden 400 y anual 503 (falta la migración).
- Borrar una regla conserva sus gastos generados (siguen contando como recurrentes en estadísticas) y deja de bloquearlos en el MCP.
- **Saltar el próximo cobro** (`20261006_recurring_skip_prices.sql`): `skip_recurring_occurrence(id, user_id)` marca la próxima fecha como consumida y avanza a la siguiente, sin pausar la regla; una edición posterior del calendario no la recupera. Solo `service_role` puede ejecutarla: la app la llama desde `POST /api/gastos-recurrentes/[id]/saltar` tras autenticar al usuario, y ChatGPT con `saltar_recurrente`.
- **Historial de precios**: cada cambio de `monto` se guarda en `gasto_recurrente_precio` mediante un trigger `SECURITY DEFINER` (la app escribe con el rol anon, que no puede leer ni escribir esa tabla). Se consulta solo desde el servidor: `GET /api/gastos-recurrentes/precios` (web) y `listar_recurrentes` (MCP). Sin la migración, saltar responde 503 y el historial aparece vacío; el resto funciona.
- **Detector de suscripciones** (solo web, sin SQL): sugiere convertir en recurrente un gasto manual con la misma descripción en 3+ meses seguidos y monto estable (±15%). La regla creada empieza mañana para no duplicar los cobros ya registrados a mano. Descartar una sugerencia se recuerda en ese navegador.
- Una regla inactiva no genera gastos. Reactivarla recalcula desde hoy, sin cobrar el período pausado.
- Editar calendario recalcula desde hoy y después de la última fecha consumida. Editar monto/categoría/descripción no reinicia el calendario y afecta ocurrencias aún no generadas.
- Borrar un gasto individual no borra la marca de su fecha consumida, incluso si después se edita la regla.
- Los endpoints y campos públicos de web/mobile se conservan; el estado interno nuevo no se expone en las respuestas.
- `recurring-info` usa el enlace directo nuevo y conserva la búsqueda heredada para gastos antiguos.
- La migración **no elimina gastos duplicados históricos**: vincula uno por regla/fecha y mantiene los demás y sus instancias. Los enlaces históricos ambiguos o entre usuarios distintos abortan la migración.
- El punto de partida migrado respeta la última instancia `generado`/`omitido` y la primera pendiente. Sin pendientes, arranca en la próxima fecha futura; no inventa meses anteriores. No se rellenan huecos anteriores a la última fecha ya consumida.

## Activación en producción

El código en GitHub no aplica automáticamente SQL a Supabase.

1. Respaldar la BD y revisar el esquema existente: las tres tablas anteriores, IDs numéricos, fechas compatibles con `date`, monto numérico y calendario semanal/mensual válido.
2. Configurar en Vercel **Production**:
   - `CRON_SECRET`: secreto aleatorio privado de al menos 16 caracteres.
   - `SUPABASE_SERVICE_ROLE_KEY`: clave privada `service_role`, del mismo proyecto que `NEXT_PUBLIC_SUPABASE_URL`. Nunca usar prefijo `NEXT_PUBLIC_` para esta clave ni el secreto.
3. Desplegar este código para retirar el cron mensual y las escrituras antiguas. **Antes de la migración, el cron y guardar/editar recurrentes responderán 503; el resto de la aplicación sigue disponible.**
4. Ejecutar `supabase/migrations/20261003_recurring_single_cron.sql` en el proyecto correcto. No hace falta reaplicar las migraciones MCP. El archivo es transaccional y solicita recargar el esquema PostgREST. Reaplicarlo no reinicia cursores que ya estén inicializados.
5. Revisar las fechas migradas y los permisos (consulta de solo lectura):

```sql
SELECT id, descripcion, activo, proxima_fecha, ultima_fecha_generada
FROM public.gasto_recurrente ORDER BY id;
SELECT role_name, has_function_privilege(role_name,
  'public.process_recurring_expenses(date,integer)', 'EXECUTE') AS puede_generar
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) roles(role_name);
```

Resultado esperado de permisos: `anon=false`, `authenticated=false`, `service_role=true`.

6. Verificar un acceso sin credenciales: debe responder 401. Para ejecutar el cron manualmente, usar **Run** en el Schedule de Dokploy o `Authorization: Bearer <CRON_SECRET>`: **esa llamada sí crea los gastos vencidos**. Revisar HTTP 200, `created`/`processed`/`pending` y logs del Schedule. No exponer el secreto en capturas o chats.

El Schedule envía el secreto en la cabecera Authorization usando `$CRON_SECRET` del entorno del contenedor (ver README).

Si una regla inválida o una restricción de la BD hace fallar la RPC, devuelve 500 y revierte todo el lote. Corregir la causa y reintentar; no marcar manualmente fechas como consumidas. Si una invocación se interrumpe tras confirmar SQL, repetirla es seguro por cursor/índice único.

No volver a desplegar el generador antiguo después de esta migración: no mantiene el enlace directo ni el nuevo calendario.

## Verificación local y límites

`node --test --test-concurrency=1 tests/*.test.cjs` incluye calendario, recuperación acotada, historial duplicado, rollback del lote, permisos SQL, borrado sin regeneración, reejecución de migración, validación/propietario de API y autenticación del cron.

Las pruebas SQL ejecutan PostgreSQL real vía PGlite con un esquema de prueba compatible (incluye columnas de días `bigint`). PGlite serializa las llamadas a una conexión: las invocaciones paralelas comprueban reintentos, no simulan una contención entre conexiones reales. No equivalen a aplicar/verificar la migración en el esquema de producción ni a observar una ejecución programada de Vercel.
