'use strict';
/* ================= lectura ================= */
function read(){
 const fmt=[];
 const n=(id,key)=>{const x=parseNum($(id).value);if(!x.ok)fmt.push(key);return x.value};
 const p={esc:S.esc,sexo:S.sexo,edad:n('edad','edad'),w:n('peso','w'),h:n('talla','h'),pas:n('pas','pas'),pad:n('pad','pad'),fc:n('fc','fc'),spo2:n('spo2','spo2')};
 p._fmt=fmt;
 ['hta','dm','erc','hepa','hiperK','neuro','quem','via','acid'].forEach(k=>p[k]=$(k).checked);
 p.etomOk=ST.etomOk;p.rocOk=ST.rocOk;p.succOk=ST.succOk;
 ['tce','sci72','trombo','trauma','vaso','vd'].forEach(k=>{const e=$(k);p[k]=e?e.checked:false});
 return p;
}
function derive(p){
 const hm=p.h/100; p.bmi=p.w/(hm*hm);
 const ibwRaw=(p.sexo==='M'?50:45.5)+0.9055*(p.h-152.4);
 p.ibwClamped=ibwRaw<35;p.ibwRaw=ibwRaw;
 p.ibw=Math.max(35,ibwRaw);
 p.lbw=p.sexo==='M'?9270*p.w/(6680+216*p.bmi):9270*p.w/(8780+244*p.bmi);
 p.abw=p.ibw+0.4*(p.w-p.ibw);
 p.obese=p.bmi>=30;
 p.pam=(p.pas+2*p.pad)/3;
 p.si=p.fc?p.fc/p.pas:null;
 let s='estable';
 if(p.pas<90||p.pam<65||(p.si&&p.si>=1))s='shock';
 else if(p.pas<100||(p.si&&p.si>=0.8))s='riesgo';
 if(p.esc==='sepsis'&&p.vaso)s='shock';
 p.state=s;
 let d=s; if(d==='estable'&&(p.esc==='ic'||p.esc==='sangra'||p.esc==='sepsis'||p.esc==='iam'||p.edad>=75))d='riesgo';
 p.doseState=d;
 return p;
}
function wt(basis,p){
 if(!p.obese||basis==='tbw')return {w:p.w,l:'peso real'};
 if(basis==='lbw')return {w:p.lbw,l:'peso magro'};
 if(basis==='abw')return {w:p.abw,l:'peso ajustado'};
 return {w:p.ibw,l:'peso ideal'};
}

/* ================= preparación de bolos ================= */
function bprep(id,dose){
 const p=pr(id);let n=Math.ceil(dose/p.amt-1e-9);n=Math.max(1,n);
 switch(id){
  case 'keta':{const load=Math.max(50,Math.ceil(dose/50-1e-9)*50),lm=load/50,fv=load/10;
   return {conc:10,u:'mg/mL',txt:`Cargar ${lm} mL (${load} mg) de ketamina 50 mg/mL + ${fv-lm} mL de SSN = ${fv} mL a 10 mg/mL.`};}
  case 'succ':return {conc:10,u:'mg/mL',txt:`${plural(n,'ampolla','ampollas')} de 100 mg/2 mL; diluir cada una con 8 mL de SSN → 10 mg/mL.`};
  case 'vec':return {conc:1,u:'mg/mL',txt:`${plural(n,'vial','viales')} de 10 mg; reconstituir cada uno con 10 mL de agua estéril → 1 mg/mL.`};
  default:{const c=p.amt/p.vol;return {conc:c,u:p.u+'/mL',txt:`${plural(n,'ampolla','ampollas')} de ${p.l.replace(/^\S+ /,'')}, sin diluir (${r(c)} ${p.u}/mL).`};}
 }
}

