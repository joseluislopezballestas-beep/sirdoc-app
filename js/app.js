'use strict';
/* ================= portada ================= */
(function intro(){
 const el=document.getElementById('intro');if(!el)return;
 const hide=()=>{if(el.classList.contains('out'))return;el.classList.add('out');setTimeout(()=>el.remove(),600)};
 el.addEventListener('click',hide);setTimeout(hide,2700);
})();
/* ================= estado y utilidades ================= */
const $=id=>document.getElementById(id);
let S={esc:null,sexo:'M'};
let P=null;
const KEY='sirdoc.v1';
const ST=Object.assign({etomOk:true,rocOk:true,succOk:true,prop:0,mida:0,H:8,disc:false},load());
let M={ind:null,nmb:null,anal:'fent',sed:null,adj:false,bnm:'none',H:ST.H};
SEL.prop=ST.prop;SEL.mida=ST.mida;

function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
let tt;function toast(t,ms){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),ms||1800)}
const esc2=s=>s; // contenido propio, sin datos externos

/* ================= bolos ================= */
function bcalc(id,k,opts={}){
 const basis=opts.basis||(id==='succ'||id==='suga'?'tbw':id==='roc'?'abw':id==='vec'?'ibw':'lbw');
 const W=wt(basis,P),unit=id==='fent'?'mcg':'mg';
 let dose=k*W.w,capped=false;if(opts.max&&dose>opts.max){dose=opts.max;capped=true}
 dose=roundDose(dose);
 const bp=bprep(id,dose);
 const c={id,k,W,unit,dose,capped,bp,vol:dose/bp.conc,max:opts.max};
 c.ok=[k,W.w,dose,bp.conc,c.vol].every(usable);
 return c;
}
function bolus(id,k,range,role,why,opts={}){
 const tag=role==='first'?'<span class="pill p-ok">1.ª elección</span>':role==='alt'?'<span class="pill p-mut">Alternativa</span>':'<span class="pill p-bad">Evitar</span>';
 if(role==='avoid')return `<div class="drug avoid"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div><div class="why">${why}</div></div>`;
 const c=bcalc(id,k,opts);
 if(!c.ok)return calcErr(NAMES[id]);
 return `<div class="drug ${role}"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div>
 <div class="dose">${r(c.dose)} ${c.unit} <small>· ${r(c.vol,'mL')} mL de ${r(c.bp.conc)} ${c.bp.u}</small></div>
 <div class="calc">${k} ${c.unit}/kg × ${r(c.W.w)} kg (${c.W.l}) · rango ${range}${c.capped?` · máx. ${c.max} ${c.unit}`:''}</div>
 <div class="prep">${c.bp.txt}</div>
 <div class="why">${why}</div>${ruleTag(RULE_BOLUS[id])}</div>`;
}
function syrRow(label,c){
 if(!c.ok)return `<div class="row"><div class="k">${label}</div><div class="v">—</div><div class="n">${NAMES[c.id]} <span class="pill p-bad">No calculado</span></div></div>`;
 return `<div class="row"><div class="k">${label}</div><div class="v">${r(c.dose)} ${c.unit}<small>${r(c.vol,'mL')} mL</small></div>
 <div class="n">${NAMES[c.id]} <span class="calc">${c.k} ${c.unit}/kg</span></div></div>`;
}

