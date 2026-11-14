'use strict';
/* Versión del algoritmo clínico y estado de validación (se muestra en la app). */
const ALG={version:'1.2.1',fecha:'2026-11-14',estado:'Experimental · sin validación clínica formal'};
/* Matriz científica (docs/MATRIZ-CIENTIFICA.md). Estado de verificación y aprobación de cada regla.
   No se inventan fuentes: "pendiente" significa que aún no se contrastó con la fuente primaria. */
const RULES={
 'R-01':{t:'Sugammadex 16 mg/kg: reversión inmediata solo tras rocuronio',f:'Ficha técnica Bridion (FDA rev. 11/2022; EMA)',v:'verificada',a:'Aprobada por el autor (médico) 2026-11-14'},
 'R-02':{t:'Rocuronio 1,2 mg/kg; 1,6 mg/kg en shock',f:'Fichas FDA rocuronio 2025–2026 (vía OpenEvidence): 0,6–1,2 mg/kg; 1,6 mg/kg sin respaldo (propuesta P-01)',v:'secundaria',a:'Pendiente'},
 'R-03':{t:'Succinilcolina 1,5 mg/kg (máx. 200 mg) y contraindicaciones',f:'Fichas FDA succinilcolina 2024–2026 (vía OpenEvidence); Erstad & Barletta 2021; tope y ventana en revisión (P-03, P-04)',v:'secundaria',a:'Pendiente'},
 'R-04':{t:'Vecuronio SIR 0,15 mg/kg (peso ideal)',f:'Práctica fuera de ficha; OpenEvidence 2026-11-14 sin fuente recuperada',v:'pendiente',a:'Pendiente'},
 'R-05':{t:'Etomidato 0,3 / 0,2 / 0,15 mg/kg según estado',f:'Casey et al. NEJM (ensayo RSI); Greer 2025; McDougall 2026; dosis reducidas por práctica clínica',v:'secundaria',a:'Pendiente'},
 'R-06':{t:'Ketamina 1,5 / 1 / 0,5 mg/kg según estado',f:'Casey et al. NEJM; Greer 2025; McDougall 2026; dosis reducidas por práctica clínica',v:'secundaria',a:'Pendiente'},
 'R-07':{t:'Propofol 1,5 / 1 / 0,5 mg/kg',f:'Kotani & Russotto 2025; dosis por práctica clínica',v:'secundaria',a:'Pendiente'},
 'R-08':{t:'Fentanilo de pretratamiento 1–3 mcg/kg',f:'Ko & Celmins 2024; Kareemi et al. 2023 (evidencia fisiológica y de expertos)',v:'secundaria',a:'Pendiente'},
 'R-09':{t:'Elección del inductor por escenario y hemodinamia',f:'Casey et al. NEJM; Greer 2025; McDougall 2026; Kotani & Russotto 2025; SCCM 2023',v:'secundaria',a:'Pendiente'},
 'R-10':{t:'Metas de PA por escenario',f:'AHA/ASA 2022 y 2026; BTF 4.ª ed.; AO Spine/Praxis 2024; consensos ESICM/SIBICC (textos primarios pendientes)',v:'secundaria',a:'Pendiente'},
 'R-11':{t:'Pesos de dosificación en obesidad (IMC ≥ 30)',f:'Erstad & Barletta 2021; ficha de rocuronio indica peso real (conflicto con la app, P-02)',v:'secundaria',a:'Pendiente'},
 'R-12':{t:'Rangos de analgesia y sedación en infusión',f:'PADIS 2018 y actualización 2025; Northam & Phillips 2024 (propuestas P-05 a P-07)',v:'secundaria',a:'Pendiente'},
 'R-13':{t:'Bloqueo neuromuscular en infusión',f:'Fichas FDA cisatracurio; Chang et al. 2020; guías de SDRA 2019/2024 (P-08 a P-10)',v:'secundaria',a:'Pendiente'},
 'R-14':{t:'Norepinefrina 0,05–0,5 mcg/kg/min; epinefrina en bolo 10–20 mcg',f:'Práctica estándar (OpenEvidence 2026-11-14, sin cita primaria)',v:'pendiente',a:'Pendiente'},
 'R-15':{t:'Ácido tranexámico en trauma < 3 h',f:'CRASH-2; guía europea de hemorragia 2019; PATCH-Trauma 2023',v:'secundaria',a:'Pendiente'},
 'R-16':{t:'Presentaciones disponibles en Colombia',f:'INVIMA (vecuronio verificado); MinSalud 2025',v:'parcial',a:'No aplica'}
};
const RULE_BOLUS={etom:'R-05',keta:'R-06',prop:'R-07',fent:'R-08',roc:'R-02',succ:'R-03',vec:'R-04',suga:'R-01'};
const RULE_INF={fent:'R-12',prop:'R-12',mida:'R-12',dex:'R-12',keta:'R-12',roc:'R-13',cis:'R-13',vec:'R-13',nore:'R-14'};
/* ================= PRESENTACIONES (Colombia) ================= */
const PRES={
 etom:[{l:'Etomidato 20 mg/10 mL',amt:20,vol:10,u:'mg'}],
 keta:[{l:'Ketamina 500 mg/10 mL (50 mg/mL)',amt:500,vol:10,u:'mg',step:50}],
 prop:[{l:'Propofol 1 % · 200 mg/20 mL',amt:200,vol:20,u:'mg'},{l:'Propofol 2 % · 1000 mg/50 mL',amt:1000,vol:50,u:'mg'}],
 fent:[{l:'Fentanilo 0,5 mg/10 mL (50 mcg/mL)',amt:500,vol:10,u:'mcg'}],
 mida:[{l:'Midazolam 50 mg/10 mL',amt:50,vol:10,u:'mg'},{l:'Midazolam 15 mg/3 mL',amt:15,vol:3,u:'mg'},{l:'Midazolam 5 mg/5 mL',amt:5,vol:5,u:'mg'}],
 dex:[{l:'Dexmedetomidina 200 mcg/2 mL',amt:200,vol:2,u:'mcg'}],
 roc:[{l:'Rocuronio 50 mg/5 mL',amt:50,vol:5,u:'mg'}],
 succ:[{l:'Succinilcolina 100 mg/2 mL',amt:100,vol:2,u:'mg'}],
 vec:[{l:'Vecuronio 10 mg polvo liofilizado',amt:10,vol:10,u:'mg',powder:true}],
 cis:[{l:'Cisatracurio 10 mg/5 mL',amt:10,vol:5,u:'mg'}],
 suga:[{l:'Sugammadex 200 mg/2 mL',amt:200,vol:2,u:'mg'}],
 nore:[{l:'Norepinefrina 4 mg/4 mL',amt:4,vol:4,u:'mg'}]
};
const SEL={prop:0,mida:0};
const pr=id=>PRES[id][SEL[id]||0];
// reglas de preparación de infusiones
const INF={
 fent:{pure:true,dil:'SSN 0,9 %'},
 prop:{pureOnly:true},
 mida:{dil:'SSN 0,9 %'},
 dex:{fixed:[4,8],dil:'SSN 0,9 %'},
 keta:{dil:'SSN 0,9 %'},
 roc:{pure:true,dil:'SSN 0,9 % o DAD 5 %'},
 cis:{pure:true,dil:'SSN 0,9 % o DAD 5 %'},
 vec:{dil:'SSN 0,9 %'},
 nore:{dil:'DAD 5 % o SSN 0,9 %',minRate:5}
};
var NAMES={etom:'Etomidato',keta:'Ketamina',prop:'Propofol',fent:'Fentanilo',roc:'Rocuronio',succ:'Succinilcolina',suga:'Sugammadex',mida:'Midazolam',dex:'Dexmedetomidina',cis:'Cisatracurio',vec:'Vecuronio',nore:'Norepinefrina'};
const ESC={poli:'Politraumatizado',raqui:'Trauma raquimedular',sangra:'Paciente sangrando',epoc:'EPOC',ich:'Ictus hemorrágico',isq:'Ictus isquémico',ic:'Falla cardiaca'};

