# Documentación de endpoints backend

Este documento resume los endpoints que existen hoy en el backend de este proyecto (`Next.js App Router`), para que puedas integrarlos desde la app mobile.

## Convenciones generales

- Base URL: la URL donde esté desplegada la app, por ejemplo `https://tu-dominio.com`.
- Todos los endpoints devuelven JSON.
- Los endpoints protegidos ahora aceptan dos formas de autenticación:
  - sesión web de `NextAuth` (cookies)
  - header `Authorization: Bearer <access_token>` con token válido de Supabase
- La mayoría de errores siguen este formato:

```json
{ "error": "Mensaje de error" }
```

- Los endpoints protegidos usan sesión de `NextAuth`. Si no hay sesión válida, responden:

```json
{ "error": "No autorizado" }
```

con status `401`.

## Resumen rápido

### Públicos o sin sesión

- `POST /api/auth/register`
- `POST /api/mobile/login`
- `GET /api/categorias`
- `GET /api/metodos_pago`
- `GET /api/transactions`
- `GET /api/cron/process-recurring-expenses` (interno / cron)
- `GET /api/cron/generate-monthly-instances` (interno / cron)
- `GET|POST /api/auth/[...nextauth]` (manejado por NextAuth)

### Protegidos con sesión o bearer token

- `GET|POST|PUT|DELETE /api/gastos`
- `GET /api/gastos/stats`
- `GET /api/gastos/[id]/recurring-info`
- `GET|POST /api/gastos-recurrentes`
- `PUT|DELETE /api/gastos-recurrentes/[id]`
- `GET|POST|PUT|DELETE /api/presupuestos`
- `GET /api/presupuestos/[id]`
- `POST /api/presupuestos/copy-previous`
- `GET|POST|DELETE /api/presupuesto-categoria`
- `GET /api/presupuesto-mensual-detalle`
- `GET|POST|PUT|DELETE /api/movimientos-categoria`

---

## 1) Autenticación

### `POST /api/mobile/login`

**Qué hace**

- Inicia sesión para la app mobile usando email/password contra `Supabase Auth`.
- Devuelve tokens para usar luego en `Authorization: Bearer <access_token>`.

**Auth requerida**

- No.

**Body JSON**

```json
{
  "email": "nico@mail.com",
  "password": "123456"
}
```

