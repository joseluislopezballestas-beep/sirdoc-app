# Registro de cambios — SirDoc (app web)

Cada entrada indica si el cambio es **técnico** (no altera contenido clínico) o **clínico** (requiere aprobación de especialista).

## 1.6.2 — 2026-11-17 · Correcciones del informe de pruebas por escenario
Cambios propuestos en el «Informe de pruebas por escenario» (120 casos), aplicados por instrucción de Md. Jose Luis Lopez Ballestas (autor, médico) 2026-11-17. H-02 se deja como está por decisión del autor.
- **[clínico, aprobado] H-01:** meta de PA con TCE por edad (BTF) también en raquimedular (antes PAS ≥ 110 fija).
- **[clínico, aprobado] H-03:** sangrado de origen traumático con casilla «TCE asociado»: con TCE no hay hipotensión permisiva.
- **[clínico, aprobado] H-04:** sepsis sin shock ni vasopresor: sin corticoides ni condición «choque séptico»; vigilancia y norepinefrina si aparece hipotensión.
- **[clínico, aprobado] H-08:** ictus isquémico en shock: primero corregir la hipotensión; sin metas de reducción de PA.
- H-05: el texto de pretratamiento no indicado dice el motivo real. H-06: «Dosis para» con todas las condiciones (edad ≥ 65 en propofol, edad ≥ 75).
- H-07: coma decimal en pantalla, resumen y avisos. H-09: hemoderivados una sola vez (Preparación). H-10: condición de la epinefrina en ámbar.
- H-11: la fila superior muestra la dosis sugerida con botón «Usar»; Preparación plegada salvo pasos críticos (hemoderivados o vasopresor). H-12: avisos arriba. Marca de agua más tenue.
- Pruebas: `tests/v162.test.js` con la matriz de 120 casos y coherencia de condiciones. 82 pruebas.

## 1.6.1 — 2026-11-17 · Aprobaciones del autor y base de peso del rocuronio
- **[clínico, aprobado]** Aprobado por Md. Jose Luis Lopez Ballestas (autor, médico) 2026-11-17: techo de dexmedetomidina 1,4 mcg/kg/h (R-12); techos blandos R-20; propofol alternativo en «Otro / general» solo con hemodinamia estable (R-09); hemoderivados antes del vasopresor en sangrado y politrauma con hemorragia (R-15).
- **[clínico, decisión del autor]** Rocuronio por **peso ajustado en bolo y en infusión** cuando IMC ≥ 30 (antes la infusión usaba peso ideal). Fuentes: Erstad & Barletta 2021; Sakızcı-Uyar 2016; McDowell 2024 (añadidas a R-02 y R-21).
- Prueba nueva: misma base de peso del rocuronio en bolo e infusión. 72 pruebas, sin discrepancias en el barrido.

## 1.6.0 — 2026-11-17 · Matriz de medidas M01–M26
Implementación de la matriz de medidas de la auditoría de v1.5.0. Los cálculos por kg confirmados por el autor no cambian, salvo lo marcado **[clínico, pendiente de aprobación]**.

**P1 — críticos y mayores**
- **M01 (crítico):** la selección se revalida con los datos actuales. Si el fármaco seleccionado o registrado pasa a *Evitar*, *No disponible* o *Contraindicado*, la fila superior y el resumen muestran el aviso tipificado sin dosis y piden reconfirmar. Al cambiar el escenario o el estado hemodinámico, la selección se borra y se avisa.
- **M02:** dexmedetomidina o «sin sedación» + BNM continuo: la tarjeta del BNM se sustituye por un bloqueo (sin mL/h) hasta elegir propofol, midazolam o ketamina.
- **M03:** rótulos *fuera de ficha*: dexmedetomidina > 0,7 mcg/kg/h (ficha FDA 0,2–0,7); vecuronio > 1,2 mcg/kg/min (ficha 0,8–1,2; 1,2–1,7 según PDR); inicio de rocuronio 8 mcg/kg/min (ficha 10–12). R-13 documenta vecuronio y rocuronio con fuente; R-12 la ficha EMA. **[clínico, pendiente de aprobación]** techo de dexmedetomidina 1,5 → **1,4 mcg/kg/h** (máximo de la ficha EMA, que no debe superarse).
- **M04:** no implementable por la app: requiere panel de revisores independientes (pendiente).

