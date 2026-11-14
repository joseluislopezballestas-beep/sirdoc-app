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
- Kotani Y, Russotto V. Induction agents for tracheal intubation in critically ill patients. Crit Care Med 2025 — https://pubmed.ncbi.nlm.nih.gov/39774207
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

### Referencias añadidas en v1.3.1 (aportadas por el autor)
Enlaces incorporados a la matriz; se retiraron los parámetros de rastreo de las URL. De estas fuentes no se revisó el texto completo.
- DeMasi SC, Casey JD, Semler MW. Evidence-based emergency tracheal intubation. AJRCCM 2025 (revisión) — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12264701/ · R-05, R-06, R-09
- Miner J. Ketamine, etomidate, and the outcomes that matter in emergency intubation. JAMA Netw Open 2025 — https://jamanetwork.com/journals/jamanetworkopen/fullarticle/10.1001/jamanetworkopen.2025.47966 · R-05, R-06
- Russotto V, Sorbello M. Airway management in critically ill patients. BJA Education 2025 — https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12365515/ · R-07, R-09
- McDougall G et al. Induction agents… network meta-analysis of RCTs. Chest 2026 — https://pubmed.ncbi.nlm.nih.gov/42612901 · R-05, R-06, R-07, R-09
- Casey JD et al. Ketamine or etomidate for tracheal intubation of critically ill adults. NEJM 2026 — https://doi.org/10.1056/NEJMoa2511420 · R-05, R-06, R-09
- Zampieri FG et al. Induction agents for emergency tracheal intubation… network meta-analysis. Crit Care 2026 — https://doi.org/10.1186/s13054-026-06067-w · R-05, R-06, R-09
- Andriazzi VH et al. Etomidate versus ketamine… updated meta-analysis. J Intensive Care Med 2026 — https://doi.org/10.1177/08850666261460825 · R-05, R-06
- Guihard B et al. Rocuronium vs succinylcholine in out-of-hospital RSI (ECA). JAMA 2019 — https://jamanetwork.com/journals/jama/fullarticle/10.1001/jama.2019.18254 · R-02, R-03 (nota añadida: el rocuronio no demostró no inferioridad)
- Grillot N et al. Remifentanil vs neuromuscular blockers during RSI (ECA). JAMA 2023 — https://jamanetwork.com/journals/jama/fullarticle/10.1001/jama.2022.23550 · R-02
- Ko CL, Celmins L. Pharmacology for RSI airway management in trauma patients. J Med Insight 2024 — https://jomi.com/article/pharmacology-for-rapid-sequence-intubation-(rsi)-airway-management-in-trauma-patients · R-03, R-08
- Gottlieb M et al. Airway management of adults in the acute care setting. BMJ 2026 — https://pubmed.ncbi.nlm.nih.gov/41951238 · R-09
- Accilien D et al. Airway management: techniques and equipment. J Med Insight 2024 — https://jomi.com/article/airway-management-techniques-and-equipment · R-09

Sin cambios de dosis en v1.3.1.

### Contraste de la guía AHA/ASA 2026 de ictus isquémico (v1.3.2)
Fuente: 2026 Guideline for the Early Management of Patients With Acute Ischemic Stroke. Stroke 2026;57(8):e316–e436 (publicada en línea el 26-01-2026; PubMed 41582814) — https://www.ahajournals.org/doi/10.1161/STR.0000000000000513. Se leyó la sección 4.3 (manejo de la PA), sus recomendaciones de clase 3 y el texto de apoyo.
| Punto | Guía | App antes | App ahora |
|---|---|---|---|
| Antes de la reperfusión | < 185/110 antes de trombólisis (protocolos de los ensayos) y antes de trombectomía (razonable) | < 185/110 antes de la trombólisis | Añade "o la trombectomía" |
| Tras trombólisis | < 180/105 (protocolos); PAS < 140 vs < 180: sin beneficio (COR 3, sin beneficio) | Coincide | Sin cambio de meta; se cita la clase |
| Tras trombectomía exitosa (mTICI 2b–3) | PAS < 140 en las primeras 72 h: perjudicial (COR 3, daño) | "No bajar a < 140 tras reperfusión" | Precisa 72 h y perjuicio |
| Sin reperfusión | PA < 220/120: bajarla en 48–72 h no mejora desenlaces; ≥ 220/120 o comorbilidad (falla cardiaca aguda, disección): reducción inicial del 15 % | "Reducir ≈ 15 % en 24 h" | Reducción inicial ≈ 15 %, con las comorbilidades |
| Hipotensión | Asociada a peor desenlace | Evitarla | Sin cambio |
Resultado: R-10 pasa a "verificada en parte" (ictus isquémico contrastado; HIC, TCE y lesión medular siguen identificados). Sin cambios de dosis.