/* ================= plan ================= */
function renderPlan(){
 const p=P,pre=pretreat(p),ind=inductors(p),nm=nmbList(p);
 const st=p.state==='shock'?'<span class="pill p-bad">Shock</span>':p.state==='riesgo'?'<span class="pill p-warn">Riesgo de hipotensión</span>':'<span class="pill p-ok">Estable</span>';
 const i1=ind.find(x=>x[1]==='first'),d1=indDose(i1[0],p),n1=nm.L.find(x=>x.role==='first');
 const cI=bcalc(i1[0],d1.k),cN=bcalc(n1.id,n1.k,{basis:n1.basis,max:n1.max});
 let h=expBanner()+`<div class="title"><h2>${ESC[p.esc]}${p.tce?' + TCE':''}</h2>${st}</div>
 <div class="strip">
  <div class="chip"><b>${p.w}</b>kg real</div><div class="chip"><b>${r(p.ibw)}</b>kg ideal</div>
  ${p.obese?`<div class="chip"><b>${r(p.lbw)}</b>kg magro</div>`:''}
  <div class="chip"><b>${p.bmi.toFixed(1)}</b>IMC</div><div class="chip"><b>${Math.round(p.pam)}</b>PAM</div>
  <div class="chip"><b>${p.si?p.si.toFixed(2):'–'}</b>Índ. shock</div>
 </div>
 <div class="syr">
  ${pre?syrRow('Pretratamiento · T −3 min',bcalc('fent',pre.k)):''}
  ${syrRow('Inducción · T 0',cI)}
  ${syrRow('Bloqueo NM · T 0 +',cN)}
  <div class="row"><div class="k">Vasopresor en bolo · a la mano</div><div class="v">10–20 mcg<small>1–2 mL</small></div><div class="n">Epinefrina <span class="calc">10 mcg/mL</span></div></div>
 </div>`;
 const LBL={bad:'Riesgo alto',w:'Precaución',i:'Información'};
 alerts(p).forEach(a=>h+=`<div class="alert ${a[0]==='bad'?'':a[0]}"><b class="lbl">${LBL[a[0]]}:</b> ${a[1]}</div>`);
 h+=`<div class="sec"><h3>Metas</h3><ul class="t">${targets(p).map(x=>`<li>${x}</li>`).join('')}</ul>${ruleTag('R-10')}</div>`;

 const step=(tm,title,body,open)=>`<details class="step"${open?' open':''}><summary><span class="tm">${tm}</span>${title}</summary><div class="body">${body}</div></details>`;
 h+=`<div class="sec"><h3>Secuencia</h3>`;
 h+=step('T −10 min','Preparación y optimización',`<ul class="t">${prep(p).map(x=>`<li>${x}</li>`).join('')}</ul>`);
 h+=step('T −5 min','Preoxigenación','<div class="note">3–5 min con FiO₂ 100 % (u 8 respiraciones a capacidad vital). Oxigenación apneica con cánula nasal durante la laringoscopia.</div>');
 h+=step('T −3 min','Pretratamiento',pre?bolus('fent',pre.k,pre.r,'first',pre.why):'<div class="note">No indicado en este contexto (riesgo de hipotensión). La lidocaína no se recomienda de rutina.</div>');
 h+=step('T 0','Inducción · opciones',ind.map(x=>{const d=indDose(x[0],p);return bolus(x[0],d.k,d.r,x[1],x[2]);}).join('')+ruleTag('R-09'));
 h+=step('T 0 +','Bloqueo neuromuscular · opciones',nm.L.map(x=>bolus(x.id,x.k,x.r,x.role,x.why,{basis:x.basis,max:x.max})).join('')+nm.notes.map(n=>`<div class="alert w">${n}</div>`).join(''));
 h+=step('+45 s','Laringoscopia e intubación','<div class="note">Videolaringoscopio de primera intención. Rocuronio: 45–60 s; succinilcolina: al terminar las fasciculaciones; vecuronio: 90–150 s. Confirmar con capnografía de onda.</div>');
 h+=step('+5 min','Post-intubación',`<ul class="t">${vent(p).map(x=>`<li>${x}</li>`).join('')}<li><b>Iniciar analgosedación sin demora</b> (pestaña Infusiones).</li></ul>`);
 const sg=roundDose(16*p.w),sp=bprep('suga',sg);
 h+=step('Rescate','Vía aérea fallida',`<ul class="t"><li>Sugammadex 16 mg/kg (peso real): <b>${r(sg)} mg = ${r(sg/sp.conc,'mL')} mL</b>. ${sp.txt} <b>Ficha técnica: reversión inmediata solo tras rocuronio</b> (≈3 min después de una dosis única de 1,2 mg/kg). Tras vecuronio no está establecida. No sustituye el plan quirúrgico.${n1.id==='vec'?' <b>Este plan usa vecuronio: no cuentes con sugammadex para una reversión inmediata.</b>':''}${p.erc?' Ficha técnica: no recomendado con ClCr &lt; 30 mL/min.':''}${ruleTag('R-01')}</li><li>Dispositivo supraglótico → si no se puede intubar ni oxigenar: cricotiroidotomía.</li></ul>`);
 h+=`</div><button class="cta" id="toInf">Infusiones de mantenimiento</button>`;
 $('plan').innerHTML=h;
 $('toInf').addEventListener('click',()=>show('v-inf'));
}

