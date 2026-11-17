'use strict';
/* ================= lectura ================= */
function read(){
 const fmt=[];
 const n=(id,key)=>{const x=parseNum($(id).value);if(!x.ok)fmt.push(key);return x.value};
 const p={esc:S.esc,sexo:S.sexo,edad:n('edad','edad'),w:n('peso','w'),h:n('talla','h'),pas:n('pas','pas'),pad:n('pad','pad'),fc:n('fc','fc'),spo2:n('spo2','spo2')};
 p._fmt=fmt;
 ['hta','dm','erc','hepa','hiperK','neuro','hm','mg','alRoc','alSucc','alSuga','alEtom','alKeta','alProp','alFent','pche','betab','potNMB','aco','anticoag','quem','via','acid'].forEach(k=>{const e=$(k);p[k]=e?e.checked:false});
 p.etomOk=ST.etomOk;p.rocOk=ST.rocOk;p.succOk=ST.succOk;
 ['tce','hemo','sci72','trombo','trauma','vaso','vd'].forEach(k=>{const e=$(k);p[k]=e?e.checked:false});
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
 let d=s; if(d==='estable'&&(p.esc==='ic'||p.esc==='sangra'||(p.esc==='poli'&&p.hemo)||p.esc==='sepsis'||p.esc==='iam'||p.edad>=75))d='riesgo';
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
 const p=pr(id),c=p.amt/p.vol,T=BOL_TARGET[id];
 const name=p.l;
 if(p.powder){ // polvo: cada vial se reconstituye con p.vol mL de agua estéril
  const n=Math.max(1,Math.ceil(dose/p.amt-1e-9));
  return {conc:c,u:p.u+'/mL',n,txt:`${plural(n,'vial','viales')} de ${p.amt} ${p.u}; reconstituir cada uno con ${p.vol} mL de agua estéril → ${r(c)} ${p.u}/mL.`};
 }
 if(T&&c>T*1.001){ // dilución en jeringa: se cargan mL enteros de la presentación y se completa con SSN hasta T
  const draw=Math.max(c,Math.ceil(dose/c-1e-9)*c), dv=draw/c, fv=draw/T, n=Math.max(1,Math.ceil(draw/p.amt-1e-9));
  return {conc:T,u:p.u+'/mL',n,draw,dv,fv,txt:`Cargar ${r(dv,'mL')} mL (${r(draw)} ${p.u}) de ${name} + ${r(fv-dv,'mL')} mL de SSN = ${r(fv,'mL')} mL a ${T} ${p.u}/mL (${plural(n,'ampolla','ampollas')}).`};
 }
 const n=Math.max(1,Math.ceil(dose/p.amt-1e-9));
 return {conc:c,u:p.u+'/mL',n,txt:`${plural(n,'ampolla','ampollas')} de ${name}, sin diluir (${r(c)} ${p.u}/mL).`};
}

/* ================= lógica clínica ================= */
/* ================= seguridad: contraindicaciones, precauciones e interacciones =================
   Tipos de aviso (cada uno con color, icono y texto propios; nunca solo color):
   ci   Contraindicación      → el fármaco se bloquea: no se muestra dosis ni puede ser 1.ª elección
   prec Precaución            → se puede usar con ajustes o vigilancia
   ev   Evidencia insuficiente → regla sin fuente primaria o sin validar
   nd   No disponible          → marcado como no disponible en Ajustes
   info Información            → dato de contexto, no cambia la decisión */