**P2 — preparación y verificación**
- **M05:** ketamina y norepinefrina en infusión por **fracción de ampolla** (pasos de 1 mL: 50 mg y 1 mg). Ej.: ketamina coadyuvante 70 kg, 8 h → 1 mL (50 mg) en 50 mL, dura ≈ 12 h (antes 500 mg en 250 mL, > 100 h).
- **M06:** tope de estabilidad 24 h (propofol 12 h): si la mezcla duraría más, aviso con la hora de desecho.
- **M07:** «sin diluir» solo si cabe en una jeringa de 50 mL; si no, bolsa o varias jeringas. Toda preparación indica su **recipiente**.
- **M08:** concentración de la mezcla con 3 cifras significativas (error ≤ 0,5 %) y como cantidad/volumen.
- **M09:** **[pendiente de aprobación, R-20]** techos blandos: etomidato > 40 mg, rocuronio > 200 mg, sugammadex > 2.000 mg muestran aviso y exigen confirmar antes de seleccionar o resumir. No cambian la dosis.
- **M10:** barrido de regresión en `npm test` (16.016 preparaciones con recálculo independiente).

**P3 — ámbito y seguridad**
- **M11:** escenario **«Otro / general»** con aviso de fuera de ámbito arriba del plan y en el resumen. **[clínico, pendiente de aprobación]** propofol como alternativa solo con hemodinamia estable.
- **M12:** alergias a succinilcolina, sugammadex, etomidato, ketamina, propofol y fentanilo (bloquean solo su fármaco, también en infusión); déficit de pseudocolinesterasa como precaución de succinilcolina.
- **M13:** **[clínico, pendiente de aprobación, R-15]** en Sangrado y Politrauma con hemorragia: hemoderivados y control del sangrado primero; norepinefrina rotulada como coadyuvante ante hipotensión que amenaza la vida (guía europea 2023).
- **M14:** sepsis inestable: la tarjeta de propofol propone reducir dosis o ketamina, no midazolam.
- **M15:** tabla única de base de peso por fármaco (`BASIS`, R-21); el aviso de obesidad se genera de ella. **Decisión pendiente del autor:** rocuronio en bolo usa peso ajustado y en infusión peso ideal (sin cambio).

**P4–P5 — interfaz y publicación**
- M16 escenario compacto tras elegirlo; M17 avisos de Verificar en estilo de precaución (el rojo queda solo para contraindicaciones); M18 unidad visible en cada campo; M19 portada solo en la primera apertura; M20 controles ≥ 44 px; M21 epinefrina push-dose por doble dilución en jeringa (10 mcg/mL sin ambigüedad); M22 eliminado el aviso muerto de FC; M23 especificación de cálculos actualizada; M24 flujo de publicación que solo despliega si pasan las pruebas (requiere activarlo en GitHub); M25 Content-Security-Policy; M26 los datos del paciente se vacían al recargar (prueba manual en Safari iOS y Firefox pendiente).
- Pruebas: 71/71.

## 1.5.0 — 2026-11-16 · Secuencia de uso, selección explícita y resumen fiel
Correcciones solicitadas por el autor (sin cambios en cálculos, diluciones ni dosis, que se confirmaron correctos):
- **Crítico — Copiar resumen:** el resumen incluía la opción *sugerida* de la fila superior (p. ej., etomidato) aunque el usuario hubiera elegido ketamina. Ahora todo sale de una **fuente única de selección**: botón *Seleccionar* en cada tarjeta de inducción, bloqueante y pretratamiento, sincronizado con "Administrado" en Infusiones. El resumen incluye solo lo seleccionado (si no hay selección: "sin seleccionar"), las infusiones configuradas y **no** incluye medicamentos de rescate. Las filas superiores del plan muestran lo seleccionado o "Sin seleccionar · sugerido: …".
- **Advertencia roja** "Verifique antes de continuar" y nueva pestaña **Verificar** (disponibilidad, presentaciones y duración de infusiones) como primer paso; aviso rojo en Paciente hasta confirmar.
- **Pestañas:** Portada → Verificar → Paciente → Plan SIR (escenario y esquema) → Infusiones → Info (reglas, privacidad, referencias, aviso de uso). El escenario se elige en Plan SIR.
- **FC y SpO₂** obligatorias, sin la etiqueta "opcional".
- **Epinefrina push-dose:** condición de administración explícita (solo rescate ante hipotensión peri-intubación; no protocolaria ni rutinaria); la fila superior la rotula como rescate.
- Pruebas: 52/52 (incluye el caso Ketamina + Rocuronio que antes generaba Etomidato).