/* ================= infusiones ================= */
function defaults(p){
 const ind=inductors(p).find(x=>x[1]==='first')[0];
 const nmb=nmbList(p).L.find(x=>x.role==='first').id;
 let sed='prop';
 if(p.state==='shock')sed='mida';
 else if(p.state==='riesgo')sed=p.esc==='epoc'?'keta':'mida';
 else if(p.esc==='sangra')sed='mida';
 return {ind,nmb,sed};
}
function renderMaint(){
 if(!P)return;
 const p=P;
 if(M.ind===null){const d=defaults(p);M.ind=d.ind;M.nmb=d.nmb;M.sed=d.sed;M.bnm='none';M.adj=false;}
 const old=p.edad>=65,low=p.state!=='estable'||old;
 const opt=(v,arr)=>arr.map(a=>`<option value="${a[0]}"${a[0]===v?' selected':''}>${a[1]}</option>`).join('');
 let h=expBanner()+`<p class="lead">Administrado en la SIR</p><div class="grid2">
 <label>Inductor<select id="mInd">${opt(M.ind,[['etom','Etomidato'],['keta','Ketamina'],['prop','Propofol']])}</select></label>
 <label>Bloqueante<select id="mNmb">${opt(M.nmb,[['roc','Rocuronio'],['succ','Succinilcolina'],['vec','Vecuronio']])}</select></label></div>
 <p class="lead">Esquema</p><div class="grid2">
 <label>Analgesia<select id="mAnal">${opt(M.anal,[['fent','Fentanilo'],['none','Ninguna']])}</select></label>
 <label>Sedación<select id="mSed">${opt(M.sed,[['prop','Propofol'],['mida','Midazolam'],['dex','Dexmedetomidina'],['keta','Ketamina'],['none','Ninguna']])}</select></label>
 <label>Bloqueo NM continuo<select id="mBnm">${opt(M.bnm,[['none','No (lo habitual)'],['roc','Rocuronio'],['cis','Cisatracurio'],['vec','Vecuronio']])}</select></label>
 <label>Coadyuvante<select id="mAdj"${M.sed==='keta'?' disabled':''}>${opt(M.adj?'1':'0',[['0','Ninguno'],['1','Ketamina analgésica']])}</select></label></div>
 <p class="lead">Preparar para</p>
 <div class="seg" id="mH">${[6,8,10,12].map(x=>`<button data-h="${x}" class="${x===M.H?'on':''}">${x} h</button>`).join('')}</div>`;

 if(M.nmb==='roc')h+=`<div class="alert">Rocuronio dura 45–70 min y el inductor solo minutos: inicia la analgosedación <b>ya</b> (riesgo de despertar paralizado).</div>`;
 else if(M.nmb==='vec')h+=`<div class="alert">Vecuronio a dosis de SIR dura 60–90 min o más: inicia la analgosedación <b>ya</b>.</div>`;
 else h+=`<div class="alert i">Succinilcolina: se recupera en 8–10 min. Para parálisis continua, primero un bolo de BNM no despolarizante.</div>`;
 if(M.ind==='etom')h+=`<div class="alert w">Etomidato: dosis única, efecto de 3–5 min. No repetir ni infundir.</div>`;

 h+=`<div class="sec"><h3>Infusiones</h3>`;
 if(M.anal==='fent'){const st=low?0.5:1,bW=wt('abw',p).w;
  h+=infCard('fent','Fentanilo · analgesia',st,'mcg/kg/h',0.5,3,'abw',`Rescate 0.5–1 mcg/kg (${r(0.5*bW)}–${r(bW)} mcg). Meta CPOT &lt; 3 o BPS &lt; 5.${p.hepa?' Hepatopatía: límite bajo.':''}`);}
 if(M.adj&&M.sed!=='keta')h+=infCard('keta','Ketamina · coadyuvante',0.2,'mg/kg/h',0.1,0.3,'abw','Ahorra opioide. La ampolla de 500 mg se usa en fracción.'+(p.esc==='epoc'?' Broncodilatadora.':''));
 const neuro=p.esc==='ich'||p.esc==='isq'||(p.esc==='poli'&&p.tce);
 if(M.sed==='prop'){const st=(low||p.esc==='ic')?5:10;
  h+=infCard('prop','Propofol · sedación',st,'mcg/kg/min',5,50,'abw',`Puro, sin diluir. Desechar frasco y equipo a las 12 h (6 h si se pasa a jeringa). Titular de 5 en 5 mcg/kg/min.${neuro?' Preferido en neurocrítico.':''} Más de 4 mg/kg/h o 48 h: triglicéridos, CK y lactato.`+(p.state!=='estable'?' <b>Inestable: considera midazolam o ketamina.</b>':''));}
 if(M.sed==='mida'){const st=(old||p.erc||p.hepa)?0.02:0.03;
  h+=infCard('mida','Midazolam · sedación',st,'mg/kg/h',0.02,0.1,'abw',`Por estabilidad hemodinámica. Cambiar a propofol o dexmedetomidina cuando la PA lo permita (acumulación, delirium).${p.erc?' <b>ERC: acumula metabolitos activos.</b>':''}${p.hepa?' <b>Hepatopatía: aclaramiento reducido.</b>':''}`);}
 if(M.sed==='dex'){const st=low?0.2:0.4;
  h+=infCard('dex','Dexmedetomidina · sedación ligera',st,'mcg/kg/h',0.2,1.5,'abw','Sin bolo de carga. Bradicardia e hipotensión. <b>No para sedación profunda ni con BNM continuo.</b>'+(p.esc==='raqui'?' Cuidado con la bradicardia medular.':''));}
 if(M.sed==='keta')h+=infCard('keta','Ketamina · analgosedación',0.5,'mg/kg/h',0.25,1.5,'abw','Mantiene el tono simpático; broncodilatadora. Hipertensión y taquicardia posibles; en falla cardiaca vigila la depresión miocárdica.');
 if(M.sed==='none')h+=`<div class="alert">Sin sedación: solo si está tranquilo con analgesia. Nunca con BNM.</div>`;
 if(M.bnm!=='none'){
  h+=`<div class="alert w">BNM continuo solo con indicación (SDRA con PaO₂/FiO₂ &lt; 150, HIC refractaria, asincronía grave, escalofríos). Requiere RASS −5 y TOF (meta 1–2/4).</div>`;
  if(M.sed==='dex'||M.sed==='none')h+=`<div class="alert"><b>Incompatible:</b> con BNM continuo la sedación debe ser profunda.</div>`;
  const wN=wt('ibw',p).w;
  if(M.bnm==='roc')h+=infCard('roc','Rocuronio',0.5,'mg/kg/h',0.3,0.7,'ibw',(M.nmb==='succ'?`Tras succinilcolina, bolo de 0.6 mg/kg (${r(0.6*wN)} mg). `:'')+(p.hepa?'<b>Hepatopatía: prefiere cisatracurio.</b>':''));
  if(M.bnm==='cis')h+=infCard('cis','Cisatracurio',2,'mcg/kg/min',1,5,'ibw',`Bolo 0.15 mg/kg (${r(0.15*wN)} mg) si no hay BNM activo. Eliminación de Hofmann: de elección en ERC o hepatopatía. Ampollas refrigeradas.`);
  if(M.bnm==='vec')h+=infCard('vec','Vecuronio',1,'mcg/kg/min',0.8,1.7,'ibw',`${M.nmb==='vec'?'Iniciar cuando reaparezca respuesta en el TOF. ':`Bolo 0.1 mg/kg (${r(0.1*wN)} mg) si no hay BNM activo. `}Reconstituir con agua estéril; usar en 24 h. Se acumula en ERC y hepatopatía.`+(p.erc||p.hepa?' <b>Prefiere cisatracurio.</b>':''));
 }
 h+=`</div>`;
 let rass='RASS −1 a 0 una vez estabilizado.';
 if(M.bnm!=='none')rass='RASS −5 (obligatorio con BNM) + BIS 40–60 si está disponible.';
 else if(neuro)rass='RASS −2 a −4 si hay HIC; ventana diaria para exploración neurológica.';
 else if(p.esc==='epoc')rass='RASS −3 a −4 mientras haya broncoespasmo grave; luego aligerar.';
 h+=`<div class="sec"><h3>Metas</h3><ul class="t"><li>Sedación: ${rass}</li><li>Analgesia primero: CPOT &lt; 3 o BPS &lt; 5.</li><li>Vigila la hipotensión post-intubación los primeros 30 min.</li><li>Rotula cada mezcla: fármaco, cantidad, volumen, concentración, hora y responsable.</li></ul></div>
 <button class="cta" id="copy">Copiar resumen</button>`;
 $('maint').innerHTML=h;
 const map={mInd:'ind',mNmb:'nmb',mAnal:'anal',mSed:'sed',mBnm:'bnm'};
 Object.keys(map).forEach(id=>$(id).addEventListener('change',e=>{M[map[id]]=e.target.value;renderMaint();}));
 $('mAdj').addEventListener('change',e=>{M.adj=e.target.value==='1';renderMaint();});
 document.querySelectorAll('#mH button').forEach(b=>b.addEventListener('click',()=>{M.H=+b.dataset.h;renderMaint();renderPlan();}));
 $('copy').addEventListener('click',copySummary);
}
function copySummary(){
 if(!P){toast('Primero calcula con datos válidos');return}
 const p=P,L=[];
 L.push(`SIR — ${ESC[p.esc]}${p.tce?' + TCE':''}`);
 L.push(`${p.sexo==='M'?'H':'M'}, ${p.edad} a, ${p.w} kg, ${p.h} cm (IMC ${p.bmi.toFixed(1)}). PA ${p.pas}/${p.pad} (PAM ${Math.round(p.pam)})${p.fc?', FC '+p.fc+', IS '+p.si.toFixed(2):''}${p.spo2?', SpO2 '+p.spo2+'%':''}.`);
 document.querySelectorAll('#plan .syr .row').forEach(rw=>L.push('• '+rw.querySelector('.k').textContent+': '+rw.querySelector('.n').textContent.trim()+' '+rw.querySelector('.v').childNodes[0].textContent.trim()+' ('+rw.querySelector('.v small').textContent+')'));
 L.push(`Administrado: ${NAMES[M.ind]} + ${NAMES[M.nmb]}. Infusiones para ${M.H} h:`);
 document.querySelectorAll('#maint .inf').forEach(c=>L.push('• '+c.querySelector('.nm').textContent+': '+c.querySelector('.rate').textContent+'. '+c.querySelector('.prep').textContent.replace(/\s+/g,' ').trim()));
 const txt=L.join('\n');
 const done=()=>toast('Resumen copiado. Contiene datos clínicos: pégalo solo en la historia clínica.',3500),fail=()=>toast('No se pudo copiar');
 if(window.SirDocNative&&window.SirDocNative.copy){try{window.SirDocNative.copy(txt);done()}catch(e){fail()}return}
 try{navigator.clipboard.writeText(txt).then(done,fail)}catch(e){fail()}
}