function succCI(p){
 const c=[];
 if(p.hiperK)c.push('hiperkalemia (K⁺ > 5,5)');
 if(p.hm)c.push('antecedente personal o familiar de hipertermia maligna');
 if(p.neuro)c.push('enfermedad neuromuscular o denervación');
 if(p.quem)c.push('quemadura, aplastamiento o inmovilización > 48 h');
 if(p.esc==='raqui'&&p.sci72)c.push('lesión medular > 48 h');
 return c;
}
/* Contraindicaciones por fármaco (ficha técnica): {id:[motivos]} */
function contraind(p){
 const C={};
 const s=succCI(p);if(s.length)C.succ=s;
 if(p.alRoc){C.roc=['alergia a rocuronio o vecuronio (aminoesteroides)'];C.vec=['alergia a rocuronio o vecuronio (aminoesteroides)'];}
 const al=(k,id)=>{if(p[k])(C[id]=C[id]||[]).push('alergia a '+NAMES[id].toLowerCase());};
 al('alSucc','succ');al('alSuga','suga');al('alEtom','etom');al('alKeta','keta');al('alProp','prop');al('alFent','fent');
 return C;
}
/* Precauciones e interacciones por fármaco: {id:[texto]} */
function drugPrec(p){
 const P={},add=(id,t)=>(P[id]=P[id]||[]).push(t);
 if(p.mg){add('roc','Miastenia gravis: sensibilidad aumentada; considera dosis menor y monitoriza TOF.');add('vec','Miastenia gravis: sensibilidad aumentada; monitoriza TOF.');add('succ','Miastenia gravis: respuesta impredecible (resistencia).');}
 if(p.potNMB){['roc','vec','cis'].forEach(k=>add(k,'Magnesio o aminoglucósidos en curso: potencian y prolongan el bloqueo (ficha técnica). Monitoriza TOF.'));}
 if(p.erc)add('succ','ERC: úsala solo con potasio normal reciente.');
 if(p.pche)add('succ','Déficit de pseudocolinesterasa: el bloqueo puede durar horas. Prefiere rocuronio; si se usa, prevé ventilación prolongada y no extubes sin TOF ≥ 0,9.');
 if(p.betab||(p.fc&&p.fc<60)){add('succ','Bradicardia o betabloqueador: atropina lista (bradicardia vagal).');add('fent','Bradicardia o betabloqueador: puede acentuar la bradicardia.');add('dex','Bradicardia o betabloqueador: alto riesgo de bradicardia grave.');}
 if(p.esc==='iam'||p.pas>=180)add('keta',p.esc==='iam'?'Isquemia miocárdica: aumenta FC, PA y consumo de O₂.':'PAS ≥ 180: puede elevar aún más la PA.');
 if(p.esc==='sepsis')add('etom','Sepsis: más supresión suprarrenal que con ketamina (sin diferencia de mortalidad).');
 if(p.erc)add('suga','ERC: ficha técnica no recomienda sugammadex con ClCr < 30 mL/min.');
 if(p.aco)add('suga','Anticonceptivo hormonal: sugammadex reduce su eficacia (equivale a olvidar una dosis); método de respaldo 7 días.');
 if(p.anticoag)add('suga','Anticoagulación: sugammadex prolonga transitoriamente el TTPa y el INR.');
 return P;
}
/* Motivo de las dosis de inductor (condición clínica que la determina). */
function doseWhy(p){
 if(p.state==='shock')return `shock: ${p.vaso&&p.esc==='sepsis'?'vasopresor en curso':[p.pas<90?'PAS < 90':'',p.pam<65?'PAM < 65':'',p.si&&p.si>=1?'IS ≥ 1':''].filter(Boolean).join(', ')}`;
 if(p.state==='riesgo')return `riesgo de hipotensión: ${[p.pas<100?'PAS < 100':'',p.si&&p.si>=0.8?'IS ≥ 0,8':''].filter(Boolean).join(', ')}`;
 if(p.doseState==='riesgo')return p.esc==='ic'?'falla cardiaca':p.esc==='sepsis'?'sepsis (colapso frecuente aunque la PA sea normal)':p.esc==='iam'?'infarto agudo de miocardio':p.esc==='sangra'?'hemorragia (la PA puede ser engañosamente normal)':(p.esc==='poli'&&p.hemo)?'hemorragia activa significativa':'edad ≥ 75 años';
 return 'hemodinamia estable';
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
  case 'otro':L.push(['etom','first','Menos hipotensión peri-intubación que la ketamina (ensayo RSI, NEJM 2026).'],['keta','alt','Alternativa válida; reducir dosis si hay shock o riesgo de hipotensión.'],st==='estable'&&p.doseState==='estable'?['prop','alt','Solo con hemodinamia estable: hipotensión dosis-dependiente.']:['prop','avoid','Riesgo de hipotensión con hemodinamia límite.']);break;
  default:L.push(['etom','first','Menos hipotensión peri-intubación que la ketamina (ensayo RSI, NEJM 2026).'],['keta','alt',p.tce?'Aceptable en TCE: no eleva la PIC de forma clínicamente relevante.':'Alternativa válida; reducir dosis si hay shock.'],['prop','avoid',p.hemo?'Colapso cardiovascular con hemorragia activa.':'Riesgo de hipotensión: en trauma el sangrado puede estar oculto aunque la PA sea normal.']);
 }
 return L;
}
function inductors(p){
 const C=contraind(p),base=inductorsBase(p),gone=[];
 let L=base.filter(x=>{const out=C[x[0]]||(x[0]==='etom'&&!p.etomOk);if(out)gone.push(x[0]);return !out;});
 if(!L.some(x=>x[1]==='first')&&gone.length){
  const first=base.find(x=>x[1]==='first');
  let i=L.findIndex(x=>x[0]==='keta'&&x[1]==='alt');if(i<0)i=L.findIndex(x=>x[1]==='alt');
  if(i>=0&&first){const why=`${NAMES[first[0]]} ${C[first[0]]?'contraindicado':'no disponible'}: `;const k=L.splice(i,1)[0];L.unshift([k[0],'first',why+(k[0]==='keta'?'ketamina a dosis ajustada a la hemodinamia. ':'')+k[2]]);}
 }
 gone.forEach(id=>L.push(C[id]?[id,'ci','Contraindicado por '+C[id].join('; ')+'.']:[id,'nd','Marcado como no disponible en Ajustes.']));
 return L;
}
function nmbList(p){
 const C=contraind(p),shock=p.state==='shock',L=[];
 const avail={roc:p.rocOk,succ:p.succOk,vec:true};
 const usable_=id=>avail[id]&&!C[id];
 const order=['roc','succ','vec'].filter(usable_);
 const first=order[0]||null;
 const role=id=>!avail[id]?'nd':C[id]?'ci':id===first?'first':'alt';
 const why={
  roc:(shock?'En shock se mantiene 1,2 mg/kg (techo de la ficha técnica): el gasto bajo retrasa el inicio, espera 60–90 s antes de la laringoscopia. ':'')+'Sin riesgo de hiperkalemia y más tiempo de apnea segura. Reversible con sugammadex 16 mg/kg (estudiado tras 1,2 mg/kg). SCCM 2023: sin diferencia de éxito frente a la succinilcolina; en un ECA prehospitalario (Guihard, JAMA 2019) el rocuronio no demostró no inferioridad.'+(p.obese?' Obesidad: la ficha indica peso real; la app usa peso ajustado (Erstad & Barletta 2021).':''),
  succ:(p.esc==='raqui'?'Segura en las primeras 48 h de la lesión medular. ':'')+'1 mg/kg (ESAIC 2023, 1B); rango de la ficha técnica 0,3–1,1 mg/kg. Inicio 45 s, duración 8–10 min.'+(p.obese?' Peso real; tope de seguridad de la app 200 mg (la ficha no fija máximo).':''),
  vec:(first==='vec'?'Sin rocuronio ni succinilcolina utilizables. ':'Respaldo ante desabastecimiento. ')+'Inicio lento (90–150 s con 0,15–0,2 mg/kg): ventila con presión positiva suave mientras tanto. Duración 60–90 min o más. Sugammadex solo está establecido para reversión de rutina guiada por TOF (2–4 mg/kg); la reversión inmediata con 16 mg/kg tras vecuronio no está establecida en ficha técnica.'
 };
 const D={roc:{k:1.2,r:'1–1.2',basis:BASIS.bolus.roc},succ:{k:1,r:'0.3–1.1',basis:BASIS.bolus.succ,max:200},vec:{k:0.15,r:'0.1–0.2',basis:BASIS.bolus.vec}};
 ['roc','succ','vec'].forEach(id=>{const ro=role(id);L.push(Object.assign({id,role:ro,why:ro==='ci'?'Contraindicado por '+C[id].join('; ')+'.':ro==='nd'?'Marcado como no disponible en Ajustes.':why[id]},D[id]));});
 L.sort((a,b)=>{const o={first:0,alt:1,ci:2,nd:3};return o[a.role]-o[b.role]});
 return {L,first};
}
function pretreat(p){
 if(p.state!=='estable')return null;
 if(p.esc==='ich'&&p.pas>=140)return {k:2,r:'1–3',why:'Atenúa la respuesta simpática (pico de PA y PIC) a la laringoscopia. Administrar lento, 3 min antes del inductor.'};
 if(p.esc==='poli'&&p.tce&&p.pas>=140)return {k:1,r:'1–2',why:'TCE con PA alta: atenúa el pico hipertensivo. Omitir si hay sospecha de sangrado oculto.'};
 if(p.esc==='iam'&&(p.pas>=140||(p.fc&&p.fc>=100)))return {k:1,r:'1–3',why:'Atenúa la taquicardia y la hipertensión de la laringoscopia, que aumentan el consumo miocárdico de O₂. Solo con PA estable; en shock se omite. Omitir si hay signos de bajo gasto.'};
 if(p.esc==='isq'&&p.trombo&&p.pas>=185)return {k:1,r:'0.5–1',why:'Candidato a reperfusión con PA ≥ 185/110: ayuda a no superar el umbral durante la laringoscopia.'};
 return null;
}
/* Cada meta o paso se devuelve como [texto, condición que lo activa]. */
function targets(p){
 const t=[],a=(x,c)=>t.push([x,c]);
 switch(p.esc){
  case 'poli':
   if(p.tce){const lim=(p.edad>=50&&p.edad<=69)?100:110;a(`PAS ≥ ${lim} mmHg; evitar SpO₂ < 90 % y PaCO₂ fuera de 35–45 mmHg (BTF 4.ª ed.). No aplicar hipotensión permisiva.`,`TCE asociado · edad ${p.edad} años`);}
   if(p.hemo&&!p.tce)a('Hipotensión permisiva: PAS 80–90 mmHg hasta el control del sangrado.','hemorragia activa significativa sin TCE');
   if(p.hemo)a('Hemoderivados en proporción 1:1:1 o sangre total en lugar de cristaloides (ATLS 11). Control del sangrado (cirugía, angioembolización, torniquete, pelvis).','hemorragia activa significativa');
   if(!p.hemo){if(!p.tce)a('PAM ≥ 65 mmHg; no aplicar hipotensión permisiva.','sin hemorragia activa significativa');a('Reevaluar sangrado oculto (tórax, abdomen, pelvis, huesos largos): una PA normal no lo descarta. Si aparece, marca "Hemorragia activa significativa".','politrauma sin hemorragia activa reconocida');}
   break;
  case 'raqui':a('PAM de al menos 75–80 mmHg, sin aumentarla activamente por encima de 90–95 mmHg, durante 3–7 días (AO Spine/Praxis 2024). Un ECA de 2025 (Sajdeya) no encontró mejor recuperación neurológica al elevar la PAM por encima de 85–90 y sí más complicaciones: evita la hipotensión sin forzar la PA.','lesión medular aguda');if(p.tce)a('PAS ≥ 110 mmHg.','TCE asociado');break;
  case 'sangra':a(p.trauma?'PAS 80–90 mmHg hasta el control quirúrgico o endoscópico.':'PAM ≥ 65 mmHg.',p.trauma?'hemorragia de origen traumático sin TCE':'hemorragia no traumática');a('Reanimar con hemoderivados antes de inducir siempre que sea posible.','paciente sangrando');break;
  case 'epoc':a('SpO₂ objetivo 88–92 %. Evitar hiperinsuflación dinámica (auto-PEEP).','EPOC');break;
  case 'ich':a('PAS objetivo 140 mmHg (rango 130–150). Evitar descensos < 130 mmHg (AHA/ASA 2022).','hemorragia intracerebral');a('PaCO₂ 35–45 mmHg; cabecera a 30°.','hemorragia intracerebral');break;
  case 'isq':
   if(p.trombo)a('PA < 185/110 antes de la trombólisis o la trombectomía y < 180/105 al menos 24 h tras la trombólisis. No bajar la PAS a < 140 mmHg: sin beneficio tras trombólisis y perjudicial en las primeras 72 h tras trombectomía exitosa (AHA/ASA 2026, sección 4.3).','candidato a reperfusión');
   else a('Con PA < 220/120 mmHg, bajarla en las primeras 48–72 h no mejora el pronóstico; con ≥ 220/120 o comorbilidad que lo exija (falla cardiaca aguda, disección aórtica), reducción inicial ≈ 15 % (AHA/ASA 2026).','sin reperfusión');
   a('Evitar hipotensión durante la inducción.','ictus isquémico');break;
  case 'ic':a('PAM ≥ 65 mmHg. Evitar hipoxemia e hipercapnia (empeoran la falla del VD).','falla cardiaca');break;
  case 'sepsis':a(p.edad>=65?'PAM inicial 60–65 mmHg (SSC 2026).':'PAM inicial 65 mmHg, con un margen de ± 5 mmHg (SSC 2026).',p.edad>=65?'sepsis · edad ≥ 65 años':'sepsis · edad < 65 años');a('Norepinefrina de primera línea; puede iniciarse por vía periférica sin esperar el catéter central. Añadir vasopresina cuando la norepinefrina llega a 0,25–0,5 mcg/kg/min; si la PAM sigue baja, epinefrina (SSC 2026).','choque séptico o hipoperfusión');a('Corticoides IV sugeridos (SSC 2026): pauta habitual hidrocortisona 200 mg/día (50 mg c/6 h), con o sin fludrocortisona. Antimicrobianos sin demora (idealmente en la primera hora) y control del foco.','choque séptico');break;
  case 'otro':a('PAM ≥ 65 mmHg; evitar hipotensión e hipoxemia durante la inducción. Define la meta específica según la causa.','escenario fuera de los validados');break;
  case 'iam':a('PAM ≥ 65 mmHg: evitar la hipotensión (perfusión coronaria) y también la taquicardia y la hipertensión (consumo de O₂).','infarto agudo de miocardio');a('Tras intubar, SpO₂ 92–96 % evitando la hiperoxia (el techo es práctica clínica). Antes de intubar, oxígeno solo con SpO₂ < 90 % (ACC/AHA 2025).','infarto agudo de miocardio');a('Revascularización urgente de la arteria culpable; asistencia circulatoria mecánica en casos seleccionados (ACC/AHA 2025). La intubación no debe retrasar la reperfusión.','shock cardiogénico');a('No intubar de forma profiláctica solo para el cateterismo. Si está inestable, intubar en hemodinamia con vasopresores y asistencia mecánica listos.','infarto agudo de miocardio');if(p.vd)a('Dependiente de precarga; evitar nitratos y PEEP alta.','compromiso de ventrículo derecho');break;
 }
 return t;
}