/* ================= lógica clínica ================= */
function succCI(p){
 const c=[];
 if(p.hiperK)c.push('hiperkalemia conocida');
 if(p.neuro)c.push('enfermedad neuromuscular / hipertermia maligna');
 if(p.quem)c.push('quemadura, aplastamiento, inmovilización o denervación > 48 h');
 if(p.esc==='raqui'&&p.sci72)c.push('lesión medular > 48 h');
 return c;
}
function indDose(id,p){
 const st=p.doseState;
 if(id==='etom')return st==='shock'?{k:0.15,r:'0.1–0.2'}:st==='riesgo'?{k:0.2,r:'0.15–0.2'}:{k:0.3,r:'0.2–0.3'};
 if(id==='keta')return st==='shock'?{k:0.5,r:'0.5–1'}:st==='riesgo'?{k:1,r:'0.5–1'}:{k:1.5,r:'1–2'};
 if(id==='prop'){ if(st!=='estable')return {k:0.5,r:'0.25–0.5'}; return p.edad>=65?{k:1,r:'0.5–1'}:{k:1.5,r:'1–2'}; }
}
function inductorsBase(p){
 const st=p.state,L=[];
 switch(p.esc){
  case 'epoc':
   if(st==='estable'&&p.doseState==='estable'){L.push(['keta','first','Broncodilatadora; útil en broncoespasmo y en hiperinsuflación dinámica.'],['etom','alt','Hemodinámicamente neutro: menos colapso cardiovascular que la ketamina en el ensayo RSI (NEJM 2025).'],['prop','alt','También broncodilatador; solo con PA estable.']);}
   else{L.push(['etom','first','Menor riesgo de hipotensión peri-intubación en paciente con hemodinamia límite.'],['keta','alt','Dosis reducida si predomina el broncoespasmo grave.'],['prop','avoid','Hipotensión sumada a la hiperinsuflación dinámica tras ventilar con presión positiva.']);}
   break;
  case 'ich':{
   const hyper=st==='estable'&&p.pas>=160;
   L.push(['etom','first','Neutro sobre la PA y la PIC; evita la hipotensión que reduce la presión de perfusión cerebral.']);
   if(hyper)L.push(['prop','alt','Atenúa el pico hipertensivo de la laringoscopia; riesgo de sobrecorrección: titula y ten vasopresor listo.']);
   L.push(['keta','alt','Ya no se considera contraindicada en hipertensión intracraneal; puede elevar la PA.']);
   if(!hyper)L.push(['prop','avoid','Hipotensión → caída de la presión de perfusión cerebral.']);
   break;}
  case 'isq':L.push(['etom','first','Preserva la PA: la penumbra isquémica depende de la presión de perfusión.'],['keta','alt','Alternativa; vigila la hipertensión si es candidato a trombólisis (< 185/110).'],['prop','avoid','La hipotensión empeora la penumbra isquémica.']);break;
  case 'ic':L.push(['etom','first','Mínima depresión miocárdica; usar dosis reducida.'],['keta','alt','Dosis baja; con catecolaminas agotadas puede actuar como depresor miocárdico directo.'],['prop','avoid','Vasodilatación e inotropismo negativo: alto riesgo de colapso.']);break;
  case 'sangra':L.push(['etom','first','Menos hipotensión peri-intubación que la ketamina (ensayo RSI, NEJM 2026).'],['keta','alt','Dosis reducida; preserva el tono simpático.'],['prop','avoid','Colapso cardiovascular en hipovolemia.']);break;
  case 'sepsis':L.push(['etom','first','En sepsis, el ensayo RSI mostró menos colapso cardiovascular que con ketamina (20,9 % vs 30,6 %) sin diferencia de mortalidad. Dosis reducida.'],['keta','alt','Mortalidad similar, pero más colapso en sepsis: dosis reducida y vasopresor en curso.'],['prop','avoid','Vasoplejía y depresión miocárdica en el choque séptico.']);break;
  case 'iam':L.push(['etom','first','Mínima depresión miocárdica y sin taquicardia: preserva la perfusión coronaria. Dosis reducida.'],['keta','alt','Eleva la FC y el consumo miocárdico de O₂; en shock cardiogénico puede deprimir el miocardio. Solo a dosis baja.'],['prop','avoid','La hipotensión reduce la presión de perfusión coronaria.']);break;
  case 'raqui':L.push(['etom','first','Estabilidad hemodinámica ante el riesgo de shock neurogénico.'],['keta','alt','Alternativa con dosis según hemodinamia.'],['prop','avoid','Potencia la vasoplejía del shock neurogénico.']);break;
  default:L.push(['etom','first','Menos hipotensión peri-intubación que la ketamina (ensayo RSI, NEJM 2026).'],['keta','alt',p.tce?'Aceptable en TCE: no eleva la PIC de forma clínicamente relevante.':'Alternativa válida; reducir dosis si hay shock.'],['prop','avoid','Hipotensión en trauma con pérdida sanguínea oculta.']);
 }
 return L;
}
function inductors(p){
 let L=inductorsBase(p);
 if(!p.etomOk){
  L=L.filter(x=>x[0]!=='etom');
  if(!L.some(x=>x[1]==='first')){const i=L.findIndex(x=>x[0]==='keta');if(i>=0){L[i]=['keta','first','<b>Etomidato no disponible:</b> ketamina a dosis ajustada a la hemodinamia. '+L[i][2]];const k=L.splice(i,1)[0];L.unshift(k);}}
 }
 return L;
}
function nmbList(p){
 const ci=succCI(p),shock=p.state==='shock',L=[];
 const succUse=p.succOk&&!ci.length;
 if(p.rocOk)L.push({id:'roc',role:'first',k:1.2,r:'1–1.2',basis:'abw',why:(shock?'En shock se mantiene 1,2 mg/kg (techo de la ficha técnica): el gasto bajo retrasa el inicio, espera 60–90 s antes de la laringoscopia. ':'')+'Sin riesgo de hiperkalemia y más tiempo de apnea segura. Reversible con sugammadex 16 mg/kg (estudiado tras 1,2 mg/kg). SCCM 2023: sin diferencia de éxito frente a la succinilcolina; en un ECA prehospitalario (Guihard, JAMA 2019) el rocuronio no demostró no inferioridad.'+(p.obese?' Obesidad: la ficha indica peso real; la app usa peso ajustado (Erstad & Barletta 2021).':'')});
 if(succUse)L.push({id:'succ',role:p.rocOk?'alt':'first',k:1,r:'0.3–1.1',basis:'tbw',max:200,why:(p.esc==='raqui'?'Segura en las primeras 48 h de la lesión medular. ':'')+(p.erc?'<b>ERC: úsala solo con potasio normal reciente.</b> ':'')+'1 mg/kg (ESAIC 2023, 1B); rango de la ficha técnica 0,3–1,1 mg/kg. Inicio 45 s, duración 8–10 min.'+(p.obese?' Peso real; tope de seguridad de la app 200 mg (la ficha no fija máximo).':'')});
 const vecFirst=!p.rocOk&&!succUse;
 L.push({id:'vec',role:vecFirst?'first':'alt',k:0.15,r:'0.1–0.2',basis:'ibw',why:(vecFirst?'<b>Sin rocuronio ni succinilcolina utilizables.</b> ':'Respaldo ante desabastecimiento. ')+'Inicio lento (90–150 s con 0,15–0,2 mg/kg): ventila con presión positiva suave mientras tanto. Duración 60–90 min o más. <b>Sugammadex solo está establecido para reversión de rutina guiada por TOF (2–4 mg/kg); la reversión inmediata con 16 mg/kg tras vecuronio no está establecida en ficha técnica.</b>'});
 const notes=[];
 if(ci.length)notes.push(`Succinilcolina <b>contraindicada</b> por ${ci.join('; ')}.`);
 else if(!p.succOk)notes.push('Succinilcolina no disponible en tu servicio.');
 if(!p.rocOk)notes.push('Rocuronio no disponible en tu servicio.');
 return {L,notes};
}
function pretreat(p){
 if(p.state!=='estable')return null;
 if(p.esc==='ich'&&p.pas>=140)return {k:2,r:'1–3',why:'Atenúa la respuesta simpática (pico de PA y PIC) a la laringoscopia. Administrar lento, 3 min antes del inductor.'};
 if(p.esc==='poli'&&p.tce&&p.pas>=140)return {k:1,r:'1–2',why:'TCE con PA alta: atenúa el pico hipertensivo. Omitir si hay sospecha de sangrado oculto.'};
 if(p.esc==='iam'&&(p.pas>=140||(p.fc&&p.fc>=100)))return {k:1,r:'1–3',why:'Atenúa la taquicardia y la hipertensión de la laringoscopia, que aumentan el consumo miocárdico de O₂. Solo con PA estable; en shock se omite. Omitir si hay signos de bajo gasto.'};
 if(p.esc==='isq'&&p.trombo&&p.pas>=185)return {k:1,r:'0.5–1',why:'Candidato a reperfusión con PA ≥ 185/110: ayuda a no superar el umbral durante la laringoscopia.'};
 return null;
}
function targets(p){
 const t=[];
 switch(p.esc){
  case 'poli':
   if(p.tce){const lim=(p.edad>=50&&p.edad<=69)?100:110;t.push(`TCE: PAS ≥ ${lim} mmHg; evitar SpO₂ < 90 % y PaCO₂ fuera de 35–45 mmHg.`);}
   else t.push('Sin TCE: hipotensión permisiva (PAS 80–90 mmHg) hasta el control del sangrado.');
   t.push('Hemoderivados en proporción 1:1:1 / sangre total en lugar de cristaloides (ATLS 11).');break;
  case 'raqui':t.push('PAM de al menos 75–80 mmHg, sin aumentarla activamente por encima de 90–95 mmHg, durante 3–7 días (AO Spine/Praxis 2024). Un ECA de 2025 (Sajdeya) no encontró mejor recuperación neurológica al elevar la PAM por encima de 85–90 y sí más complicaciones: evita la hipotensión sin forzar la PA.');if(p.tce)t.push('TCE asociado: PAS ≥ 110 mmHg.');break;
  case 'sangra':t.push(p.trauma?'Hemorragia traumática sin TCE: PAS 80–90 mmHg hasta el control quirúrgico/endoscópico.':'Hemorragia no traumática: PAM ≥ 65 mmHg.');t.push('Reanimar con hemoderivados antes de inducir siempre que sea posible.');break;
  case 'epoc':t.push('SpO₂ objetivo 88–92 %. Evitar hiperinsuflación dinámica (auto-PEEP).');break;
  case 'ich':t.push('PAS objetivo 140 mmHg (rango 130–150). Evitar descensos < 130 mmHg (AHA/ASA 2022).');t.push('PaCO₂ 35–45 mmHg; cabecera a 30°.');break;
  case 'isq':
   if(p.trombo)t.push('Reperfusión: PA < 185/110 antes de la trombólisis o la trombectomía y < 180/105 al menos 24 h tras la trombólisis. No bajar la PAS a < 140 mmHg: sin beneficio tras trombólisis y perjudicial en las primeras 72 h tras trombectomía exitosa (AHA/ASA 2026, sección 4.3).');
   else t.push('Sin reperfusión: con PA < 220/120 mmHg, bajarla en las primeras 48–72 h no mejora el pronóstico; con ≥ 220/120 o comorbilidad que lo exija (falla cardiaca aguda, disección aórtica), reducción inicial ≈ 15 % (AHA/ASA 2026).');
   t.push('Evitar hipotensión durante la inducción.');break;
  case 'ic':t.push('PAM ≥ 65 mmHg. Evitar hipoxemia e hipercapnia (empeoran la falla del VD).');break;
  case 'sepsis':t.push(p.edad>=65?'PAM inicial 60–65 mmHg en ≥ 65 años (SSC 2026).':'PAM inicial 65 mmHg, con un margen de ± 5 mmHg (SSC 2026).');t.push('Norepinefrina de primera línea; puede iniciarse por vía periférica sin esperar el catéter central. Añadir vasopresina cuando la norepinefrina llega a 0,25–0,5 mcg/kg/min; si la PAM sigue baja, epinefrina (SSC 2026).');t.push('Corticoides IV sugeridos en choque séptico (SSC 2026): pauta habitual hidrocortisona 200 mg/día (50 mg c/6 h), con o sin fludrocortisona. Antimicrobianos sin demora (idealmente en la primera hora) y control del foco.');break;
  case 'iam':t.push('PAM ≥ 65 mmHg: evitar la hipotensión (perfusión coronaria) y también la taquicardia y la hipertensión (consumo de O₂).');t.push('Tras intubar, SpO₂ 92–96 % evitando la hiperoxia (el techo es práctica clínica). Antes de intubar, oxígeno solo con SpO₂ < 90 % (ACC/AHA 2025).');t.push('Shock cardiogénico: revascularización urgente de la arteria culpable; asistencia circulatoria mecánica en casos seleccionados (ACC/AHA 2025). La intubación no debe retrasar la reperfusión.');t.push('No intubar de forma profiláctica solo para el cateterismo. Si está inestable, intubar en hemodinamia con vasopresores y asistencia mecánica listos.');if(p.vd)t.push('Compromiso de VD: dependiente de precarga; evitar nitratos y PEEP alta.');break;
 }
 return t;
}