### Verificación de guías de anestesiología aportadas por el autor (v1.3.3)
| Dato aportado | Verificación | Acción |
|---|---|---|
| ESAIC 2023 (Fuchs-Buder et al., Eur J Anaesthesiol 2023;40(2):82–94; https://doi.org/10.1097/EJA.0000000000001769) — R3: bloqueante rápido para SIR, succinilcolina 1 mg/kg o rocuronio 0,9–1,2 mg/kg (1B) | **Confirmado** (resumen publicado). También R1 relajante para intubar (1A), R2 menos lesión faríngea/laríngea (1C), R6 monitorización cuantitativa en aductor del pulgar (1B), R7 sugammadex para bloqueo por rocuronio/vecuronio (1A) | Citado en R-01, R-02 y R-03. Rocuronio 1,2 mg/kg dentro del rango |
| ESAIC: "disponibilidad inmediata de sugammadex en rescate CICO" | **No encontrado** en el resumen | No se atribuye a la guía; se añadió como práctica: tener sugammadex calculado y a mano |
| ESAIC: TOF ≥ 0,9 antes de extubar (1B) | **Parcial**: el umbral > 0,9 aparece en la recomendación sobre neostigmina (1C); 1B corresponde a la monitorización cuantitativa | Citado junto con ASA 2023 |
| ASA 2023 (Thilen et al., Anesthesiology 2023;138:13–41; https://doi.org/10.1097/ALN.0000000000004379) — monitorización cuantitativa sobre cualitativa, TOF ≥ 0,9 antes de extubar, sugammadex sobre neostigmina en bloqueo profundo, moderado y superficial por rocuronio/vecuronio | **Confirmado** (recomendaciones fuertes, evidencia moderada); neostigmina como alternativa razonable en bloqueo mínimo | Nota de extubación en Post-intubación; R-01 y R-13 |
| ASA 2022 vía aérea difícil (Apfelbaum et al., Anesthesiology 2022;136:31–81; https://doi.org/10.1097/ALN.0000000000004002) — oxígeno antes y durante todo el manejo, incluida la extubación; videolaringoscopio en vía aérea difícil prevista | **Confirmado** | La app ya lo hacía; se citó en R-09 y en la laringoscopia |
| ASA 2022: presión cricoidea no rutinaria / liberar si dificulta | **No contrastado** con el texto | Sin cambios en la app |
| S.C.A.R.E.: "Rincón-Valenzuela DA, et al. Entubación con inducción de secuencia rápida. Rev Colomb Anestesiol 2017;45(3):239–250" | **Referencia incorrecta**: ese volumen y esas páginas corresponden a Rubiano-Pinzón et al., currículo para sedación fuera del quirófano (https://doi.org/10.1016/j.rca.2017.02.006) | No se incluye |
| S.C.A.R.E. "adopta y armoniza explícitamente" ASA/ESAIC 2022–2026 | **No verificable**: no se encontró documento que lo afirme | No se incluye |
| Dosis de succinilcolina | ESAIC cita 1 mg/kg (contexto perioperatorio); ficha FDA 0,3–1,1 mg/kg; la app usaba 1,5 mg/kg | **Cambiado en v1.3.4 a 1 mg/kg por peso real** (rango mostrado 0,3–1,1), aprobado por Md. Jose Luis Lopez Ballestas (autor, médico) el 2026-11-14 |

### Escenarios nuevos: sepsis e infarto agudo de miocardio (v1.3.5)
Reglas nuevas R-17 y R-18. **Aprobadas por Md. Jose Luis Lopez Ballestas (autor, médico) el 2026-11-14** tras la revisión de evidencia de v1.3.6.

**Sepsis / choque séptico (R-17).** Fuentes: Surviving Sepsis Campaign 2026 (Prescott et al., Crit Care Med 2026; https://doi.org/10.1097/CCM.0000000000007089; https://www.sccm.org/survivingsepsiscampaign/guidelines/adult-patients) y ensayo RSI (Casey et al., NEJM).
| Elemento | Evidencia | En la app |
|---|---|---|
| Meta de PA | PAM inicial 65 mmHg (fuerte, certeza moderada), margen de ± 5 mmHg; 60–65 mmHg en ≥ 65 años (condicional, baja) | Igual, según la edad |
| Vasopresores | Norepinefrina de primera línea; inicio periférico sin esperar el catéter central; añadir vasopresina y luego epinefrina | Igual; norepinefrina antes de inducir si hay inestabilidad |
| Corticoides | IV sugeridos en choque séptico (condicional, baja) | Mencionado |
| Inductor | Ensayo RSI, subgrupo sepsis: colapso 30,6 % con ketamina vs 20,9 % con etomidato; mortalidad similar (38,8 % vs 38,2 %) | Etomidato de elección; ketamina alternativa a dosis reducida; propofol a evitar |
| Dosis | — | Mínimo nivel "riesgo" (dosis reducidas) aunque la PA sea normal; "Con vasopresor en curso" = shock |
| Ventilación | — | 6 mL/kg y meseta < 30 si hay SDRA |

**Infarto agudo de miocardio (R-18).** Fuente: 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for the Management of Patients With Acute Coronary Syndromes (Rao et al., Circulation 2025; https://doi.org/10.1161/CIR.0000000000001309; JACC https://doi.org/10.1016/j.jacc.2024.11.009).
| Elemento | Evidencia | En la app |
|---|---|---|
| Oxígeno | Solo con SpO₂ < 90 % | Titular FiO₂ a SpO₂ ≥ 90 % evitando hiperoxia |
| Shock cardiogénico | Revascularización urgente de la culpable; bomba de flujo microaxial en casos seleccionados | Mencionado; la intubación no debe retrasar la reperfusión |
| Inductor, PEEP, fentanilo 0,5–1 mcg/kg si PAS ≥ 140 | Sin ensayo específico en IAM: fisiología y práctica clínica | Etomidato reducido; ketamina solo a dosis baja; propofol a evitar; opción "Compromiso de VD" (PEEP baja, sin nitratos) |
| Preparación | Práctica clínica | Parches de desfibrilación, antitrombóticos en curso (evitar vía nasal), coordinación con hemodinamia |

### Revisión de evidencia y ajustes de Sepsis e IAM (v1.3.6)
Hallazgos que confirman la app: etomidato de elección en sepsis (ensayo RSI; Andriazzi 2026: sin diferencia de mortalidad en sepsis, más hipotensión con ketamina 14,2 % vs 11,3 %, más supresión suprarrenal con etomidato 14,7 % vs 5,3 %); metas y secuencia de vasopresores de SSC 2026; en IAM no hay ensayos de SIR específicos y todo se extrapola de pacientes críticos (McDougall 2026: más inestabilidad con ketamina).
| ID | Cambio aplicado | Fundamento |
|---|---|---|
| S-1 | Sepsis: sedación por defecto fentanilo + propofol a dosis baja; midazolam solo si no hay alternativa | Analgesia primero, evitar benzodiacepinas (PADIS) |
| S-2 | Cristaloide balanceado ≥ 30 mL/kg en 3 h si hay hipoperfusión | Recomendación condicional, certeza baja (Seymour, JAMA 2026) |
| S-3 | Hidrocortisona 200 mg/día (50 mg c/6 h), con o sin fludrocortisona | Pauta habitual de los corticoides sugeridos por SSC 2026 |
| S-4 | Vasopresina cuando la norepinefrina llega a 0,25–0,5 mcg/kg/min | Umbral habitual (Dubech, Crit Care 2026) |
| S-5 | Dosis reducidas con PA normal, rotuladas como práctica clínica | Sin ensayo; la PA normal no descarta el colapso |
| I-1 | Fentanilo 1–3 mcg/kg (inicio 1) con PAS ≥ 140 o FC ≥ 100 y PA estable; se omite en shock o con índice de shock ≥ 0,8; sin betabloqueadores ni esmolol en shock cardiogénico | Fisiología; práctica clínica |
| I-2 | Línea arterial antes de inducir si hay tiempo; dobutamina si hay bajo gasto | Jentzer, Crit Care Med 2023 |
| I-3 | SpO₂ 92–96 % tras intubar, sin hiperoxia | Oxígeno solo con SpO₂ < 90 % (ACC/AHA 2025); techo por práctica |
| I-4 | No intubar de forma profiláctica para el cateterismo; si inestable, en hemodinamia con vasopresores y asistencia listos | Revisiones de shock cardiogénico |
| I-5 | 6–8 mL/kg, evitar hipercapnia; VD: menor PEEP eficaz, volumen prudente, vasodilatador pulmonar inhalado | Práctica clínica (sin evidencia específica) |

Referencias añadidas: Srivilaithon, Sci Rep 2023 (https://doi.org/10.1038/s41598-023-33679-x); Seymour, JAMA 2026 (https://jamanetwork.com/journals/jama/fullarticle/10.1001/jama.2026.3793); Meyer & Prescott, NEJM 2024 (https://doi.org/10.1056/nejmra2403213); Dubech, Crit Care 2026 (https://doi.org/10.1186/s13054-026-06109-3); Jentzer, Crit Care Med 2023 (https://pubmed.ncbi.nlm.nih.gov/37184336); Kothari, J Cardiothorac Vasc Anesth 2026 (https://pubmed.ncbi.nlm.nih.gov/41807238).

### Presentaciones disponibles en Colombia (v1.4.0)
| Fármaco | Presentaciones en la app | Fuente |
|---|---|---|
| Rocuronio | 50 mg/5 mL | INVIMA 2024M-0021311 (https://webservice.invima.gov.co/registros/pdf/16500728_2024005848.pdf) |
| Vecuronio | 10 mg polvo | INVIMA 2024M-0021267 (https://webservice.invima.gov.co/registros/pdf/16508906_2024003846.pdf) |
| Midazolam | 50 mg/10 mL, 15 mg/3 mL, 5 mg/5 mL | MinSalud 2025, inyectables de UCI (https://www.minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/VS/MET/20250826-mesa-trabajo-medicamentos-inyectables-uci.pdf) |
| Fentanilo | 0,5 mg/10 mL; 0,1 mg/2 mL | MinSalud 2025; registros INVIMA (Fentanex) |
| Cisatracurio | 10 mg/5 mL | MinSalud 2025 (Vitalis) |
| Succinilcolina | 100 mg/2 mL; 1 g/10 mL; 20 mg/mL (vital no disponible) | MinSalud 2025; INVIMA, vitales no disponibles (https://www.invima.gov.co/biblioteca/preview/122790) |
| Dexmedetomidina | 200 mcg/2 mL; premezclas 200 mcg/50 mL y 400 mcg/100 mL | Documento local Precedex Colombia (https://labeling.pfizer.com/ShowLabeling.aspx?id=11927) |
| Sugammadex | 200 mg/2 mL; 500 mg/5 mL | Ficha de producto (2 y 5 mL a 100 mg/mL) |
| Etomidato, ketamina, propofol, norepinefrina | Sin cambios | MinSalud 2025 (etomidato desabastecido) |
Cada fármaco admite "Otra presentación" dentro de un rango de concentración plausible; fuera de él la app la rechaza.

## 4. Pendiente
- R-04 (vecuronio SIR), R-08 (fentanilo de pretratamiento) y R-14 (vasopresores): sin fuente primaria localizada.
- Lectura completa de los textos marcados "fuente identificada".
- Revisión independiente por especialista y prueba con casos clínicos simulados.
