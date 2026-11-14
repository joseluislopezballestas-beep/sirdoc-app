# Registro de cambios — SirDoc (app web)

Cada entrada indica si el cambio es **técnico** (no altera contenido clínico) o **clínico** (requiere aprobación de especialista).

## 1.1.3 (propuesta, NO publicada) — cambios clínicos pendientes de aprobación
Rama `clinico/f0-pendiente-aprobacion`. Fuente: ficha técnica de sugammadex (FDA rev. 11/2022; EMA).
- Rescate: 16 mg/kg descrito como reversión inmediata **solo tras rocuronio**; aviso si el plan usa vecuronio; ClCr < 30 según ficha. (H-01)
- Rocuronio 1,6 mg/kg en shock: advertencia de que la reversión inmediata se estudió tras 1,2 mg/kg. (H-02)
- Vecuronio: sugammadex solo para reversión de rutina (2–4 mg/kg). (H-01)
- Sin cambios de dosis. Aprobado por: _pendiente_. Fecha: _—_.

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
