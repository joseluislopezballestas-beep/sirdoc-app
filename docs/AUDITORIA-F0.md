# Auditoría SirDoc — Fase 0 (Prioridad 0: seguridad clínica y farmacológica)

- Repositorio auditado: `joseluislopezballestas-beep/sirdoc-app`, commit base `c3caa1a` (v1.1.1).
- Fecha: 2026-11-14. Auditoría técnica asistida por IA. **No sustituye la revisión por especialistas humanos.**
- Alcance verificado: código completo del repositorio (11 archivos, sin dependencias externas en ejecución).
- Fuente primaria contrastada en esta fase: ficha técnica de sugammadex (FDA, rev. 11/2022; EMA). El resto de reglas clínicas **no** se contrastó todavía (ver `MATRIZ-CIENTIFICA.md`).

Leyenda de estado: **Corregido** (cambio técnico aplicado y con prueba) · **Pendiente aprobación clínica** (cambio preparado en rama aparte, sin fusionar) · **Pendiente** (sin cambio aún) · Tipo: C = confirmado, R = riesgo potencial, H = hipótesis por verificar.

## Entregable 1 — Matriz de hallazgos

| ID | Prio | Tipo | Problema | Riesgo | Archivo | Corrección | Prueba necesaria | Estado |
|---|---|---|---|---|---|---|---|---|
| H-01 | P0 | C | El rescate presenta sugammadex 16 mg/kg como reversión inmediata de **rocuronio o vecuronio**, y la tarjeta de vecuronio dice "el sugammadex también lo revierte". Ficha técnica: 16 mg/kg solo tras rocuronio (≈3 min después de dosis única de 1,2 mg/kg); tras vecuronio no está establecida | Alto: falsa expectativa de rescate tras vecuronio en un "no intubo, no oxigeno" | `js/app.js` (rescate), `js/logic.js` (`nmbList`) | Texto corregido en rama `clinico/f0-pendiente-aprobacion` | Revisión del texto contra ficha técnica | Corregido · aprobado por el autor (médico) 2026-11-14 |
| H-02 | P0 | C | Rocuronio 1,6 mg/kg en shock: por encima del rango de ficha; la dosis de 16 mg/kg de sugammadex se estudió tras 1,2 mg/kg | Alto | `js/logic.js` (`nmbList`) | Nota de advertencia en la rama clínica; decisión de dosis para especialista | Revisión clínica | Advertencia aplicada · aprobada 2026-11-14; dosis 1,6 mg/kg pendiente de revisión |
| H-03 | P0 | C | Reducciones de dosis de inducción por estado (etomidato 0,15–0,2; ketamina 0,5–1; propofol 0,5) sin fuente documentada | Medio-alto | `js/logic.js` (`indDose`) | Documentar fuente o modificar (especialista) | Casos de referencia aprobados | Pendiente · regla marcada en la app como "pendiente de verificar" |
| H-04 | P0 | C | Vecuronio SIR 0,15 mg/kg (0,1–0,2) por peso ideal: superior a la dosis habitual de intubación; sin fuente | Medio | `js/logic.js` | Revisión clínica | Casos de referencia | Pendiente · regla marcada en la app como "pendiente de verificar" |
| H-05 | P0 | C | Pesos de dosificación en obesidad (magro, ajustado, ideal) sin fuente por fármaco, salvo sugammadex (peso real, verificado) | Medio-alto | `js/logic.js` (`wt`), `js/app.js` (`bcalc`) | Documentar o modificar (especialista) | Casos IMC 30–60 | Pendiente · regla marcada en la app como "pendiente de verificar" |
| H-06 | P0 | C | La elección del inductor se decide por escenario + estado hemodinámico; el escenario actúa como diagnóstico aislado (p. ej., "EPOC" estable → ketamina de 1.ª elección) sin valoración individual explícita | Medio | `js/logic.js` (`inductorsBase`) | Rediseño clínico: presentar opciones con precauciones en lugar de "1.ª elección" | Revisión clínica + pruebas de escenarios | Pendiente · regla marcada en la app como "pendiente de verificar" |
| H-07 | P0 | C | Recomendaciones, precauciones y contraindicaciones se muestran con el mismo componente (`alert`), sin diferenciar su naturaleza | Medio | `js/logic.js` (`alerts`), `js/app.js` | Clasificar mensajes (contraindicación / precaución / recomendación) — Fase 2 | Prueba de usabilidad | Parcial: etiquetas de texto (Riesgo alto / Precaución / Información); clasificación clínica pendiente |
| H-08 | P0 | C | **Resultados antiguos visibles**: al cambiar un dato tras calcular, el plan y las infusiones previas seguían en pantalla; si los datos nuevos eran inválidos, se mostraban dosis del paciente anterior | Alto | `js/app.js` | `invalidate()` borra resultados ante cualquier cambio; marcador "Sin resultados vigentes" | `ui.test.js` #2, #4 | Corregido |
| H-09 | P0 | C | Sin límites para PAS, PAD, FC, SpO₂ ni edad máxima: se aceptaban FC 0, SpO₂ 101, PAS 0 | Alto | `js/logic.js` (`validate`) | `js/validate.js`: rangos de plausibilidad y mensajes por campo | `engine.test.js` validación; `ui.test.js` #6 | Corregido |
| H-10 | P0 | C | `parseFloat` aceptaba entradas erróneas silenciosamente ("8o" → 8; "70.5.1" → 70,5); la coma decimal dependía del teclado/navegador | Alto | `js/logic.js` (`read`), `index.html` | `parseNum` estricto (coma o punto), campos `type=text` con teclado numérico | `engine.test.js` parseNum; `ui.test.js` #4, #5 | Corregido |
| H-11 | P0 | C | Sin barrera ante dosis, volúmenes o velocidades no finitos, cero o negativos | Alto | `js/app.js`, `js/logic.js` | `usable()` + tarjeta "No calculado" que sustituye la dosis | `engine.test.js` propiedades | Corregido |
| H-12 | P0 | C | Dosis y volumen mostrados no coincidían por redondeo (p. ej., 24 mg = 12,1 mL de 2 mg/mL) | Medio | `js/app.js` (`bcalc`) | `roundDose`: el volumen se calcula desde la dosis ya redondeada | `ui.test.js` #10 | Corregido |
| H-13 | P1 | C | El peso introducido se mostraba redondeado (80,5 → 81 kg) | Bajo | `js/app.js` | Se muestra el valor introducido | `ui.test.js` #5 | Corregido |
| H-14 | P0 | C | Valores extremos posibles (PAS 60, FC 180) se calculaban sin confirmación | Medio | `js/app.js` | Confirmación explícita ligada a los datos exactos; se repite si cambian | `ui.test.js` #7 | Corregido |
| H-15 | P0 | C | Ningún aviso junto a los resultados indicaba que el algoritmo no está validado ni su versión | Medio | `js/app.js`, `index.html` | Banner con versión/fecha/estado en Plan e Infusiones; versión en Ajustes | `ui.test.js` #1 | Corregido |
| H-16 | P1 | C | Sin pruebas automatizadas | Alto (calidad) | — | 21 pruebas (`node:test` + jsdom) y CI en GitHub Actions | `npm test` | Corregido |
| H-17 | P1 | C | Peso ideal con mínimo silencioso de 35 kg (`Math.max`): en tallas bajas cambia las dosis sin aviso | Medio | `js/logic.js` (`derive`) | Decidir regla y mostrarla (especialista) | Casos talla 120–150 cm | Mitigado: aviso visible cuando se aplica el mínimo; regla pendiente de validación |
| H-18 | P2 | C | Cronómetro de BNM se pierde al recargar la app; no aclara que no confirma el bloqueo | Medio | `js/app.js` | Persistir hora de inicio; texto aclaratorio | Pruebas segundo plano / recarga | Corregido: hora de inicio persistente (máx. 6 h) y aclaración de alcance |
| H-19 | P2 | C | Portada de 2,7 s en cada apertura retrasa el acceso (se puede tocar para saltar) | Medio (urgencias) | `js/app.js`, `css/app.css` | Reducir o mostrar solo en el primer inicio (requiere decisión del autor) | Medición de tiempo | Pendiente |
| H-20 | P2 | R | Marca de agua de fondo puede reducir legibilidad sobre campos y dosis | Bajo-medio | `css/app.css` | Evaluar contraste | Contraste WCAG | Pendiente |
| H-21 | P3 | C | Service worker cache-first: la actualización llega en la segunda apertura y sin aviso de nueva versión de algoritmo | Medio | `sw.js` | Aviso de actualización y verificación de versión coherente | Prueba offline/actualización | Corregido: aviso de nueva versión con recarga |
| H-22 | P3 | C | Publicación en GitHub Pages no depende de que pasen las pruebas | Medio | Config. Pages | Publicar mediante Actions tras `npm test` | CI | Pendiente |
| H-23 | P3 | C | Código duplicado entre `SIRDOC/www` (privado) y `sirdoc-app` | Medio | ambos repos | Fuente única | — | Pendiente |
| H-24 | P1 | C | La lógica clínica genera HTML (`infCard`, `prep`, `alerts`): mezcla motor e interfaz | Medio | `js/logic.js` | Separar datos/algoritmos/motor/vista (Fase 1) | Pruebas existentes deben seguir pasando | Pendiente |
| H-25 | P3 | C | Privacidad: no hay red ni analítica; `localStorage` guarda solo ajustes; el resumen copiado contiene edad, peso y PA (sin identificadores) en el portapapeles | Bajo | `js/app.js` | Documentar política; aviso al copiar | — | Corregido: sección de privacidad y aviso al copiar |
| H-26 | P0 | C | Ninguna dosis está contrastada con la ficha técnica autorizada por INVIMA | Alto | todos | Contraste farmacéutico | Matriz científica | Pendiente · regla marcada en la app como "pendiente de verificar" |
| H-27 | P4 | H | La directriz de Apple sobre calculadoras de dosis podría impedir la publicación a nombre de una persona | Alto (estratégico) | — | Verificar directriz vigente (Fase 4) | — | Pendiente |
| H-28 | P0 | C | Epinefrina en bolo 10–20 mcg y su preparación (1 mg en 100 mL) sin fuente citada | Medio | `js/logic.js` (`prep`) | Contraste clínico | — | Pendiente · regla marcada en la app como "pendiente de verificar" |