**Respuesta exitosa (`200`)**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "expires_at": 1770000000,
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "nico@mail.com",
    "name": "Nicolas Moina"
  }
}
```

**Errores comunes**

- `400` si faltan `email` o `password`.
- `401` si las credenciales son inválidas.
- `500` si ocurre un error interno.

**Uso en requests protegidos**

```http
Authorization: Bearer <access_token>
```

---

### `POST /api/auth/register`

**Qué hace**

- Registra un nuevo usuario usando `Supabase Auth`.

**Auth requerida**

- No.

**Body JSON**

```json
{
  "firstName": "Nicolas",
  "lastName": "Moina",
  "email": "nico@mail.com",
  "password": "123456"
}
```

**Validaciones**

- `firstName`, `lastName`, `email` y `password` son obligatorios.
- `password` debe tener al menos 6 caracteres.

**Respuesta exitosa (`200`)**

```json
{
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "uuid",
    "email": "nico@mail.com",
    "name": "Nicolas Moina"
  }
}
```

**Errores comunes**

- `400` si faltan campos o Supabase devuelve error de alta.
- `500` si ocurre un error interno.

---

### `GET|POST /api/auth/[...nextauth]`

**Qué hace**

- Es la ruta catch-all de `NextAuth`.
- Maneja login, logout, sesión, callback de credenciales y callback de Google.

**Auth requerida**

- Depende de la subruta interna de NextAuth.

**Observación importante para mobile**

- No es un endpoint REST custom con contrato simple y fijo.
- La web usa `NextAuth` con provider de credenciales (`email` + `password`) y Google.
- Los endpoints protegidos del proyecto esperan la sesión/cookie generada por `NextAuth`.
- Si tu app mobile no va a compartir cookies web, probablemente te convenga autenticar directo con Supabase o crear un login REST específico para mobile.

---

## 2) Catálogos

### `GET /api/categorias`

**Qué hace**

- Devuelve el catálogo de categorías.

**Auth requerida**

- No.

**Query params**

- Ninguno.

**Respuesta exitosa (`200`)**

```json
[
  { "id": 1, "nombre": "Alimentación" },
  { "id": 2, "nombre": "Transporte" }
]
```

**Errores comunes**

- `500` si falla la consulta a base de datos.

---

### `GET /api/metodos_pago`

**Qué hace**

- Devuelve el catálogo de métodos de pago.

**Auth requerida**

- No.

**Query params**

- Ninguno.

**Respuesta exitosa (`200`)**

```json
[
  { "id": 1, "nombre": "Efectivo" },
  { "id": 2, "nombre": "Tarjeta" }
]
```

**Errores comunes**

- `500` si falla la consulta a base de datos.

---

## 3) Gastos

### `GET /api/gastos`

**Qué hace**

- Devuelve todos los gastos del usuario autenticado.
- Ordena por `fecha` descendente.
- Incluye categoría y método de pago embebidos.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Query params**

- Ninguno.

**Respuesta exitosa (`200`)**

```json
[
  {
    "id": 10,
    "descripcion": "Supermercado",
    "monto": 25000,
    "fecha": "2026-04-10",
    "categoria_id": 1,
    "metodo_pago_id": 2,
    "user_id": "uuid",
    "is_recurrent": false,
    "categoria": { "id": 1, "nombre": "Alimentación" },
    "metodo_pago": { "id": 2, "nombre": "Tarjeta" }
  }
]
```

---

### `POST /api/gastos`

**Qué hace**

- Crea un gasto para el usuario autenticado.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Body JSON**

```json
{
  "descripcion": "Supermercado",
  "monto": 25000,
  "fecha": "2026-04-10",
  "categoria_id": 1,
  "metodo_pago_id": 2,
  "is_recurrent": false
}
```

**Campos requeridos**

- `descripcion`
- `monto`
- `fecha`
- `categoria_id`
- `metodo_pago_id`

**Respuesta exitosa (`200`)**

```json
{
  "mensaje": "Gasto creado correctamente",
  "data": {
    "id": 10,
    "descripcion": "Supermercado",
    "monto": 25000,
    "fecha": "2026-04-10",
    "categoria_id": 1,
    "metodo_pago_id": 2,
    "user_id": "uuid",
    "is_recurrent": false
  }
}
```

**Errores comunes**

- `400` si faltan datos obligatorios.
- `500` si falla la inserción.

---

### `PUT /api/gastos`

**Qué hace**

- Actualiza un gasto existente del usuario autenticado.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Body JSON**

```json
{
  "id": 10,
  "descripcion": "Supermercado Coto",
  "monto": 28000,
  "fecha": "2026-04-10",
  "categoria_id": 1,
  "metodo_pago_id": 2
}
```

**Campos requeridos**

- `id`
- `descripcion`
- `monto`
- `fecha`
- `categoria_id`
- `metodo_pago_id`

**Respuesta exitosa (`200`)**

```json
{
  "mensaje": "Gasto actualizado correctamente",
  "data": null
}
```

**Observación importante**

- En la implementación actual el `id` se lee del body, no del query param.
- Además, el backend no hace `.select()` luego del `update`, así que `data` normalmente vuelve `null`.

**Errores comunes**

- `400` si faltan datos obligatorios.
- `500` si falla la actualización.

---

### `DELETE /api/gastos?id={id}`

**Qué hace**

- Elimina un gasto del usuario autenticado.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Query params**

- `id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{ "mensaje": "Gasto eliminado correctamente" }
```

**Errores comunes**

- `400` si no se envía `id`.
- `500` si falla el borrado.

---

### `GET /api/gastos/stats?anio={anio}&mes={mes}`

**Qué hace**

- Devuelve estadísticas del mes para el usuario autenticado.
- Cuenta cuántos gastos hay y suma el monto total.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Query params**

- `anio` (obligatorio)
- `mes` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{
  "anio": 2026,
  "mes": 4,
  "cantidad_gastos": 12,
  "monto_total": 145000
}
```

**Errores comunes**

- `400` si falta `anio` o `mes`.
- `500` si falla el cálculo.

---

### `GET /api/gastos/{id}/recurring-info`