/* ================= cronómetro ================= */
let t0=null,tick=null,warned=false,lock=null;
function fmt(s){const m=Math.floor(s/60),x=s%60;return `${m}:${String(x).padStart(2,'0')}`}
async function keepAwake(on){ // pantalla encendida mientras corre el cronómetro
 const N=window.SirDocNative;if(N&&N.keepAwake){try{N.keepAwake(!!on)}catch(e){}return}
 try{ if(on&&'wakeLock' in navigator&&document.visibilityState==='visible'){lock=await navigator.wakeLock.request('screen')}
      else if(!on&&lock){await lock.release();lock=null} }catch(e){}
}
function upd(){
 if(!t0)return;
 const s=Math.floor((Date.now()-t0)/1000);$('timer').textContent='BNM +'+fmt(s);
 if(s>=600&&!warned){warned=true;toast('10 min desde el BNM: ¿analgosedación en curso?',4000);try{window.SirDocNative?window.SirDocNative.vibrate(500):navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
}
const TKEY='sirdoc.t0';
function startTimer(at,restored){
 t0=at;warned=(Date.now()-at)>=600000;$('timer').classList.add('run');upd();clearInterval(tick);tick=setInterval(upd,1000);keepAwake(true);
 try{localStorage.setItem(TKEY,String(at))}catch(e){}
 toast(restored?'Cronómetro restaurado desde la hora registrada del bloqueante':'Cronómetro iniciado. Mide el tiempo desde el bloqueante; no confirma el bloqueo ni su reversión.',4000);
}
function stopTimer(){clearInterval(tick);t0=null;keepAwake(false);try{localStorage.removeItem(TKEY)}catch(e){}const b=$('timer');b.classList.remove('run');b.textContent='⏱ Marcar BNM'}
$('timer').addEventListener('click',()=>{
 if(t0){stopTimer();toast('Cronómetro detenido');return}
 startTimer(Date.now(),false);
});
// La hora de inicio se guarda en el dispositivo: el cronómetro sobrevive a bloqueo, cambio de app y recarga (máx. 6 h).
(function restoreTimer(){try{const v=Number(localStorage.getItem(TKEY));if(v&&Date.now()-v<6*3600e3&&Date.now()>=v)startTimer(v,true);else localStorage.removeItem(TKEY)}catch(e){}})();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&t0){upd();keepAwake(true)}});