## Actualización v1.2.0 (2026-11-14)
- Fusionada la rama clínica de sugammadex (H-01, H-02) por instrucción escrita del autor, médico. **Se recomienda además revisión independiente por anestesiología.**
- Matriz científica integrada en la app: cada dosis muestra su regla (R-01…R-16), el estado de su fuente y su aprobación; lista completa en Ajustes.
- Correcciones H-07 (parcial), H-17 (aviso), H-18, H-21, H-25. Pruebas: **26/26**.
- Sin cambios de dosis. Siguen pendientes de revisión clínica: H-03, H-04, H-05, H-06, H-26, H-28 y la dosis de 1,6 mg/kg (H-02).
- Pendientes técnicos: H-19 y H-20 (requieren decisión del autor), H-22 (cambiar Pages a GitHub Actions en la configuración), H-23, H-24 (Fase 1).

## Resultados de pruebas (esta fase)
`npm test` → **21 pruebas, 21 superadas, 0 fallidas** (Node 22, jsdom 24).
Cobertura: parseo numérico, redondeo, pesos de referencia, PAM/IS/estado, preparación de bolos, infusiones con valores de referencia
calculados a mano, propiedades de infusión para 9 fármacos × 6 pesos × 4 duraciones, conversión de unidades, validación (errores y
confirmaciones) y flujos de interfaz (resultados obsoletos, formato inválido, coma decimal, confirmación, cambio de presentación,
coherencia dosis/volumen, resumen sin firma).

