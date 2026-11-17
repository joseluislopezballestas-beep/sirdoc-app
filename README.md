# SirDoc — app web

Secuencia de intubación rápida e infusiones de mantenimiento en adultos.
Diseño y creación: **Md. Jose Luis Lopez Ballestas**

**Abrir:** https://joseluislopezballestas-beep.github.io/sirdoc-app/

**Instalar en iPhone/iPad:** abre el enlace en Safari → Compartir → *Agregar a pantalla de inicio*.
**Instalar en Android:** abre el enlace en Chrome → menú ⋮ → *Instalar app* / *Agregar a pantalla principal*.
Una vez abierta, funciona sin conexión.

## Estado — versión 1.6.0 (17/11/2026)
**Experimental — sin validación clínica formal.**
- Escenarios: politrauma, raquimedular, sangrado, EPOC, ictus hemorrágico, ictus isquémico, falla cardiaca, sepsis e IAM.
- Cada dosis muestra su regla, el estado de la fuente y la fecha de revisión; la lista completa con enlaces está en Ajustes.
- Documentos: `docs/MATRIZ-CIENTIFICA.md`, `docs/EVIDENCIA-2026-11-14.md`, `docs/AUDITORIA-F0.md` y `CHANGELOG.md`.

## Pruebas
```bash
npm install
npm test        # motor de cálculo + interfaz (jsdom)
```

> Herramienta de apoyo para profesionales de la salud. No reemplaza el juicio clínico ni los protocolos institucionales.
