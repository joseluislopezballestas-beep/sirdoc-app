# Contraste de evidencia y cambios aplicados — SirDoc v1.3.0 (2026-11-14)

**Alcance y límites.** Se contrastaron las reglas de la matriz científica con fichas técnicas, ensayos y guías. De cada fuente se revisó el resumen, el registro bibliográfico o la sección pertinente de la ficha; **no se leyeron completos todos los textos**. Por eso la app distingue: *Fuente verificada* (texto pertinente contrastado), *Fuente verificada en parte*, *Fuente identificada; texto completo no revisado* y *Fuente pendiente de verificar*. Nada de esto equivale a validación clínica formal.

**Aprobación.** Los cambios P-01 a P-10 fueron aprobados por **Md. Jose Luis Lopez Ballestas (autor, médico)** el 2026-11-14, por instrucción escrita. Se recomienda revisión independiente por un especialista (anestesiología / medicina crítica) antes de uso clínico.

## 1. Resultado por regla
| Regla | Evidencia | Resultado |
|---|---|---|
| R-01 Sugammadex | Ficha Bridion: 16 mg/kg solo tras rocuronio 1,2 mg/kg | Coincide (ya aplicado en v1.2.0) |
| R-02 Rocuronio SIR | Ficha FDA: 0,6–1,2 mg/kg; sin respaldo para 1,6 mg/kg | **Cambiado (P-01)** |
| R-02/R-11 Rocuronio en obesidad | Ficha: peso real. Erstad & Barletta 2021: no despolarizantes por peso ideal o ajustado | **Decisión documentada (P-02):** se mantiene el peso ajustado y se avisa de la diferencia con la ficha |
| R-03 Succinilcolina | Ficha: contraindicada tras la fase aguda (quemaduras, trauma múltiple, denervación, motoneurona superior); riesgo máximo 7–10 días; sin dosis máxima en adultos. Erstad & Barletta: peso real | **Cambiado (P-04):** ventana > 48 h. **P-03:** se mantiene el tope de 200 mg como límite de seguridad de la app, rotulado como tal |
| R-04 Vecuronio SIR | Sin fuente primaria localizada (uso fuera de ficha) | Sin cambio; pendiente |
| R-05/06/07/09 Inductores | Ensayo RSI (NEJM): sin diferencia de mortalidad ketamina vs etomidato, más colapso con ketamina. Metaanálisis Greer 2025 y Koroki 2024 | Coincide; dosis reducidas = práctica clínica |
| R-10 Metas de PA | AHA/ASA 2022 (HIC), AHA/ASA 2026 (ictus), BTF 4.ª ed., AO Spine/Praxis 2024. ECA Sajdeya 2025: sin beneficio al elevar PAM > 85–90 vs > 65–70, más complicaciones | Meta sin cambio; **nota añadida** en lesión medular |
| R-12 Sedante por defecto | PADIS 2025: dexmedetomidina antes que propofol para sedación ligera | **Cambiado (P-05):** recomendación de pasar a dexmedetomidina al aligerar la sedación (propofol se mantiene tras la intubación mientras dura el BNM) |
| R-12 Ketamina coadyuvante | PADIS 2018: bolo 0,5 mg/kg y luego 1–2 mcg/kg/min | **Cambiado (P-06):** 1 mcg/kg/min (rango 1–2) |
| R-12 Ketamina sedante | Sin recomendación de guía | **Cambiado (P-07):** 0,2 mg/kg/h (rango 0,1–0,5), rotulado "fuera de guía" |
| R-13 BNM en infusión | Ficha cisatracurio: 3 mcg/kg/min (0,5–10,2) en UCI. Rocuronio 8–12 mcg/kg/min | **Cambiado (P-08)** |
| R-13 Indicación | ATS 2024: BNM en SDRA grave temprano (condicional) | **Cambiado (P-09)** |
| R-13 Precaución | Aminoesteroides + corticoides: riesgo de miopatía | **Añadido (P-10)** |
| R-14 Vasopresores | Práctica estándar, sin fuente primaria localizada | Sin cambio; pendiente |
| R-15 Ácido tranexámico | CRASH-2: 1 g en 10 min + 1 g en 8 h. PATCH-Trauma 2023: menor mortalidad a 24 h y 28 días sin cambio del desenlace funcional a 6 meses | Coincide |

