# Registro de cambios — SirDoc (app web)

Cada entrada indica si el cambio es **técnico** (no altera contenido clínico) o **clínico** (requiere aprobación de especialista).

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