/* ================= preparación de infusiones ================= */
function infPrep(id,perKg,unit,lo,hi,basis,H){
 const p=pr(id),cfg=INF[id],W=wt(basis,P);
 const du=unit.startsWith('mcg')?'mcg':'mg';
 const f=du===p.u?1:(du==='mcg'?1/1000:1000);
 const ph=x=>(unit.endsWith('/min')?x*W.w*60:x*W.w)*f; // unidades de la presentación por hora
 const step=p.step||p.amt;
 const need=ph(perKg)*H;
 const total=Math.max(step,Math.ceil(need/step-1e-9)*step);
 const nAmp=Math.ceil(total/p.amt-1e-9);
 const dvol=total/p.amt*p.vol;
 const minR=cfg.minRate||2;
 let Vf;
 if(cfg.pureOnly)Vf=dvol;
 else if(cfg.fixed){Vf=total/cfg.fixed[0];if(Vf>250)Vf=total/cfg.fixed[1];}
 else{const c=(cfg.pure?[dvol]:[]).concat([50,100,250,500].filter(v=>v>=dvol));Vf=c.find(v=>ph(perKg)/(total/v)>=minR);if(Vf==null)Vf=c[c.length-1];}
 const conc=total/Vf, rate=x=>ph(x)/conc;
 const partial=total<nAmp*p.amt-1e-9;
 let src;
 if(partial)src=`Tomar ${r(dvol,'mL')} mL (${r(total)} ${p.u}) de ${p.l}`;
 else if(p.powder)src=`${plural(nAmp,'vial','viales')} de ${p.l}, cada uno reconstituido con ${p.vol} mL de agua estéril (${r(dvol,'mL')} mL)`;
 else src=`${plural(nAmp,'ampolla','ampollas')} de ${p.l} (${r(dvol,'mL')} mL)`;
 const dil=Vf-dvol;
 const cTxt=(p.u==='mg'&&conc<0.1)?`${r(conc*1000)} mcg/mL`:`${r(conc)} ${p.u}/mL`;
 const txt=`${src}${dil>0.05?` + <b>${r(dil,'mL')} mL de ${cfg.dil}</b>`:', sin diluir'} = <b>${r(Vf,'mL')} mL</b> → ${cTxt}.`;
 return {W,ph,rate,Vf,conc,cTxt,txt,dStart:Vf/rate(perKg),dMax:Vf/rate(hi),pu:p.u};
}
function infCard(id,title,perKg,unit,lo,hi,basis,extra){
 const H=M.H,o=infPrep(id,perKg,unit,lo,hi,basis,H);
 if(![o.Vf,o.conc,o.rate(perKg),o.rate(lo),o.rate(hi),o.dStart].every(usable))return calcErr(title);
 const doseH=x=>{const v=o.ph(x);return o.pu==='mg'&&v<1?`${r(v*1000)} mcg/h`:`${r(v)} ${o.pu}/h`};
 return `<div class="drug first inf"><div class="hd"><span class="nm">${title}</span><span class="note">${o.cTxt}</span></div>
 <div class="rate">${r(o.rate(perKg),'mL')} mL/h</div>
 <div class="calc">Inicio ${perKg} ${unit} × ${r(o.W.w)} kg (${o.W.l}) = ${doseH(perKg)}<br>Rango ${lo}–${hi} ${unit} = <b>${r(o.rate(lo),'mL')}–${r(o.rate(hi),'mL')} mL/h</b></div>
 <div class="prep"><b>Preparación (${H} h):</b> ${o.txt}<br>Dura ≈ ${r(o.dStart,'h')} h a la dosis de inicio · ≈ ${r(o.dMax,'h')} h a la dosis máxima.</div>
 ${extra?`<div class="why">${extra}</div>`:''}${ruleTag(RULE_INF[id])}</div>`;
}

