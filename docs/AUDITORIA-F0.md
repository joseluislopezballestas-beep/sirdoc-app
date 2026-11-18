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

## Actualización v1.3.7 (2026-11-14) — verificación del estado de cada hallazgo
Verificado contra el código de `main` (commit b68df88) y la integración continua: 36/36 pruebas superadas en GitHub Actions.

| ID | Estado en v1.3.7 | Evidencia |
|---|---|---|
| H-01 | **Corregido** | Sugammadex 16 mg/kg solo tras rocuronio; aviso explícito si el plan usa vecuronio (R-01, verificada) |
| H-02 | **Corregido** | Rocuronio 1,6 mg/kg retirado; 1,2 mg/kg en todos los estados (v1.3.0, P-01) |
| H-03 | **Parcial** | Fuentes identificadas (ensayo RSI, metaanálisis); las dosis reducidas quedan rotuladas como práctica clínica sin ensayo (R-05 a R-07) |
| H-04 | Pendiente | Vecuronio SIR 0,15 mg/kg sin fuente primaria (R-04) |
| H-05 | **Parcial** | R-11 verificada en parte (Erstad & Barletta 2021); diferencia con la ficha de rocuronio (peso real) documentada y avisada |
| H-06 | Pendiente | La interfaz sigue mostrando "1.ª elección" por escenario; cada opción tiene fundamento y referencia, pero no se rediseñó |
| H-07 | Parcial | Etiquetas de texto en alertas; falta la clasificación clínica (contraindicación / precaución / recomendación) |
| H-08 a H-16 | **Corregido** | Invalidación, validación, parseo estricto, barreras de dosis, redondeo, peso exacto, confirmación de extremos, aviso de versión; 36 pruebas y CI |
| H-17 | Mitigado | Aviso visible del mínimo de 35 kg; regla sin validar |
| H-18 | **Corregido** | Cronómetro persistente y aclaración de alcance |
| H-19 | Pendiente | La portada sigue durando 2,7 s en cada apertura (se puede tocar para saltar); requiere decisión del autor |
| H-20 | Pendiente | Marca de agua de fondo (opacidad 3,5 %) sin evaluación de contraste WCAG |
| H-21 | **Corregido** | Aviso de nueva versión y archivos versionados |
| H-22 | Pendiente | Las pruebas corren en Actions, pero Pages publica desde la rama sin esperar a que pasen |
| H-23 | Pendiente | `SIRDOC/www` y `sirdoc-app` se sincronizan a mano |
| H-24 | Pendiente | `logic.js` todavía genera HTML |
| H-25 | **Corregido** | Sección de privacidad y aviso al copiar |
| H-26 | **Parcial** | Contrastadas fichas FDA (rocuronio, succinilcolina, cisatracurio, sugammadex); ficha INVIMA no contrastada |
| H-27 | Pendiente | Directriz de Apple sin evaluar |
| H-28 | Pendiente | Epinefrina en bolo 10–20 mcg sin fuente primaria (R-14) |

Resumen: 14 corregidos, 5 parciales o mitigados (H-03, H-05, H-07, H-17, H-26), 9 pendientes (H-04, H-06, H-19, H-20, H-22, H-23, H-24, H-27, H-28).
Fases: F0 completada; F0-b avanzada (reglas con fuente y aprobación del autor; falta revisión independiente por especialista); F1 a F4 sin iniciar.
Añadido después de la auditoría: escenarios Sepsis (R-17) e IAM (R-18), guías ESAIC 2023 y ASA 2022/2023, succinilcolina 1 mg/kg.

## Actualización v1.4.0 (2026-11-14) — rediseño de seguridad y verificación
| ID | Estado | Cambio |
|---|---|---|
| H-07 | **Corregido** | Cinco tipos de aviso (contraindicación, precaución, evidencia insuficiente, no disponible, información) con icono, etiqueta y color; la contraindicación bloquea el fármaco y se muestra primero; cada aviso muestra su condición |
| H-06 | Parcial | Las opciones siguen ordenadas por escenario, pero cada dosis muestra la condición clínica que la determina y los fármacos contraindicados o no disponibles se ven y se explican |
| H-20 | Mitigado | Tarjetas de dosis opacas sobre la marca de agua; paleta de alto contraste |
| H-26 | Parcial | Presentaciones colombianas con fuente INVIMA/MinSalud y seleccionables; fichas INVIMA de dosis aún no contrastadas |
| Nuevo H-29 | **Corregido** | Los campos de datos del paciente (type=text desde v1.2.0) no tenían estilo y desbordaban en móvil |
| Nuevo H-30 | **Corregido** | Politrauma sin hemorragia recibía hipotensión permisiva y ácido tranexámico por defecto |