**Qué hace**

- Indica si un gasto está vinculado a un gasto recurrente.
- Si existe relación, devuelve el `gasto_recurrente_id`.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Path params**

- `id` = id del gasto.

**Respuesta exitosa (`200`)**

```json
{ "gasto_recurrente_id": 5 }
```

o, si no está asociado:

```json
{ "gasto_recurrente_id": null }
```

**Errores comunes**

- `400` si el `id` no es numérico.
- `500` si falla la consulta.

---

## 4) Gastos recurrentes

### `GET /api/gastos-recurrentes`

**Qué hace**

- Devuelve todos los gastos recurrentes del usuario.
- Ordena por `created_at` descendente.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Respuesta exitosa (`200`)**

```json
[
  {
    "id": 5,
    "user_id": "uuid",
    "descripcion": "Netflix",
    "monto": 12000,
    "categoria_id": 4,
    "metodo_pago_id": 2,
    "frecuencia": "mensual",
    "dia_mes": 10,
    "dia_semana": null,
    "fecha_inicio": "2026-04-01",
    "fecha_fin": null,
    "activo": true,
    "created_at": "2026-04-01T12:00:00.000Z"
  }
]
```

---

### `POST /api/gastos-recurrentes`

**Qué hace**

- Crea un gasto recurrente.
- Además genera una primera instancia automática en `gasto_recurrente_instancia`.
- En algunos casos también crea inmediatamente un gasto real en `gasto`.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Body JSON**

#### Frecuencia mensual

```json
{
  "descripcion": "Netflix",
  "monto": 12000,
  "categoria_id": 4,
  "metodo_pago_id": 2,
  "frecuencia": "mensual",
  "dia_mes": 10,
  "fecha_inicio": "2026-04-01",
  "fecha_fin": null,
  "activo": true
}
```

#### Frecuencia semanal

```json
{
  "descripcion": "Club",
  "monto": 8000,
  "categoria_id": 7,
  "metodo_pago_id": 1,
  "frecuencia": "semanal",
  "dia_semana": 3,
  "fecha_inicio": "2026-04-01",
  "fecha_fin": null,
  "activo": true
}
```

**Campos requeridos**

- `descripcion`
- `monto`
- `categoria_id`
- `metodo_pago_id`
- `frecuencia` (`semanal` o `mensual`)
- `fecha_inicio`

**Validaciones específicas**

- Si `frecuencia = semanal`, `dia_semana` es obligatorio.
- Si `frecuencia = mensual`, `dia_mes` es obligatorio.
- Si `frecuencia = mensual`, `dia_mes` debe estar entre `1` y `28`.

**Respuesta exitosa (`201`)**

- Devuelve el registro creado en `gasto_recurrente`.

```json
{
  "id": 5,
  "user_id": "uuid",
  "descripcion": "Netflix",
  "monto": 12000,
  "categoria_id": 4,
  "metodo_pago_id": 2,
  "frecuencia": "mensual",
  "dia_mes": 10,
  "dia_semana": null,
  "fecha_inicio": "2026-04-01",
  "fecha_fin": null,
  "activo": true
}
```

**Errores comunes**

- `400` por validaciones o body inválido.
- `500` si falla la inserción.

---

### `PUT /api/gastos-recurrentes/{id}`

**Qué hace**

- Actualiza un gasto recurrente existente.
- Permite actualización parcial.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Path params**

- `id` (obligatorio)

**Body JSON**

Se puede enviar cualquier subconjunto de estos campos:

```json
{
  "descripcion": "Netflix Premium",
  "monto": 15000,
  "categoria_id": 4,
  "metodo_pago_id": 2,
  "frecuencia": "mensual",
  "dia_mes": 15,
  "dia_semana": null,
  "fecha_inicio": "2026-04-01",
  "fecha_fin": null,
  "activo": true
}
```

**Respuesta exitosa (`200`)**

- Devuelve el objeto actualizado.

```json
{
  "id": 5,
  "descripcion": "Netflix Premium",
  "monto": 15000,
  "categoria_id": 4,
  "metodo_pago_id": 2,
  "frecuencia": "mensual",
  "dia_mes": 15,
  "fecha_inicio": "2026-04-01",
  "fecha_fin": null,
  "activo": true
}
```