/* ================= navegación y formulario ================= */
function show(v){
 document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id===v));
 document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
 window.scrollTo(0,0);
}
/* ---- control de resultados: nunca se muestra un resultado de datos anteriores ---- */
let confirmedSig=null;
function placeholder(msg){
 const h=`<div class="ph" role="status"><b>Sin resultados vigentes</b><p>${msg}</p></div>`;
 $('plan').innerHTML=h;$('maint').innerHTML=h;
}
function invalidate(){P=null;M.ind=null;placeholder('Los datos del paciente cambiaron. Pulsa <b>Calcular</b> en Paciente para obtener dosis actualizadas.');}
function compute(silent){
 const p=read(),v=validateFull(p),box=$('err');
 if(v.errors.length){
  P=null;placeholder('Hay datos que corregir en Paciente:<br>• '+v.errors.join('<br>• '));
  if(!silent){box.className='alert';box.innerHTML='<b>Corrige antes de calcular:</b><br>• '+v.errors.join('<br>• ');}
  return false;
 }
 const sig=signature(p);
 if(v.warns.length&&sig!==confirmedSig){
  P=null;placeholder('Hay valores extremos pendientes de confirmar en Paciente.');
  if(!silent){box.className='alert w';box.innerHTML='<b>Valores inusuales — confirma que son correctos:</b><br>• '+v.warns.join('<br>• ')+'<button class="cta" id="confirmVals" type="button">Los datos son correctos · calcular</button>';
   $('confirmVals').addEventListener('click',()=>{confirmedSig=sig;if(compute())show('v-plan');});}
  return false;
 }
 box.className='alert hide';
 try{P=derive(p);renderPlan();renderMaint();return true}
 catch(e){P=null;placeholder('No fue posible calcular con estos datos. Revísalos y vuelve a intentarlo.');return false}
}
function expBanner(){
 return `<div class="exp" role="note"><b>⚠ Atención:</b> algoritmo v${ALG.version} (${ALG.fecha}) · ${ALG.estado}. Verifica cada dosis antes de administrar.</div>`;
}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
 const v=b.dataset.v;if((v==='v-plan'||v==='v-inf')&&!P&&!compute(true)){show(v);return}
 show(v);
}));
$('calc').addEventListener('click',()=>{if(compute())show('v-plan');else window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
function renderExtra(){
 const x={poli:[['tce','TCE asociado']],raqui:[['tce','TCE asociado'],['sci72','Más de 72 h desde la lesión']],sangra:[['trauma','Origen traumático']],isq:[['trombo','Candidato a trombólisis o trombectomía']]}[S.esc]||[];
 $('extra').innerHTML=x.map(a=>`<label><input type="checkbox" id="${a[0]}">${a[1]}</label>`).join('');
}
document.querySelectorAll('#esc button').forEach(b=>b.addEventListener('click',()=>{S.esc=b.dataset.v;document.querySelectorAll('#esc button').forEach(x=>x.classList.toggle('on',x===b));renderExtra();invalidate();}));
document.querySelectorAll('#sexo button').forEach(b=>b.addEventListener('click',()=>{S.sexo=b.dataset.v;document.querySelectorAll('#sexo button').forEach(x=>x.classList.toggle('on',x===b));invalidate();}));
$('v-pac').addEventListener('input',invalidate);
$('v-pac').addEventListener('change',e=>{if(e.target.id!=='confirmVals')invalidate();});

/* ================= teclado (escritorio) ================= */
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&['1','2','3','4'].includes(e.key)){e.preventDefault();const v=['v-pac','v-plan','v-inf','v-aj'][+e.key-1];document.querySelector(`.tabs button[data-v="${v}"]`).click();}
 else if(e.key==='Enter'&&document.querySelector('#v-pac.on')&&e.target.tagName==='INPUT'){e.preventDefault();$('calc').click();}
});