/* ================= preparación de infusiones ================= */
function infPrep(id,perKg,unit,lo,hi,basis,H){
 const p=pr(id),cfg=INF[id],W=wt(basis,P);
 const du=unit.startsWith('mcg')?'mcg':'mg';
 const f=du===p.u?1:(du==='mcg'?1/1000:1000);
 const ph=x=>(unit.endsWith('/min')?x*W.w*60:x*W.w)*f; // unidades de la presentación por hora
 const step=p.step||p.amt;                               // con step se toma una fracción de la ampolla (mL enteros)
 const need=ph(perKg)*H;
 const total=Math.max(step,Math.ceil(need/step-1e-9)*step);
 const nAmp=Math.ceil(total/p.amt-1e-9);
 const dvol=total/p.amt*p.vol;
 const minR=cfg.minRate||2, cap=cfg.cap||24;
 let Vf;
 if(cfg.pureOnly)Vf=dvol;
 else if(cfg.fixed){Vf=total/cfg.fixed[0];if(Vf>250)Vf=total/cfg.fixed[1];Vf=Math.max(Vf,dvol);} // una premezcla ya diluida no se vuelve a concentrar
 else{const c=(cfg.pure&&dvol<=50?[dvol]:[]).concat([50,100,250,500].filter(v=>v>=dvol));Vf=c.find(v=>ph(perKg)/(total/v)>=minR);if(Vf==null)Vf=c[c.length-1];} // sin diluir solo si cabe en una jeringa de 50 mL
 const conc=total/Vf, rate=x=>ph(x)/conc;
 const partial=total<nAmp*p.amt-1e-9;
 let src;
 if(partial)src=`Tomar ${r(dvol,'mL')} mL (${r(total)} ${p.u}) de ${p.l}`;
 else if(p.powder)src=`${plural(nAmp,'vial','viales')} de ${p.l}, cada uno reconstituido con ${p.vol} mL de agua estéril (${r(dvol,'mL')} mL)`;
 else src=`${plural(nAmp,'ampolla','ampollas')} de ${p.l} (${r(dvol,'mL')} mL)`;
 const dil=Vf-dvol, undil=dil<=0.05;
 const cTxt=(p.u==='mg'&&conc<0.1)?`${rc(conc*1000)} mcg/mL`:`${rc(conc)} ${p.u}/mL`;
 const nS=Math.ceil(Vf/50-1e-9);
 let cont;
 if(id==='prop')cont=`frasco con equipo ventilado (desechar a las 12 h)${Vf>50.05?` o ${nS} jeringas de 50 mL cargadas una tras otra`:' o jeringa de 50 mL'} (en jeringa, desechar a las 6 h)`;
 else if(Vf<=50.05)cont='jeringa de 50 mL';
 else if(!undil)cont=`bolsa de ${cfg.dil}, volumen final ${r(Vf,'mL')} mL`;
 else if(cfg.fixed)cont=`frascos premezclados infundidos directamente o ${nS} jeringas de 50 mL cargadas una tras otra`;
 else cont=`${nS} jeringas de 50 mL cargadas una tras otra`;
 const txt=`${src}${!undil?` + <b>${r(dil,'mL')} mL de ${cfg.dil}</b>`:', sin diluir'} = <b>${r(Vf,'mL')} mL</b> → ${cTxt} (${r(total)} ${p.u} en ${r(Vf,'mL')} mL). Recipiente: ${cont}.`;
 const dStart=Vf/rate(perKg);
 return {W,ph,rate,Vf,conc,cTxt,txt,cont,cap,overCap:dStart>cap+0.05,dStart,dMax:Vf/rate(hi),pu:p.u};
}
/* Hora de desecho si la mezcla se prepara ahora (hh:mm). */
function discardAt(h){try{const d=new Date(Date.now()+h*3600e3);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}catch(e){return ''}}
/* Avisos tipificados: icono + etiqueta + color; la condición que los activa se muestra siempre. */
const WN={ci:['⛔','Contraindicación'],prec:['⚠','Precaución'],ev:['?','Evidencia insuficiente'],nd:['⊘','No disponible'],info:['i','Información']};
function warn(w){const [k,t,c,lb2]=w,[ic,lb]=WN[k];return `<div class="wn wn-${k}" role="${k==='ci'?'alert':'note'}"><div class="wn-h"><span class="wn-i" aria-hidden="true">${ic}</span>${lb2||lb}</div><div class="wn-t">${t}${c?`<span class="cond">Condición: ${c}</span>`:''}</div></div>`;}
function infCard(id,title,perKg,unit,lo,hi,basis,extra){
 const H=M.H,o=infPrep(id,perKg,unit,lo,hi,basis,H);
 if(![o.Vf,o.conc,o.rate(perKg),o.rate(lo),o.rate(hi),o.dStart].every(usable))return calcErr(title);
 const doseH=x=>{const v=o.ph(x);return o.pu==='mg'&&v<1?`${r(v*1000)} mcg/h`:`${r(v)} ${o.pu}/h`};
 const capW=o.overCap?warn(['prec',`A la dosis de inicio la mezcla duraría ≈ ${r(o.dStart,'h')} h, más que su estabilidad (tope de la app: ${o.cap} h). Desecha el sobrante a las ${o.cap} h de preparada${discardAt(o.cap)?` (si se prepara ahora, a las ${discardAt(o.cap)})`:''}.`,`estabilidad de la mezcla > ${o.cap} h`]):'';
 return `<div class="drug first inf"><div class="hd"><span class="nm">${title}</span><span class="note">${o.cTxt}</span></div>
 <div class="rate">${r(o.rate(perKg),'mL')} mL/h</div>
 <div class="calc">Inicio ${perKg} ${unit} × ${r(o.W.w)} kg (${o.W.l}) = ${doseH(perKg)}<br>Rango ${lo}–${hi} ${unit} = <b>${r(o.rate(lo),'mL')}–${r(o.rate(hi),'mL')} mL/h</b></div>
 <div class="prep"><b>Preparación (${H} h):</b> ${o.txt}<br>Dura ≈ ${r(o.dStart,'h')} h a la dosis de inicio · ≈ ${r(o.dMax,'h')} h a la dosis máxima.</div>
 ${capW}${extra?`<div class="why">${extra}</div>`:''}${ruleTag(RULE_INF[id])}</div>`;
}