Verificación de cálculo (pruebas `tests/verify.test.js` y `tests/safety.test.js`, 49/49):
- Recalculo independiente (fórmulas escritas aparte) de 544 tarjetas de bolo y 2.176 tarjetas de infusión: dosis = mg/kg × peso del criterio, volumen = dosis/concentración, dilución (mL cargados + SSN = volumen final; cantidad/volumen = concentración), mg/h, mL/h, rangos, volumen final y duración ≥ horas solicitadas. Todas las presentaciones, 6/8/10/12 h, 7 perfiles (incluye obesidad extrema, talla baja y shock), 9 escenarios. Sin discrepancias.
- 600 combinaciones aleatorias de datos incompletos, extremos o erróneos y comorbilidades: ningún NaN/Infinity, ninguna dosis ≤ 0 ni fuera del rango declarado; 399 casos bloqueados por datos inválidos y 201 calculados.
- Contraindicaciones (hiperK, hipertermia maligna, enf. neuromuscular, quemadura, lesión medular > 48 h, alergia a aminoesteroides), ningún bloqueante utilizable, fármacos no disponibles, interacciones y presentaciones "otra" con validación: verificados por prueba.
Límites: las pruebas verifican que la app hace lo que sus reglas dicen; la corrección clínica de las reglas depende de la matriz científica y de la revisión por especialistas.

## Actualización v1.5.0 (2026-11-16) — revisión del autor
| ID | Estado | Cambio |
|---|---|---|
| H-31 (nuevo, crítico) | **Corregido** | El resumen copiado tomaba la opción sugerida y no la seleccionada (Ketamina + Rocuronio generaba Etomidato). Fuente única de selección (`M`) para plan, "Administrado" y resumen; prueba de regresión con el caso reportado |
| H-32 (nuevo) | **Corregido** | Presentaciones y duración de infusiones podían quedar sin revisar: pestaña Verificar con advertencia roja antes de los datos del paciente |
| H-33 (nuevo) | **Corregido** | FC y SpO₂ opcionales permitían subestimar el riesgo hemodinámico: ahora obligatorias |
| H-34 (nuevo) | **Corregido** | Epinefrina push-dose podía leerse como paso rutinario: condición de administración explícita y excluida del resumen |
El autor confirmó como correctos los cálculos de dosis, diluciones, volúmenes y velocidades (sin cambios en esos algoritmos).

## Actualización v1.6.0 (2026-11-17) — matriz de medidas M01–M26
Fuente: matriz «SirDoc v1.5.0 — Matriz de medidas a corregir» (hallazgos HA-01 a HA-17, D4, TEC04). Cada medida tiene prueba de aceptación en `tests/v16.test.js` o `tests/sweep.test.js`, salvo las indicadas.

| Medida | Hallazgo | Estado | Nota |
|---|---|---|---|
| M01 Revalidar la selección | HA-01 (crítica) | Hecho | Rol actual del fármaco; borrado con aviso al cambiar escenario o estado |
| M02 Dexmedetomidina/sin sedación + BNM continuo | HA-03 | Hecho | Bloqueo sin mL/h |
| M03 Rangos fuera de ficha | HA-04 | Hecho · techo de dexmedetomidina 1,4 **aprobado por el autor 2026-11-17** (v1.6.1) | R-12, R-13 con fuente |
| M04 Validación por especialistas independientes | HA-02 | **Pendiente** | Requiere panel externo; no lo resuelve el código |
| M05 Fracción de ampolla | HA-06 | Hecho | Ketamina 50 mg, norepinefrina 1 mg |
| M06 Estabilidad de la mezcla | HA-06 | Hecho | 24 h / propofol 12 h; 3.004 de 16.016 preparaciones del barrido con aviso |
| M07 Sin diluir > 50 mL | HA-07 | Hecho | Recipiente siempre indicado |
| M08 Rotulado de concentración | HA-08 | Hecho | 3 cifras significativas, ≤ 1 % en todo el barrido |
| M09 Techos blandos | HA-14 | Hecho · valores **aprobados por el autor 2026-11-17** (R-20, v1.6.1) | |
| M10 Barrido en CI | D4 | Hecho | `tests/sweep.test.js` en `npm test` |
| M11 Otro / general | HA-05 | Hecho · propofol alternativo solo en estable **aprobado por el autor 2026-11-17** (v1.6.1) | |
| M12 Alergias y pseudocolinesterasa | HA-12 | Hecho | |
| M13 Hemoderivados antes que vasopresor | HA-09 | Hecho · **aprobado por el autor 2026-11-17** (R-15, v1.6.1) | Guía europea 2023 |
| M14 Sepsis: sin midazolam | HA-10 | Hecho | |
| M15 Base de peso en obesidad | HA-11 | Hecho · rocuronio unificado en **peso ajustado** (bolo e infusión) por decisión del autor 2026-11-17 (v1.6.1) | Tabla `BASIS`, R-21 |
| M16 Dosis en la primera pantalla | HA-15 | Hecho | 375 × 812: primera fila a 542 px (Chrome) |
| M17 Rojo solo para contraindicaciones | HA-16 | Hecho | |
| M18 Unidad visible | HA-17 | Hecho | |
| M19 Portada | HA-17 | Hecho (H-19) | Solo primera apertura |
| M20 Controles ≥ 44 px | HA-17 | Hecho | 0 controles < 44 px a 375 px (Chrome) |
| M21 Epinefrina push-dose | HA-17 | Hecho | Doble dilución en jeringa |
| M22 Aviso muerto de FC | HA-17 | Hecho | |
| M23 Especificación de cálculos | HA-13 | Hecho | Prueba de versión |
| M24 Publicar solo si pasan las pruebas | HA-17 (H-22) | Hecho en el repositorio · **activación pendiente en GitHub** | Settings → Pages → Source «GitHub Actions» y variable `PAGES_ACTIONS=true` |
| M25 Content-Security-Policy | HA-17 | Hecho | Sin errores de consola en http y file:// |
| M26 Safari iOS y Firefox | TEC04 | Parcial | Datos del paciente se vacían al recargar (también con caché de página); prueba en Safari/Firefox reales pendiente |