/* ================= ajustes ================= */
function initSettings(){
 [['s-etom','etomOk'],['s-roc','rocOk'],['s-succ','succOk']].forEach(([id,k])=>{$(id).checked=ST[k];$(id).addEventListener('change',e=>{ST[k]=e.target.checked;save();M.ind=null;if(P)compute(true);})});
 ['prop','mida'].forEach(k=>{const s=$('s-'+k);s.innerHTML=PRES[k].map((x,i)=>`<option value="${i}"${i===ST[k]?' selected':''}>${x.l}</option>`).join('');s.addEventListener('change',e=>{ST[k]=SEL[k]=+e.target.value;save();if(P)compute(true);})});
 const hs=()=>document.querySelectorAll('#s-h button').forEach(b=>b.classList.toggle('on',+b.dataset.h===ST.H));hs();
 document.querySelectorAll('#s-h button').forEach(b=>b.addEventListener('click',()=>{ST.H=M.H=+b.dataset.h;save();hs();if(P){renderPlan();renderMaint();}}));
 $('showDisc').addEventListener('click',()=>$('disc').classList.remove('hide'));
 $('okDisc').addEventListener('click',()=>{ST.disc=true;save();$('disc').classList.add('hide')});
 if(!ST.disc)$('disc').classList.remove('hide');
 const est=x=>(x.v==='verificada'?'Fuente verificada':x.v==='parcial'?'Fuente verificada en parte':x.v==='secundaria'?'Contrastada con fuente secundaria (OpenEvidence)':'Fuente pendiente de verificar')+' · '+x.a;
 $('rules').innerHTML=Object.keys(RULES).map(k=>`<li><b>${k}</b>${RULES[k].t}<small>${RULES[k].f}</small><small>${est(RULES[k])}</small></li>`).join('');
 $('algv').textContent=`SirDoc ${ALG.version} · algoritmo v${ALG.version} (${ALG.fecha}) · ${ALG.estado}`;
}
initSettings();

