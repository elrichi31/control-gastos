# Etiquetas de gastos

Las etiquetas son opcionales y no reemplazan la categoría. Se escriben separadas por comas, por ejemplo `viaje, familia`. Se muestran como chips en los listados; el buscador de Detalle de gastos también encuentra etiquetas (con o sin `#`).

## Alcance

- Captura general de gastos: campo opcional, vista previa y eliminación de chips.
- Presupuesto: creación y edición de etiquetas en el modal existente; visibles en los movimientos.
- APIs `/api/gastos` y `/api/movimientos-categoria`: campo `tags: string[]` opcional.
- Omitir `tags` al actualizar conserva las etiquetas existentes; enviar `[]` las elimina.
- Los clientes antiguos pueden seguir creando gastos sin enviar etiquetas.
- Se normalizan espacios y mayúsculas y se eliminan duplicados. Máximo 10 etiquetas únicas, de 30 caracteres cada una.
- No se agregan etiquetas a las reglas recurrentes, al MCP ni a los archivos de exportación en este cambio. Los gastos recurrentes generados siguen sin etiquetas por defecto.

## Activación

**Aplicar primero** `supabase/migrations/20261009_expense_tags.sql` en la base de datos de Supabase y **después** desplegar el código. La API lee la nueva columna: desplegar antes de aplicar SQL hará fallar esas lecturas.

La migración añade `tags text[] NOT NULL DEFAULT '{}'` a `gasto` y `movimiento_presupuesto`, mantiene los gastos históricos sin etiquetas y es reaplicable sin borrar etiquetas. No cambia permisos ni políticas de acceso. No se ha aplicado automáticamente a producción.

## Verificación local

```sh
node --test tests/expense-tags*.test.cjs
npm run typecheck
```

Las pruebas cubren los handlers reales con la frontera de Supabase simulada, interacciones de formularios mediante un harness de hooks y persistencia SQL real en PostgreSQL aislado (PGlite). No representan una prueba contra la base de datos de producción.
