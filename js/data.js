'use strict';
/* Versión del algoritmo clínico y estado de validación (se muestra en la app). */
const ALG={version:'1.1.2',fecha:'2026-11-14',estado:'Experimental · sin validación clínica formal'};
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