/* ================= plan ================= */
function prep(p){
 const a=[];
 a.push('Monitor, capnografía de onda, aspiración, videolaringoscopio + bougie, dispositivo supraglótico y equipo de cricotiroidotomía. Dos accesos IV.');
 if(p.esc==='raqui')a.push('Posición supina con inmovilización manual en línea; abrir la parte anterior del collar durante la laringoscopia.');
 else if(p.esc==='poli')a.push('Inmovilización cervical manual en línea si no se ha descartado lesión de columna.');
 else a.push('Posición semi-Fowler o en rampa (conducto auditivo a nivel del esternón).');
 if(p.esc==='epoc'||p.esc==='ic')a.push('Preoxigenación con VNI (CPAP/BiPAP, FiO₂ 100 %) 3–5 min; oxigenación apneica con cánula nasal.');
 else a.push('Preoxigenación con FiO₂ 100 % 3–5 min (VNI si hay hipoxemia); oxigenación apneica con cánula nasal.');
 if(p.state!=='estable'){
  const o=infPrep('nore',0.05,'mcg/kg/min',0.05,0.5,'abw',M.H);
  a.push(`<b>Optimizar hemodinamia ANTES de inducir.</b> Norepinefrina 0.05 mcg/kg/min = <b>${r(o.rate(0.05),'mL')} mL/h</b>, titular 0.05–0.5 (${r(o.rate(0.05),'mL')}–${r(o.rate(0.5),'mL')} mL/h).<div class="prep"><b>Preparación:</b> ${o.txt}</div>`);
 }
 a.push('Epinefrina push-dose 10–20 mcg (1–2 mL). <div class="prep"><b>Preparación:</b> 1 ampolla de epinefrina 1 mg/1 mL en 100 mL de SSN → 10 mcg/mL; cargar 10 mL en jeringa rotulada.</div>');
 if(p.esc==='poli'||p.esc==='sangra')a.push('Hemoderivados en curso. Si es trauma de < 3 h: ácido tranexámico 1 g IV en 10 min + 1 g en 8 h.');
 if(p.esc==='raqui')a.push('Atropina 0.5–1 mg cargada (ampolla 1 mg/1 mL, sin diluir): bradicardia vagal por laringoscopia o aspiración'+(p.fc&&p.fc<60?' — <b>ya hay bradicardia</b>.':'.'));
 if(p.esc==='ic')a.push('Si PAS < 100: iniciar norepinefrina antes de inducir; considerar dobutamina si hay bajo gasto. En edema pulmonar hipertensivo, nitroglicerina antes (no después) de intubar.');
 if(p.esc==='sepsis')a.push('Si hay hipoperfusión: cristaloide balanceado, al menos 30 mL/kg en las primeras 3 h (recomendación condicional, certeza baja), guiado por la respuesta a volumen. Antimicrobianos y control del foco sin retrasarlos por la intubación.');
 if(p.esc==='iam')a.push('Línea arterial antes de inducir si hay tiempo. Parches de desfibrilación colocados (arritmias ventriculares en la inducción). Si hay bajo gasto, añadir dobutamina a la norepinefrina. <b>No usar betabloqueadores ni esmolol en shock cardiogénico.</b> Antitrombóticos en curso: laringoscopia cuidadosa y evitar la vía nasal. Coordinar con hemodinamia.');
 if(p.esc==='ich'||p.esc==='isq')a.push('Antihipertensivo titulable preparado (labetalol 100 mg/20 mL o nicardipino si lo hay) y vasopresor: el objetivo es evitar picos y caídas.');
 if(p.dm)a.push('DM: posible gastroparesia → mayor riesgo de aspiración; considerar SNG antes de la inducción. Glucemia capilar.');
 if(p.hta)a.push('HTA: respuesta hipertensiva exagerada a la laringoscopia y vasoplejía post-inducción (sobre todo con IECA/ARA-II).');
 return a;
}
function alerts(p){
 const a=[];
 if(p.state==='shock')a.push(['bad',`Shock (PAS ${p.pas}, PAM ${Math.round(p.pam)}${p.si?', IS '+p.si.toFixed(2):''}): riesgo alto de paro peri-intubación. Dosis de inductor reducidas.`]);
 else if(p.state==='riesgo')a.push(['w','Riesgo de hipotensión post-intubación (PAS < 100 o IS ≥ 0.8). Dosis reducidas.']);
 if(p.doseState!==p.state&&p.state==='estable'){
  const why=p.esc==='ic'?'falla cardiaca':p.esc==='sepsis'?'sepsis (colapso frecuente aunque la PA sea normal)':p.esc==='iam'?'infarto agudo de miocardio':p.esc==='sangra'?'hemorragia (la PA puede ser engañosamente normal)':'edad ≥ 75 años';
  a.push(['w',`Dosis de inductor reducidas por ${why}.`]);
 }
 if(!p.fc)a.push(['i','Sin FC no se calcula el índice de shock: el riesgo hemodinámico puede estar subestimado.']);
 if(p.spo2!=null&&p.spo2<93)a.push(['w',`SpO₂ ${p.spo2} %: preoxigenación con VNI o alto flujo; desaturación rápida esperable.`]);
 if(p.esc==='raqui'&&p.fc&&p.fc<60&&p.pas<90)a.push(['bad','Hipotensión + bradicardia: sugiere shock neurogénico (descartar hemorragia).']);
 if(p.acid)a.push(['bad','Acidosis metabólica grave: la apnea y la hipoventilación tras intubar pueden precipitar el paro. Mantén VNI hasta el último momento, minimiza el tiempo de apnea e iguala la ventilación minuto previa.']);
 if(p.via)a.push(['w','Vía aérea difícil anticipada: operador más experto, plan B y C verbalizados, considera intubación despierto si la fisiología lo permite.']);
 if(p.ibwClamped)a.push(['w',`Talla baja: el peso ideal calculado (${r(p.ibwRaw)} kg) es menor de 35 kg y se usa 35 kg. Regla pendiente de validación clínica (H-17).`]);
 if(p.obese)a.push(['i',`IMC ${p.bmi.toFixed(1)}: dosis por peso magro (inductores, fentanilo), ajustado (rocuronio, infusiones) o ideal (vecuronio, cisatracurio); succinilcolina por peso real.`]);
 return a;
}
function vent(p){
 const v6=Math.round(p.ibw*6),v8=Math.round(p.ibw*8);
 const a=[`Volumen corriente 6–8 mL/kg de peso ideal: <b>${v6}–${v8} mL</b> (peso ideal ${r(p.ibw)} kg).`];
 if(p.acid)a.push('<b>Acidosis grave:</b> FR 24–30 inicial para igualar la compensación respiratoria previa; gasometría a los 15–30 min.');
 switch(p.esc){
  case 'epoc':a.push('FR 10–12, I:E 1:4–1:5, flujo inspiratorio alto, PEEP baja. Medir auto-PEEP y presión meseta (< 30).','Hipotensión tras intubar: desconectar del ventilador 20–30 s (hiperinsuflación) y reevaluar.');break;
  case 'ich':case 'isq':a.push('Normocapnia (PaCO₂ 35–45 mmHg); hiperventilación solo como puente en herniación.');break;
  case 'sepsis':a.push('Ventilación protectora: 6 mL/kg de peso ideal y presión meseta < 30 cmH₂O si hay SDRA; evitar la hiperventilación.');break;
  case 'iam':a.push('6–8 mL/kg de peso ideal; evitar la hipercapnia y la acidosis.',p.vd?'Compromiso de VD: la menor PEEP eficaz y volumen con prudencia; la presión positiva puede desplomar el gasto. Considerar vasodilatador pulmonar inhalado si está disponible.':'PEEP 5–8 cmH₂O (reduce la poscarga del VI); vigilar la caída de la precarga.');break;
  case 'ic':a.push('PEEP 5–8 cmH₂O (reduce la poscarga del VI); vigilar la caída de la precarga y la falla del VD.');break;
  case 'poli':if(p.tce)a.push('Normocapnia (PaCO₂ 35–45 mmHg).');break;
 }
 return a;
}