## 1.4.0 — 2026-11-14 · Rediseño de seguridad, presentaciones y verificación
**Diseño y seguridad (técnico):**
- Cinco tipos de aviso con icono, etiqueta, color y borde propios: **Contraindicación** (rojo sólido, bloquea el fármaco: sin dosis, nunca 1.ª elección, se muestra antes que todo), **Precaución**, **Evidencia insuficiente**, **No disponible** e **Información**. Cada aviso, meta y paso muestra la condición clínica que lo activa.
- Fármacos contraindicados o no disponibles aparecen como tarjetas propias (no desaparecen); si ningún bloqueante es utilizable, se avisa de forma explícita.
- Botones de 48–56 px, cifras de dosis de 30 px, paleta de alto contraste (texto secundario ≥ 7:1 en claro), tarjetas opacas sobre la marca de agua. Corregido: los campos numéricos no tenían estilo desde v1.2.0 y desbordaban en móvil.
- El resumen copiado incluye las contraindicaciones.
**Clínico (aprobado por Md. Jose Luis Lopez Ballestas, autor, médico, el 2026-11-14 por instrucción escrita):**
- Politrauma **con** y **sin hemorragia activa significativa**: hipotensión permisiva, hemoderivados, ácido tranexámico y dosis reducidas solo con hemorragia; sin hemorragia, PAM ≥ 65 y búsqueda de sangrado oculto; con TCE nunca hipotensión permisiva.
- Motor de contraindicaciones e interacciones (R-19): hipertermia maligna separada de enfermedad neuromuscular; alergia a aminoesteroides; miastenia gravis; magnesio/aminoglucósidos; betabloqueador o bradicardia (atropina); anticonceptivo hormonal y anticoagulación con sugammadex.
**Presentaciones:** todas seleccionables en Ajustes (fentanilo 0,1 mg/2 mL, dexmedetomidina premezclada, succinilcolina 1 g/10 mL y 20 mg/mL, sugammadex 500 mg) con fuentes INVIMA/MinSalud; opción "Otra presentación" con concentración limitada por fármaco. Preparación de bolos genérica para cualquier presentación.
**Verificación:** 49 pruebas. Recalculo independiente de 544 tarjetas de bolo y 2.176 de infusión (todas las presentaciones, 6–12 h, 7 perfiles de paciente, 9 escenarios); 600 combinaciones aleatorias de datos incompletos, extremos o erróneos sin ninguna dosis inválida.

## 1.3.7 — 2026-11-14 · Presentación de las reglas (técnico)
- En pantalla (plan, infusiones y Ajustes) cada regla muestra solo el estado de la fuente y la fecha de revisión. La aprobación clínica sigue documentada en la matriz científica y en este registro.

## 1.3.6 — 2026-11-14 · Sepsis e IAM revisados y aprobados (clínico)
Aprobado por Md. Jose Luis Lopez Ballestas (autor, médico) el 2026-11-14 por instrucción escrita, tras revisión de evidencia.
- Sepsis: sedación por defecto fentanilo + propofol a dosis baja (sin midazolam); líquidos ≥ 30 mL/kg en 3 h si hay hipoperfusión; hidrocortisona 200 mg/día; vasopresina con norepinefrina 0,25–0,5 mcg/kg/min.
- IAM: fentanilo 1–3 mcg/kg también con taquicardia y PA estable; sin betabloqueadores en shock cardiogénico; línea arterial y dobutamina; SpO₂ 92–96 % tras intubar; no intubar de forma profiláctica para el cateterismo; VD con vasodilatador pulmonar inhalado.
- Pruebas: 35/35.

