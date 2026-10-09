# Compra en el exterior (ISD / IVA digital)

Gastos, gastos recurrentes y movimientos del correo pueden marcar **Compra en el exterior**:
ISD 5%, IVA servicios digitales 15% u otro porcentaje. `monto` siempre es el total con
impuestos (reportes y presupuestos no cambian) y `impuesto_exterior` guarda el detalle:

```json
{ "base": 15.99, "selected": ["isd", "iva_digital"], "customRate": "" }
```

Con ese detalle, al editar el gasto o la regla la opción aparece marcada y el campo muestra el
precio original. El servidor recalcula el total desde `base`; no confía en el monto del cliente.

## Despliegue

Aplicar `supabase/migrations/20261015_foreign_tax.sql` en el SQL Editor de Supabase. Es
idempotente y transaccional: agrega la columna `impuesto_exterior` (jsonb) a `gasto` y
`gasto_recurrente`, y un trigger para que los gastos generados por el cron hereden el detalle y
la etiqueta `exterior` de su regla.

El código funciona **antes y después** de aplicarla: sin la columna, lecturas y escrituras se
reintentan sin ella y se guarda solo el total (como antes de esta función).

Los gastos marcados `#exterior` antes de la migración no tienen detalle: al editarlos se muestra
un aviso de que el monto ya incluye impuestos, para no cobrarlos dos veces.