/* ================= nativo (Capacitor) ================= */
(function native(){
 const C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
 document.documentElement.classList.add('native');
 const PL=C.Plugins||{};
 // botón atrás de Android: vuelve a Paciente; desde Paciente, minimiza en lugar de cerrar
 if(PL.App)PL.App.addListener('backButton',()=>{
  if(!$('disc').classList.contains('hide'))return;
  const cur=document.querySelector('.view.on');
  if(cur&&cur.id!=='v-pac')show('v-pac');else if(PL.App.minimizeApp)PL.App.minimizeApp();else PL.App.exitApp();
 });
 const SB=PL.StatusBar;if(!SB)return;
 const mq=window.matchMedia('(prefers-color-scheme: dark)');
 const set=()=>{try{SB.setOverlaysWebView({overlay:true});SB.setStyle({style:mq.matches?'DARK':'LIGHT'})}catch(e){}};
 set();mq.addEventListener&&mq.addEventListener('change',set);
})();

/* botón atrás del contenedor Android: devuelve '1' si la app lo manejó */
window.sirdocBack=function(){
 const d=$('disc');if(d&&!d.classList.contains('hide'))return '1';
 const cur=document.querySelector('.view.on');if(cur&&cur.id!=='v-pac'){show('v-pac');return '1'}
 return '0';
};

/* app web instalable (iPhone/Android desde el navegador): trabajo sin conexión */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!window.Capacitor&&!window.SirDocNative){
 window.addEventListener('load',()=>{
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  // Nueva versión activada: se pide recargar para no mezclar algoritmo anterior y nuevo en la misma sesión.
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(!had||$('upd'))return;
   const b=document.createElement('div');b.id='upd';b.setAttribute('role','alert');
   b.innerHTML='<span>Hay una versión nueva de SirDoc. Recarga antes de calcular.</span><button type="button">Recargar</button>';
   b.querySelector('button').addEventListener('click',()=>location.reload());document.body.appendChild(b);
  });
 });
}