## 1.3.5 — 2026-11-14 · Escenarios Sepsis e IAM (clínico; aprobados en 1.3.6)
- Nuevo escenario **Sepsis / choque séptico** (R-17): metas SSC 2026, norepinefrina periférica, vasopresina/epinefrina, corticoides, etomidato de elección (ensayo RSI, subgrupo sepsis), dosis reducidas; opción "Con vasopresor en curso".
- Nuevo escenario **Infarto agudo de miocardio** (R-18): oxígeno según ACC/AHA 2025, perfusión coronaria y consumo de O₂, etomidato reducido, fentanilo si PAS ≥ 140, parches de desfibrilación; opción "Compromiso de ventrículo derecho".
- Pruebas: 34/34.

## 1.3.4 — 2026-11-14 · Succinilcolina 1 mg/kg (clínico, aprobado)
- Succinilcolina en SIR: 1 mg/kg por peso real (antes 1,5 mg/kg); rango mostrado 0,3–1,1 mg/kg de la ficha técnica. Fundamento: ESAIC 2023 (R3, 1B) y ficha FDA. Aprobado por Md. Jose Luis Lopez Ballestas (autor, médico) el 2026-11-14 por instrucción escrita.

## 1.3.3 — 2026-11-14 · Guías ESAIC 2023, ASA 2022 y ASA 2023 verificadas (sin cambios de dosis)
- Post-intubación: TOF ≥ 0,9 con monitorización cuantitativa antes de extubar (ASA 2023; ESAIC 2023).
- Rescate: tener sugammadex calculado y a mano si se usa rocuronio; sugammadex sobre neostigmina para reversión no urgente.
- Laringoscopia: videolaringoscopio de elección en vía aérea difícil prevista (ASA 2022).
- Referencia S.C.A.R.E. aportada descartada por cita incorrecta. Dosis de succinilcolina (1,5 vs 1 mg/kg) pendiente de decisión.

## 1.3.2 — 2026-11-14 · Ictus isquémico contrastado con AHA/ASA 2026 (sin cambios de dosis)
- Texto de metas de PA alineado con la sección 4.3: < 185/110 también antes de trombectomía; PAS < 140 sin beneficio tras trombólisis y perjudicial 72 h tras trombectomía exitosa; sin reperfusión, reducción inicial ≈ 15 % solo con ≥ 220/120 o comorbilidad.
- R-10 pasa a "verificada en parte".

## 1.3.1 — 2026-11-14 · Referencias añadidas (técnico, sin cambios de dosis)
- 12 referencias aportadas por el autor enlazadas en la matriz (R-02, R-03, R-05 a R-09) y en Referencias: DeMasi 2025, Miner 2025, Kotani & Russotto 2025, Russotto & Sorbello 2025, McDougall 2026, Zampieri 2026, Andriazzi 2026, Guihard 2019, Grillot 2023, Ko & Celmins 2024, Gottlieb 2026, Accilien 2024. URL sin parámetros de rastreo.
- Nota informativa en rocuronio: no inferioridad no demostrada frente a succinilcolina en el ECA prehospitalario de Guihard 2019.

## 1.3.0 — 2026-11-14 · Hallazgos de la evidencia aplicados
**Clínico (aprobado por Md. Jose Luis Lopez Ballestas, autor, médico, 2026-11-14, por instrucción escrita):**
- P-01 Rocuronio 1,2 mg/kg también en shock (se retira 1,6 mg/kg).
- P-02 Aviso de peso en obesidad para rocuronio (ficha: real; app: ajustado). P-03 Tope de 200 mg de succinilcolina rotulado como límite de la app.
- P-04 Contraindicación de succinilcolina desde 48 h (antes 72 h).
- P-05 Dexmedetomidina sugerida para sedación ligera (PADIS 2025).
- P-06 Ketamina coadyuvante 1–2 mcg/kg/min. P-07 Ketamina sedante 0,1–0,5 mg/kg/h, rotulada fuera de guía.
- P-08 Rocuronio en infusión 8–12 mcg/kg/min; cisatracurio 3 mcg/kg/min (0,5–10).
- P-09 Indicación de BNM continuo según ATS 2024. P-10 Precaución aminoesteroide + corticoides.
- Nota del ECA de Sajdeya 2025 en lesión medular (meta de PAM sin cambio).
**Técnico:** enlaces a estudios y fichas en Ajustes y en Referencias; nuevo rótulo "Fuente identificada; texto completo no revisado"; informe `docs/EVIDENCIA-2026-11-14.md`. Pruebas: 30/30.