**Errores comunes**

- `400` si el `id` no es válido.
- `404` si el gasto recurrente no existe o no pertenece al usuario.
- `500` si falla la actualización.

---

### `DELETE /api/gastos-recurrentes/{id}`

**Qué hace**

- Elimina un gasto recurrente.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Path params**

- `id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{ "success": true }
```

**Errores comunes**

- `400` si el `id` no es válido.
- `404` si no existe o no pertenece al usuario.
- `500` si falla el borrado.

---

## 5) Presupuestos mensuales

### `GET /api/presupuestos`

**Qué hace**

- Devuelve los presupuestos mensuales del usuario.
- Se puede filtrar por año.
- Opcionalmente recalcula `gastos_registrados` contando gastos reales del mes.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Query params**

- `anio` (opcional)
- `include_expense_count=true` (opcional)

**Respuesta exitosa (`200`)**

- Devuelve un array de registros de `presupuesto_mensual`.
- Como la consulta usa `select('*')`, puede incluir más columnas además de las listadas abajo.

```json
[
  {
    "id": 3,
    "anio": 2026,
    "mes": 4,
    "total": 500000,
    "gastos_registrados": 12,
    "tendencia": "stable",
    "estado": "En progreso",
    "user_id": "uuid"
  }
]
```

---

### `POST /api/presupuestos`

**Qué hace**

- Crea un nuevo presupuesto mensual.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Body JSON**

```json
{
  "anio": 2026,
  "mes": 5,
  "total": 600000,
  "gastos_registrados": 0,
  "tendencia": "stable",
  "estado": "En progreso"
}
```

**Reglas**

- Sólo permite meses actuales o futuros.
- No permite duplicar presupuesto para el mismo `anio + mes` del mismo usuario.
- Si el valor de `estado` rompe una constraint de base de datos, hace un retry usando `"En progreso"`.

**Respuesta exitosa (`200`)**

- Devuelve un array con el/los registros insertados.

```json
[
  {
    "id": 4,
    "anio": 2026,
    "mes": 5,
    "total": 600000,
    "gastos_registrados": 0,
    "tendencia": "stable",
    "estado": "En progreso",
    "user_id": "uuid"
  }
]
```

**Errores comunes**

- `400` si el mes es pasado o ya existe ese presupuesto.
- `500` si falla la inserción.

---

### `PUT /api/presupuestos`

**Qué hace**

- Actualiza el total y la cantidad de gastos registrados de un presupuesto mensual.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Body JSON**

```json
{
  "presupuesto_mensual_id": 4,
  "total": 650000,
  "gastos_registrados": 15
}
```

**Respuesta exitosa (`200`)**

```json
{
  "success": true,
  "data": {
    "id": 4,
    "anio": 2026,
    "mes": 5,
    "total": 650000,
    "gastos_registrados": 15,
    "tendencia": "stable",
    "estado": "En progreso"
  }
}
```

**Errores comunes**

- `400` si faltan parámetros.
- `404` si no existe el presupuesto.
- `500` si falla la actualización.

---

### `DELETE /api/presupuestos?anio={anio}&mes={mes}`

**Qué hace**

- Elimina un presupuesto mensual del usuario por año y mes.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Query params**