## Limitaciones
- Las pruebas fijan el **comportamiento actual** de las reglas clínicas; no demuestran que sean correctas.
- No se probó en iPhone/Android reales, ni el funcionamiento offline, ni el cronómetro en segundo plano.
- No se contrastaron fichas técnicas INVIMA ni guías completas, salvo sugammadex (FDA/EMA).

## Entregable 2 — Plan técnico por fases
| Fase | Tareas | Depende de | Criterio de aceptación |
|---|---|---|---|
| F0 (esta) | Barreras de error de medicación, validación, invalidación, pruebas, CI, rama clínica | — | 21/21 pruebas; cambios clínicos sin fusionar |
| F0-b | Revisión clínica de H-01…H-06, H-17, H-26, H-28 por especialistas; actualizar matriz científica | Aprobación humana | Cada regla con fuente, versión y aprobación firmada |
| F1 | Separar motor puro (`engine/`), datos (`data/`), reglas (`rules/`), vista; casos de referencia aprobados | F0-b para valores clínicos | Pruebas idénticas al conjunto de referencia |
| F2 | Flujo Paciente → Escenario → Riesgos → Plan → Preparación → Infusiones → Referencias; modo consulta rápida; cronómetro robusto; clasificación de mensajes | F1 | Pruebas de usabilidad con profesionales |
| F3 | Publicación condicionada a pruebas, aviso de actualización, fuente única de código, política de datos, historial de versiones | F1 | Offline y online consistentes y verificables |
| F4 | Evaluación INVIMA y Apple; iOS Capacitor, TestFlight | F0-b, F3 | Evaluación regulatoria documentada |