/* Tarjeta que sustituye a un resultado no calculable: nunca se muestra una dosis inválida. */
function calcErr(title){
 return `<div class="drug err" role="alert"><div class="hd"><span class="nm">${title}</span><span class="pill p-bad">No calculado</span></div><div class="why">El cálculo produjo un valor no válido (cero, negativo o indefinido). Revisa los datos del paciente y la presentación seleccionada en Ajustes.</div></div>`;
}

/* Etiqueta de trazabilidad: regla de la matriz científica, su estado y su aprobación (texto, no solo color). */
function ruleTag(id){
 const x=RULES[id];if(!x)return '';
 return `<div class="rule ${x.v==='verificada'?'ok':'pend'}"><b>${id}</b> · ${ruleSrc(x)} · Revisión ${ruleDate(x)}</div>`;
}
/* Estado de la fuente (texto) y fecha de revisión de la regla. La aprobación clínica se documenta en la matriz, no en pantalla. */
function ruleSrc(x){return x.v==='verificada'?'Fuente verificada':x.v==='parcial'?'Fuente verificada en parte':x.v==='secundaria'?'Fuente identificada; texto completo no revisado':'Fuente pendiente de verificar';}
function ruleDate(x){const m=/(\d{4})-(\d{2})-(\d{2})/.exec(x.r||x.a||'')||/(\d{4})-(\d{2})-(\d{2})/.exec(ALG.fecha);return `${m[3]}/${m[2]}/${m[1]}`;}