/* ================= plan ================= */
function prep(p){
 const t=[],a=(x,c)=>t.push([x,c]);
 a('Monitor, capnografía de onda, aspiración, videolaringoscopio + bougie, dispositivo supraglótico y equipo de cricotiroidotomía. Dos accesos IV.','todo paciente');
 if(p.esc==='raqui')a('Posición supina con inmovilización manual en línea; abrir la parte anterior del collar durante la laringoscopia.','lesión medular');
 else if(p.esc==='poli')a('Inmovilización cervical manual en línea si no se ha descartado lesión de columna.','politrauma');
 else a('Posición semi-Fowler o en rampa (conducto auditivo a nivel del esternón).','sin restricción de columna');
 if(p.esc==='epoc'||p.esc==='ic')a('Preoxigenación con VNI (CPAP/BiPAP, FiO₂ 100 %) 3–5 min; oxigenación apneica con cánula nasal.',p.esc==='epoc'?'EPOC':'falla cardiaca');
 else a('Preoxigenación con FiO₂ 100 % 3–5 min (VNI si hay hipoxemia); oxigenación apneica con cánula nasal.','todo paciente');
 const hem=p.esc==='sangra'||(p.esc==='poli'&&p.hemo), traum=(p.esc==='poli'&&p.hemo)||(p.esc==='sangra'&&p.trauma);
 if(hem)a(traum?'<b>Hemoderivados y control del sangrado primero, antes de inducir:</b> proporción 1:1:1 o sangre total en lugar de cristaloides; control del sangrado (cirugía, angioembolización, torniquete, pelvis). Si la lesión tiene < 3 h: ácido tranexámico 1 g IV en 10 min + 1 g en 8 h (CRASH-2).'+ruleTag('R-15'):'<b>Hemoderivados y control de la fuente de sangrado primero, antes de inducir</b> (endoscópico, intervencionista o quirúrgico).'+ruleTag('R-15'),traum?'hemorragia traumática':'hemorragia no traumática');
 if(p.state!=='estable'){
  const o=infPrep('nore',0.05,'mcg/kg/min',0.05,0.5,BASIS.inf.nore,M.H);
  const lead=hem?'<b>Coadyuvante, no sustituye a los hemoderivados:</b> norepinefrina solo ante hipotensión que amenaza la vida mientras se repone volumen.':'<b>Optimizar hemodinamia ANTES de inducir.</b>';
  a(`${lead} Norepinefrina 0.05 mcg/kg/min = <b>${r(o.rate(0.05),'mL')} mL/h</b>, titular 0.05–0.5 (${r(o.rate(0.05),'mL')}–${r(o.rate(0.5),'mL')} mL/h).<div class="prep"><b>Preparación:</b> ${o.txt}</div>`,hem?doseWhy(p)+' · hemorragia':doseWhy(p));
 }
 a('<b>EPINEFRINA PUSH-DOSE: 10–20 mcg (1–2 mL)</b> — preparar y tener a la mano. <div class="prep"><b>Preparación (dos jeringas de 10 mL, sin bolsa):</b> jeringa A: 1 mL de epinefrina 1 mg/1 mL + 9 mL de SSN = 10 mL a 100 mcg/mL. Jeringa B: 1 mL de la jeringa A + 9 mL de SSN = 10 mL a <b>10 mcg/mL</b>. Rotula B y desecha A.</div><div class="rescond"><b>CONDICIÓN DE ADMINISTRACIÓN:</b> administrar exclusivamente como medida de rescate ante hipotensión peri-intubación. No debe utilizarse de manera protocolaria ni como medicamento de administración rutinaria.</div>','rescate de hipotensión peri-intubación');
 if(p.esc==='raqui')a('Atropina 0.5–1 mg cargada (ampolla 1 mg/1 mL, sin diluir): bradicardia vagal por laringoscopia o aspiración'+(p.fc&&p.fc<60?' — <b>ya hay bradicardia</b>.':'.'),'lesión medular');
 if((p.betab||(p.fc&&p.fc<60))&&p.esc!=='raqui')a('Atropina 0.5–1 mg cargada (ampolla 1 mg/1 mL, sin diluir).',p.fc&&p.fc<60?`FC ${p.fc} lpm`:'betabloqueador');
 if(p.esc==='ic')a('Si PAS < 100: iniciar norepinefrina antes de inducir; considerar dobutamina si hay bajo gasto. En edema pulmonar hipertensivo, nitroglicerina antes (no después) de intubar.','falla cardiaca');
 if(p.esc==='sepsis')a('Si hay hipoperfusión: cristaloide balanceado, al menos 30 mL/kg en las primeras 3 h (recomendación condicional, certeza baja), guiado por la respuesta a volumen. Antimicrobianos y control del foco sin retrasarlos por la intubación.','sepsis con hipoperfusión');
 if(p.esc==='iam')a('Línea arterial antes de inducir si hay tiempo. Parches de desfibrilación colocados (arritmias ventriculares en la inducción). Si hay bajo gasto, añadir dobutamina a la norepinefrina. <b>No usar betabloqueadores ni esmolol en shock cardiogénico.</b> Antitrombóticos en curso: laringoscopia cuidadosa y evitar la vía nasal. Coordinar con hemodinamia.','infarto agudo de miocardio');
 if(p.esc==='ich'||p.esc==='isq')a('Antihipertensivo titulable preparado (labetalol 100 mg/20 mL o nicardipino si lo hay) y vasopresor: el objetivo es evitar picos y caídas.',p.esc==='ich'?'hemorragia intracerebral':'ictus isquémico');
 if(p.dm)a('Posible gastroparesia → mayor riesgo de aspiración; considerar SNG antes de la inducción. Glucemia capilar.','diabetes');
 if(p.hta)a('Respuesta hipertensiva exagerada a la laringoscopia y vasoplejía post-inducción (sobre todo con IECA/ARA-II).','HTA');
 return t;
}
/* Avisos del paciente: [tipo, texto, condición]. Las contraindicaciones por fármaco se listan aparte (ciSummary). */
function alerts(p){
 const a=[],w=(k,t,c)=>a.push([k,t,c]);
 if(p.state==='shock')w('prec',`<b>Riesgo alto de colapso y paro peri-intubación.</b> Dosis de inductor reducidas; vasopresor antes de inducir.`,doseWhy(p));
 else if(p.state==='riesgo')w('prec','Riesgo de hipotensión post-intubación. Dosis de inductor reducidas.',doseWhy(p));
 else if(p.doseState==='riesgo')w('prec','Dosis de inductor reducidas aunque la PA sea normal.',doseWhy(p));
 if(p.acid)w('prec','La apnea y la hipoventilación tras intubar pueden precipitar el paro. Mantén VNI hasta el último momento, minimiza el tiempo de apnea e iguala la ventilación minuto previa.','acidosis metabólica grave (pH < 7,2)');
 if(p.via)w('prec','Operador más experto, plan B y C verbalizados; considera intubación despierto si la fisiología lo permite.','vía aérea difícil anticipada');
 if(p.spo2!=null&&p.spo2<93)w('prec','Preoxigenación con VNI o alto flujo; desaturación rápida esperable.',`SpO₂ ${p.spo2} %`);
 if(p.esc==='raqui'&&p.fc&&p.fc<60&&p.pas<90)w('prec','Hipotensión + bradicardia: sugiere shock neurogénico (descartar hemorragia).',`PAS ${p.pas} y FC ${p.fc}`);
 if(p.mg)w('prec','Respuesta impredecible a los bloqueantes: resistencia a succinilcolina y sensibilidad aumentada a rocuronio y vecuronio. Monitorización TOF y sugammadex disponible.','miastenia gravis');
 if(p.potNMB)w('prec','Potencian y prolongan el bloqueo neuromuscular no despolarizante (ficha técnica de rocuronio). Monitoriza TOF antes de extubar.','sulfato de magnesio o aminoglucósidos en curso');
 if(p.aco)w('info','Si se usa sugammadex, la anticoncepción hormonal pierde eficacia: método de respaldo durante 7 días.','anticonceptivo hormonal');
 if(p.ibwClamped)w('ev',`El peso ideal calculado (${r(p.ibwRaw)} kg) es menor de 35 kg y se usa 35 kg. Regla sin validación clínica (H-17).`,'talla baja');
 if(p.obese)w('info',`Base de peso por fármaco. Bolos: ${basisTxt(BASIS.bolus)}. Infusiones: ${basisTxt(BASIS.inf)}. Bolos de bloqueante en UCI: el peso de su infusión.`,`IMC ${p.bmi.toFixed(1)}`);
 return a;
}
const WL={lbw:'peso magro',abw:'peso ajustado',ibw:'peso ideal',tbw:'peso real'};
function basisTxt(o){const G={};Object.keys(o).forEach(id=>(G[o[id]]=G[o[id]]||[]).push(NAMES[id].toLowerCase()));return Object.keys(G).map(b=>`${WL[b]} (${G[b].join(', ')})`).join('; ');}
/* Resumen de contraindicaciones y fármacos no disponibles para el plan (se muestra antes que todo lo demás). */
function ciSummary(p){
 const C=contraind(p),L=[];
 Object.keys(C).forEach(id=>L.push(['ci',`<b>${NAMES[id]}</b>: contraindicado. No se calcula dosis.`,C[id].join('; ')]));
 [['etom',p.etomOk],['roc',p.rocOk],['succ',p.succOk]].forEach(([id,ok])=>{if(!ok)L.push(['nd',`<b>${NAMES[id]}</b>: no disponible en tu servicio. La app usa la siguiente opción.`,'Ajustes → Disponibilidad']);});
 return L;
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