## 1.2.1 — 2026-11-14 · Contraste de la matriz con fuentes secundarias (técnico, sin cambios de dosis)
- Fuentes de la matriz científica actualizadas; 10 propuestas de cambio clínico (P-01 a P-10), aplicadas en 1.3.0.

## 1.2.0 — 2026-11-14 · Aplicación de la auditoría y la matriz científica
**Clínico (aprobado):** textos de sugammadex y rocuronio en shock (ver 1.1.3). Aprobado por Md. Jose Luis Lopez Ballestas (autor, médico) el 2026-11-14 por instrucción escrita.
**Técnico:**
- Matriz científica en la app: regla, estado de la fuente y aprobación junto a cada dosis; lista completa en Ajustes.
- Alertas con etiqueta de texto (Riesgo alto / Precaución / Información). (H-07 parcial)
- Aviso cuando el peso ideal se ajusta al mínimo de 35 kg. (H-17, mitigación)
- Cronómetro de BNM persistente (bloqueo, cambio de app, recarga; máx. 6 h) y aclaración de que no confirma el bloqueo. (H-18)
- Aviso de nueva versión con recarga. (H-21)
- Sección de privacidad y aviso al copiar el resumen. (H-25)
- Archivos versionados (?v=) y precarga sin caché HTTP en el service worker: impide mezclar archivos de versiones distintas tras publicar. (H-21)
- Pruebas: 27/27. **Sin cambios de dosis.**

## 1.1.3 — cambios clínicos (fusionados en 1.2.0)
Rama `clinico/f0-pendiente-aprobacion`. Fuente: ficha técnica de sugammadex (FDA rev. 11/2022; EMA).
- Rescate: 16 mg/kg descrito como reversión inmediata **solo tras rocuronio**; aviso si el plan usa vecuronio; ClCr < 30 según ficha. (H-01)
- Rocuronio 1,6 mg/kg en shock: advertencia de que la reversión inmediata se estudió tras 1,2 mg/kg. (H-02)
- Vecuronio: sugammadex solo para reversión de rutina (2–4 mg/kg). (H-01)
- Sin cambios de dosis. Aprobado por: Md. Jose Luis Lopez Ballestas (autor, médico). Fecha: 2026-11-14.

## 1.1.2 — 2026-11-14 · Fase 0 de auditoría (técnico)
- Validación de datos (`js/validate.js`): rangos de plausibilidad, mensajes por campo, confirmación de valores extremos ligada a los datos exactos. (H-09, H-14)
- Parseo numérico estricto con coma o punto decimal; campos de texto con teclado numérico. (H-10)
- Los resultados se borran al cambiar cualquier dato del paciente; no se muestran dosis anteriores. (H-08)
- Barrera ante dosis, volúmenes o velocidades no finitos, cero o negativos: tarjeta "No calculado". (H-11)
- Volumen calculado desde la dosis redondeada que se muestra. (H-12) Peso mostrado tal como se introdujo. (H-13)
- Aviso de algoritmo experimental, con versión y fecha, junto a los resultados. (H-15)
- Pruebas automatizadas (`npm test`, 21 pruebas) y CI. (H-16)
- Documentación: `docs/AUDITORIA-F0.md`, `docs/ESPECIFICACION-CALCULOS.md`, `docs/MATRIZ-CIENTIFICA.md`.
- **Sin cambios en dosis, rangos, contraindicaciones ni textos clínicos.**

### Pendiente de aprobación clínica (rama `clinico/f0-pendiente-aprobacion`, no publicada)
- Sugammadex: limitar la reversión inmediata con 16 mg/kg al rocuronio, según ficha técnica. (H-01, H-02)

## 1.1.1 — 2026-11-14
- Créditos en portada con vara de Esculapio; el resumen copiado no incluye la firma.

## 1.1.0 — 2026-11-13
- Versión inicial publicada de la app web.
