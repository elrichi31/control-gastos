# Rediseño de Nuevo gasto

Rama `ui/nuevo-gasto-redesign` desde main `a901502`.

La entrada de gastos usa una columna centrada, con el monto como primer nivel visual. Descripción y fecha preceden a categorías y pago, con opciones táctiles de 44 px. Los extras se pliegan, pero los errores de validación abren el bloque y reciben foco. La acción principal queda diferenciada de «Guardar y agregar otro».

El resumen lateral se integra con la actividad debajo del formulario: total, período y número de gastos visibles; filtros y agrupación desplegables. El historial conserva sus controles y todas las lecturas/mutaciones de TanStack Query. Las pestañas «Una vez» y «Recurrente» mantienen sus valores internos y el acceso por `?tipo=recurrente`.

Las capturas se encuentran fuera del repositorio, en `/data/OpenBot/Shared/control-gastos-shots/`:

| Vista | Antes | Después | Tamaño |
| --- | --- | --- | --- |
| Escritorio | before-desktop.png | after-desktop.png | 1440 × 1500 |
| Móvil | before-mobile.png | after-mobile.png | 390 × 1964 |

Se usaron componentes/estilos reales en dos harnesses locales aislados, con los mismos datos ilustrativos y escrituras bloqueadas. No se modificaron variables de entorno, datos o migraciones. Los fixtures no se añadieron a `src` ni se comitearon. La carpeta de capturas incluye instrucciones para reabrirlos.

Comprobación en navegador: sin overflow horizontal a 390 px, validación y foco al importe al enviar vacío, flechas para las opciones radio, pestaña recurrente y filtros de actividad. Un test de regresión comprueba que un error de etiquetas abre los extras y recibe foco sin guardar.

Validación final:

- `npm run typecheck`: correcto.
- `npm run lint`: 0 errores, 53 avisos, igual que main.
- `npm test`: 335 tests, 331 correctos y los mismos cuatro fallos previos (dos de alias de correo, transparencia de favicon y paleta de landing).
- Pruebas dirigidas de formulario, resumen y etiquetas: 14/14 correctas.
- `git diff --check`: limpio.

Logs locales: /tmp/form-final-types.log, /tmp/form-final-lint.log, /tmp/form-final-tests.log y /tmp/form-final-target-tests.log.