## Actualización v1.6.1 (2026-11-17) — aprobaciones del autor
Aprobado por Md. Jose Luis Lopez Ballestas (autor, médico), 2026-11-17: (1) techo de dexmedetomidina 1,4 mcg/kg/h (ficha EMA, R-12);
(2) techos blandos R-20 (etomidato 40 mg, rocuronio 200 mg, sugammadex 2.000 mg); (3) propofol como alternativa en «Otro / general»
solo con hemodinamia estable (R-09); (4) hemoderivados y control del sangrado antes del vasopresor en sangrado y politrauma con hemorragia (R-15);
(5) base de peso del rocuronio unificada en **peso ajustado** para bolo e infusión (R-02, R-11, R-13, R-21), por ser la opción mejor respaldada:
Erstad & Barletta 2021 (no despolarizantes por peso ideal o ajustado/magro), Sakızcı-Uyar 2016 (1,2 mg/kg por peso corregido sin diferencias
frente a peso magro en inicio y condiciones) y McDowell 2024 (peso ideal frente a real en SIR: no se demostró no inferioridad; parálisis más corta).
Cambio de cálculo: la infusión de rocuronio en IMC ≥ 30 pasa de peso ideal a peso ajustado (mayor dosis/h). Pruebas: 72/72, sin discrepancias.
Sigue pendiente: revisión por especialistas independientes (M04), activación de Pages por Actions (M24), pruebas en Safari/Firefox reales (M26).

## Actualización v1.6.2 (2026-11-17) — informe de pruebas por escenario
Fuente: «SirDoc 1.6.1 — Informe de pruebas por escenario» (114 casos; 120 desde v1.6.2 con la casilla TCE en sangrado). Cambios aplicados por instrucción del autor (Md. Jose Luis Lopez Ballestas, médico, 2026-11-17).

| ID | Estado | Cambio |
|---|---|---|
| H-01 | **Corregido** | Meta de PA con TCE por edad compartida (`tceTarget`) en politrauma, raquimedular y sangrado traumático |
| H-02 | Sin cambio | Decisión del autor: se deja como está |
| H-03 | **Corregido** | Casilla «TCE asociado» en sangrado de origen traumático; sin hipotensión permisiva con TCE |
| H-04 | **Corregido** | Sepsis sin shock ni vasopresor: sin corticoides ni condición de choque |
| H-05 | **Corregido** | Motivo real cuando no se sugiere pretratamiento |
| H-06 | **Corregido** | «Dosis para» lista estado, escenario, edad ≥ 75 y edad ≥ 65 en propofol |
| H-07 | **Corregido** | Coma decimal en plan, infusiones, resumen y avisos |
| H-08 | **Corregido** | Ictus isquémico en shock: primero corregir la hipotensión |
| H-09 | **Corregido** | Hemoderivados solo en Preparación |
| H-10 | **Corregido** | Condición de la epinefrina en ámbar |
| H-11 | **Parcial** | Dosis sugerida y botón «Usar» en la fila superior; Preparación plegada salvo pasos críticos. El plan completo sigue siendo largo (≈ 5.800 px en shock con hemorragia) porque las opciones y la preparación crítica quedan abiertas a propósito |
| H-12 | **Corregido** | Avisos en la parte superior; marca de agua más tenue (opacidad 0,018) |

Pruebas: 82/82, incluida la matriz de 120 casos con aserciones de coherencia (`tests/v162.test.js`).

## Actualización v1.7.0 (2026-11-17) — diseño Clinical 2.0
Sin cambios en el motor de cálculo ni en las reglas. Capa visual del autor integrada con ajustes de densidad, tema noche por defecto, reglas R-xx solo en Info, portada por versión y sin marca de agua.
Verificación: 85/85 pruebas; contraste WCAG AA en 162 textos visibles del plan (noche y alta luz, shock + hiperkalemia + hemorragia); 0 errores de consola; 320 y 375 px.
Pendiente del archivo del autor: pruebas con guantes y luz real de ambulancia, lector de pantalla y zoom 200 %.
