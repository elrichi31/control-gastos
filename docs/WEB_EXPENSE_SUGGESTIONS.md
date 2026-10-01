# Sugerencias de gastos en la web

El formulario de gastos normales (`/form`) sugiere categoría y método de pago mientras se escribe la descripción. Solo modifica la web; el formulario recurrente, las API y mobile no cambian.

- Reutiliza `gastos` cargado por la pantalla desde la API autenticada. No añade peticiones por pulsación, persistencia local, dependencias ni servicios de IA.
- Compara descripciones normalizando acentos, mayúsculas, puntuación y espacios. Da prioridad a coincidencias exactas, luego prefijos y palabras relevantes. Necesita al menos una palabra significativa de tres caracteres.
- Cada campo requiere una mayoría estricta entre las mejores coincidencias y un ID presente en su catálogo actual. Sin historial, coincidencias suficientes o una mayoría clara, conserva la selección manual habitual.
- Una selección manual tiene prioridad aunque cambie la descripción. Las sugerencias se identifican con un mensaje y pueden cambiarse antes de guardar.
- Validación y guardado usan los mismos IDs que muestran los selectores. Guardar reinicia tanto el formulario como las selecciones manuales. Una sugerencia válida elimina errores de selección que hayan quedado de un intento anterior.

No es una reproducción verificada del algoritmo de mobile: ese código no está en este repo. Es una heurística local basada en historial, no un modelo semántico entrenado.

Pruebas: `node --test tests/expense-suggestions.test.cjs` y `npm test`. También se ejercitó el componente real en Chromium con servicios/historial ficticios: predicción, cambios manuales, cambio de descripción, payload de guardado, reset y mensajes de validación. Esa prueba de UI no escribió en Supabase ni demuestra un despliegue de producción.