- `anio` (obligatorio)
- `mes` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{ "success": true }
```

**Errores comunes**

- `400` si faltan parámetros o son inválidos.
- `500` si falla el borrado.

---

### `GET /api/presupuestos/{id}`

**Qué hace**

- Devuelve un presupuesto mensual puntual por `id`.

**Auth requerida**

- Sí, por sesión web o bearer token.

**Path params**

- `id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{
  "id": 4,
  "anio": 2026,
  "mes": 5,
  "total": 650000,
  "gastos_registrados": 15,
  "tendencia": "stable",
  "estado": "En progreso"
}
```

**Errores comunes**

- `400` si falta `id`.
- `404` si no existe.
- `500` si falla la consulta.

---

### `POST /api/presupuestos/copy-previous`

**Qué hace**

- Copia al presupuesto actual las categorías del mes anterior que sí tienen movimientos.
- También copia los movimientos de presupuesto y ajusta la fecha al nuevo mes.

**Auth requerida**

- Sí.

**Body JSON**

```json
{
  "presupuesto_mensual_id": 4
}
```

**Respuesta exitosa (`200`)**

```json
{
  "message": "Se copiaron 3 categorías con sus presupuestos del mes anterior",
  "categorias": 3,
  "movimientos": 9
}
```

**Errores comunes**

- `400` si falta `presupuesto_mensual_id`.
- `404` si no existe presupuesto actual o anterior.
- `400` si el presupuesto actual ya tiene categorías.
- `400` si el mes anterior no tiene categorías/movimientos para copiar.
- `500` si falla el proceso.

---

## 6) Categorías dentro de un presupuesto

### `GET /api/presupuesto-categoria?presupuesto_mensual_id={id}`

**Qué hace**

- Devuelve las categorías asociadas a un presupuesto mensual.

**Auth requerida**

- Sí.

**Query params**

- `presupuesto_mensual_id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
[
  {
    "id": 11,
    "categoria_id": 1,
    "total_categoria": 50000,
    "cantidad_gastos": 3,
    "categoria": { "nombre": "Alimentación" }
  }
]
```

**Observación**

- El campo relacional `categoria` viene directo de Supabase; según cómo resuelva la relación puede llegar como objeto o estructura anidada.

---

### `POST /api/presupuesto-categoria`

**Qué hace**

- Agrega una categoría a un presupuesto mensual.

**Auth requerida**

- Sí.

**Body JSON**

```json
{
  "presupuesto_mensual_id": 4,
  "categoria_id": 1
}
```

**Respuesta exitosa (`200`)**

```json
{
  "id": 11,
  "categoria_id": 1,
  "total_categoria": 0,
  "cantidad_gastos": 0,
  "categoria": { "nombre": "Alimentación" }
}
```

**Errores comunes**

- `400` si faltan parámetros.
- `500` si falla la inserción.

---

### `DELETE /api/presupuesto-categoria?id={id}`

**Qué hace**

- Elimina una categoría del presupuesto.
- Sólo la elimina si no tiene movimientos asociados.

**Auth requerida**

- Sí.

**Query params**

- `id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
{ "success": true }
```

**Errores comunes**

- `400` si falta `id`.
- `400` si la categoría tiene movimientos asociados.
- `500` si falla el borrado.

---

## 7) Detalle completo de presupuesto

### `GET /api/presupuesto-mensual-detalle?presupuesto_mensual_id={id}`

**Qué hace**

- Devuelve el detalle completo de un presupuesto mensual.
- Por cada categoría trae también sus movimientos.

**Auth requerida**

- Sí.

**Query params**

- `presupuesto_mensual_id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
[
  {
    "id": 11,
    "categoria_id": 1,
    "total_categoria": 50000,
    "cantidad_gastos": 3,
    "categoria": { "nombre": "Alimentación" },
    "movimientos": [
      {
        "id": 90,
        "descripcion": "Supermercado",
        "monto": 25000,
        "fecha": "2026-04-10",
        "metodo_pago_id": 2
      }
    ]
  }
]
```

**Errores comunes**

- `400` si falta `presupuesto_mensual_id`.
- `500` si falla alguna consulta.

---

## 8) Movimientos de categoría / presupuesto

### `GET /api/movimientos-categoria?presupuesto_mensual_id={id}`

**Qué hace**

- Devuelve los movimientos agrupados por categoría para un presupuesto mensual.

**Auth requerida**

- Sí.

**Query params**

- `presupuesto_mensual_id` (obligatorio)

**Respuesta exitosa (`200`)**

```json
[
  {
    "categoria_id": 1,
    "categoria_nombre": "Alimentación",
    "movimientos": [
      {
        "id": 90,
        "descripcion": "Supermercado",
        "monto": 25000,
        "fecha": "2026-04-10",
        "metodo_pago_id": 2
      }
    ]
  }
]
```

---

### `POST /api/movimientos-categoria`

**Qué hace**

- Crea un movimiento dentro de una categoría de presupuesto.

**Auth requerida**

- Sí.

**Body JSON**

```json
{
  "presupuesto_categoria_id": 11,
  "descripcion": "Supermercado",
  "monto": 25000,
  "fecha": "2026-04-10",
  "metodo_pago_id": 2
}
```

**Campos requeridos**

- `presupuesto_categoria_id`
- `descripcion`
- `monto`
- `fecha`

**Respuesta exitosa (`200`)**

```json
{
  "id": 90,
  "presupuesto_categoria_id": 11,
  "descripcion": "Supermercado",
  "monto": 25000,
  "fecha": "2026-04-10",
  "metodo_pago_id": 2,
  "user_id": "uuid"
}
```

**Errores comunes**

- `400` si faltan parámetros.
- `500` si falla la inserción.

---

### `PUT /api/movimientos-categoria`

**Qué hace**

- Actualiza un movimiento de presupuesto.

**Auth requerida**

- Sí.

**Body JSON**

```json
{
  "id": 90,
  "descripcion": "Supermercado mayorista",
  "monto": 28000,
  "fecha": "2026-04-10",
  "metodo_pago_id": 2
}
```

**Respuesta exitosa (`200`)**

```json
{
  "id": 90,
  "descripcion": "Supermercado mayorista",
  "monto": 28000,
  "fecha": "2026-04-10",
  "metodo_pago_id": 2
}
```

**Errores comunes**

- `400` si faltan parámetros.
- `500` si falla la actualización.

---

### `DELETE /api/movimientos-categoria`

**Qué hace**

- Elimina un movimiento de presupuesto.

**Auth requerida**

- Sí.

**Body JSON**

```json
{ "id": 90 }
```

**Respuesta exitosa (`200`)**

```json
{ "success": true }
```

**Errores comunes**

- `400` si falta `id`.
- `500` si falla el borrado.

---

## 9) Endpoints internos / cron

### `GET /api/cron/process-recurring-expenses`

**Qué hace**

- Procesa las instancias pendientes de gastos recurrentes cuya `fecha_programada` es hoy o anterior.
- Crea el gasto real en tabla `gasto`.
- Marca la instancia como `generado` o `omitido`.

**Uso esperado**

- Interno.
- En `vercel.json` está programado para correr todos los días a la `1:00 AM`.

**Respuesta exitosa (`200`)**

```json
{
  "message": "Procesamiento completado",
  "procesados": 4,
  "errores": 0,
  "omitidos": 1,
  "total": 5
}
```

---

### `GET /api/cron/generate-monthly-instances`

**Qué hace**

- Genera instancias futuras para gastos recurrentes activos del mes siguiente.
- Para gastos mensuales crea una instancia.
- Para gastos semanales crea todas las instancias semanales del mes siguiente.

**Uso esperado**

- Interno.
- En `vercel.json` está programado para correr el día `1` de cada mes a la `1:00 AM`.

**Respuesta exitosa (`200`)**

```json
{
  "message": "Generación de instancias completada",
  "creadas": 8,
  "errores": 0,
  "omitidas": 2,
  "mes": "2026-05"
}
```

---

## 10) Endpoint auxiliar de transacciones

### `GET /api/transactions`

**Qué hace**

- Intenta leer un archivo JSON local y devolver su contenido.

**Auth requerida**

- No.

**Respuesta exitosa (`200`)**

- Devuelve el contenido parseado del archivo `data/transactions.json`.

**Errores comunes**

- `404` si el archivo no existe.
- `500` si falla la lectura.

**Observación importante**

- En el estado actual del repo, el endpoint busca `data/transactions.json`.
- Ese archivo no existe hoy en la raíz del proyecto, por lo que actualmente este endpoint respondería `404`.

---

## Recomendaciones para la app mobile

- Ya no hace falta reutilizar la sesión web de `NextAuth` desde mobile.
- La opción más simple ahora es hacer `POST /api/mobile/login`, guardar `access_token` y mandar `Authorization: Bearer <token>` en cada request.
- Como alternativa, podés iniciar sesión directo con el SDK nativo de Supabase en iOS y usar ese mismo `access_token` contra este backend.
- Prestá atención a que algunos endpoints usan `query params` para borrar (`/api/gastos`, `/api/presupuestos`, `/api/presupuesto-categoria`) y otros usan `body` (`/api/movimientos-categoria`).
- `PUT /api/gastos` espera `id` dentro del body.
- `POST /api/presupuestos` devuelve un array, no un objeto simple.