## 2. Cambios en la app (v1.3.0)
| ID | Antes | Ahora |
|---|---|---|
| P-01 | Rocuronio 1,6 mg/kg en shock | 1,2 mg/kg en todos los estados; en shock, esperar 60–90 s |
| P-02 | — | Aviso de peso en obesidad (ficha: real; app: ajustado) |
| P-03 | Máx. 200 mg sin explicación | Máx. 200 mg rotulado como tope de seguridad de la app |
| P-04 | Contraindicación > 72 h | > 48 h (quemadura, aplastamiento, inmovilización, denervación, lesión medular) |
| P-05 | — | Dexmedetomidina sugerida para sedación ligera |
| P-06 | Ketamina coadyuvante 0,2 mg/kg/h (0,1–0,3) | 1 mcg/kg/min (1–2) |
| P-07 | Ketamina sedante 0,5 mg/kg/h (0,25–1,5) | 0,2 mg/kg/h (0,1–0,5), fuera de guía |
| P-08 | Rocuronio 0,5 mg/kg/h (0,3–0,7); cisatracurio 2 mcg/kg/min (1–5) | Rocuronio 8 mcg/kg/min (8–12); cisatracurio 3 mcg/kg/min (0,5–10) |
| P-09 | SDRA con PaO₂/FiO₂ < 150 | SDRA grave temprano (ATS 2024; < 150 en ensayos previos, < 100 en la guía 2024) |
| P-10 | — | Precaución aminoesteroide + corticoides |

## 3. Enlaces de los estudios y fichas
- Ficha Bridion (sugammadex), FDA 2022 — https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/022225Orig1s012lbl.pdf
- Ficha rocuronio (DailyMed) — https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=116385ea-69fc-4f44-b463-6210291032df
- Ficha succinilcolina (DailyMed) — https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1d4302db-a0d5-d0e8-e063-6294a90a22f8
- Ficha cisatracurio (DailyMed) — https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=23daa1f8-2a07-449d-97a6-11efdb0b9836
- Erstad BL, Barletta JF. Anaesth Intensive Care 2021 — https://doi.org/10.1177/0310057x20968573
- Casey JD et al. Ensayo RSI, ketamina vs etomidato. NEJM — https://www.nejm.org/doi/10.1056/NEJMoa2511420 (PubMed https://pubmed.ncbi.nlm.nih.gov/41369227/)
- Greer A et al. Crit Care Med 2025 — https://pubmed.ncbi.nlm.nih.gov/39570063/
- Koroki T et al. Crit Care 2024 — https://doi.org/10.1186/s13054-024-04831-4
- Kotani Y, Russotto V et al. Induction agents for tracheal intubation in critically ill patients. Crit Care Med 2025;53:e173–e181 (sin enlace verificado)
- Greenberg SM et al. AHA/ASA 2022, hemorragia intracerebral — https://doi.org/10.1161/STR.0000000000000407
- AHA/ASA 2026, ictus isquémico agudo — https://doi.org/10.1161/STR.0000000000000513
- Carney N et al. Brain Trauma Foundation, 4.ª ed. — https://doi.org/10.1227/NEU.0000000000001432
- AO Spine/Praxis 2024, hemodinamia en lesión medular — https://doi.org/10.1177/21925682231202348
- Sajdeya R et al. JAMA Netw Open 2025 — https://doi.org/10.1001/jamanetworkopen.2025.25364
- Devlin JW et al. PADIS 2018 — https://doi.org/10.1097/CCM.0000000000003299
- PADIS 2025, actualización focalizada — https://doi.org/10.1097/CCM.0000000000006574 (resumen SCCM: https://sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline)
- ATS 2024, guía de SDRA — https://doi.org/10.1164/rccm.202311-2011ST
- CRASH-2. Lancet 2010 — https://doi.org/10.1016/S0140-6736(10)60835-5
- PATCH-Trauma. NEJM 2023 — https://doi.org/10.1056/NEJMoa2215457
- Spahn DR et al. Guía europea de hemorragia en trauma, 5.ª ed. Crit Care 2019 — https://doi.org/10.1186/s13054-019-2347-3

## 4. Pendiente
- R-04 (vecuronio SIR), R-08 (fentanilo de pretratamiento) y R-14 (vasopresores): sin fuente primaria localizada.
- Lectura completa de los textos marcados "fuente identificada".
- Revisión independiente por especialista y prueba con casos clínicos simulados.
