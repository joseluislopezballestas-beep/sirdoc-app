'use strict';
/* ================= portada ================= */
(function intro(){
 const el=document.getElementById('intro');if(!el)return;
 // Solo en la primera apertura: desde la segunda, la herramienta queda usable de inmediato (H-19).
 let seen=false;try{seen=localStorage.getItem('sirdoc.intro')==='1';localStorage.setItem('sirdoc.intro','1')}catch(e){}
 if(seen){el.remove();return;}
 const hide=()=>{if(el.classList.contains('out'))return;el.classList.add('out');setTimeout(()=>el.remove(),600)};
 el.addEventListener('click',hide);setTimeout(hide,2700);
})();
/* ================= estado y utilidades ================= */
const $=id=>document.getElementById(id);
let S={esc:null,sexo:'M'};
let P=null;
const KEY='sirdoc.v1';
const ST=Object.assign({etomOk:true,rocOk:true,succOk:true,H:8,disc:false,pres:{},custom:{}},load());
if(ST.prop!=null&&ST.pres.prop==null)ST.pres.prop=ST.prop;   // ajustes de versiones anteriores
if(ST.mida!=null&&ST.pres.mida==null)ST.pres.mida=ST.mida;
/* Fuente ÚNICA de la selección farmacológica: el plan (botón Seleccionar), el registro "Administrado" y el resumen leen y escriben M.
   ind/nmb vacíos = sin seleccionar; nunca se rellenan con la opción sugerida. */
let M={ind:'',nmb:'',pre:false,anal:'fent',sed:null,adj:false,bnm:'none',H:ST.H,init:false,ctx:null,cleared:''};
let CONF={};   // dosis por encima del techo blando ya confirmadas: CONF['id:dosis']=true
let SEL_OK=false;   // presentaciones verificadas en esta sesión
// Restaura presentaciones guardadas; una presentación "otra" inválida vuelve a la estándar.
Object.keys(PRES).forEach(k=>{
 const c=ST.custom[k],v=ST.pres[k];
 if(v===-1&&c&&!customErr(k,c.amt,c.vol)){SEL[k]=-1;CUSTOM[k]={amt:c.amt,vol:c.vol};}
 else if(Number.isInteger(v)&&v>=0&&v<PRES[k].length)SEL[k]=v; else SEL[k]=0;
});

function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
let tt;function toast(t,ms){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),ms||1800)}
const esc2=s=>s; // contenido propio, sin datos externos

/* ================= bolos ================= */
function bcalc(id,k,opts={}){
 const basis=opts.basis||BASIS.bolus[id]||'lbw';
 const W=wt(basis,P),unit=id==='fent'?'mcg':'mg';
 let dose=k*W.w,capped=false;if(opts.max&&dose>opts.max){dose=opts.max;capped=true}
 dose=roundDose(dose);
 const bp=bprep(id,dose);
 const c={id,k,W,unit,dose,capped,bp,vol:dose/bp.conc,max:opts.max};
 c.ok=[k,W.w,dose,bp.conc,c.vol].every(usable);
 c.over=!!(CEIL[id]&&dose>CEIL[id]);c.conf=!c.over||!!CONF[id+':'+dose];
 return c;
}
const condLi=x=>Array.isArray(x)?`<li>${x[0]}${x[1]?`<span class="cond">Condición: ${x[1]}</span>`:''}</li>`:`<li>${x}</li>`;
const PILL={first:'<span class="pill p-ok">✓ 1.ª elección</span>',alt:'<span class="pill p-mut">Alternativa</span>',avoid:'<span class="pill p-warn">⚠ Evitar</span>',ci:'<span class="pill p-ci">⛔ Contraindicado</span>',nd:'<span class="pill p-nd">⊘ No disponible</span>'};
function evNote(id){const x=RULES[RULE_BOLUS[id]];return x&&x.v==='pendiente'?warn(['ev','Dosis sin fuente primaria verificada; confírmala con tu protocolo.',`regla ${RULE_BOLUS[id]}`]):'';}
function bolus(id,k,range,role,why,opts={}){
 const tag=PILL[role];
 if(role==='ci')return `<div class="drug ci" role="alert"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div><div class="why"><b>${why}</b> No se calcula dosis.</div></div>`;
 if(role==='nd')return `<div class="drug nd"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div><div class="why">${why}</div></div>`;
 if(role==='avoid')return `<div class="drug avoid"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div><div class="why">${why}</div></div>`;
 const c=bcalc(id,k,opts);
 if(!c.ok)return calcErr(NAMES[id]);
 const pr_=(drugPrec(P)[id]||[]).map(t=>warn(['prec',t])).join('');
 const on=opts.sel&&(opts.sel==='pre'?M.pre:M[opts.sel]===id);
 const cw=ceilWarn(c);
 const sb=opts.sel?(c.conf?`<button type="button" class="selbtn${on?' on':''}" data-sel="${opts.sel}" data-id="${id}" aria-pressed="${on}">${on?'✓ Seleccionado':'Seleccionar '+NAMES[id]}</button>`:`<button type="button" class="selbtn" disabled aria-disabled="true">Confirma la dosis para poder seleccionar</button>`):'';
 return `<div class="drug ${role}${on?' sel':''}"><div class="hd"><span class="nm">${NAMES[id]}</span>${tag}</div>
 <div class="dose">${r(c.dose)} ${c.unit}<small>${r(c.vol,'mL')} mL · ${r(c.bp.conc)} ${c.bp.u}</small></div>
 <div class="calc">${k} ${c.unit}/kg × ${r(c.W.w)} kg (${c.W.l}) · rango ${range}${c.capped?` · máx. ${c.max} ${c.unit}`:''}${opts.cond?`<br>Dosis para: ${opts.cond}`:''}</div>
 <div class="prep">${c.bp.txt}</div>
 <div class="why">${why}</div>${cw}${pr_}${evNote(id)}${ruleTag(RULE_BOLUS[id])}${sb}</div>`;
}
/* Techo blando (R-20): la dosis se muestra con aviso y exige confirmar peso y dosis. */
function ceilWarn(c){
 if(!c.over)return '';
 if(c.conf)return warn(['prec',`Dosis ${r(c.dose)} ${c.unit} por encima del techo de revisión (${CEIL[c.id]} ${c.unit}): <b>confirmada</b>.`,`${NAMES[c.id]} > ${CEIL[c.id]} ${c.unit}`]);
 return warn(['prec',`Dosis ${r(c.dose)} ${c.unit} por encima del techo de revisión de la app (${CEIL[c.id]} ${c.unit}). Verifica el peso y la dosis antes de administrar.`,`${NAMES[c.id]} > ${CEIL[c.id]} ${c.unit} · ${ruleTag('R-20').replace(/<[^>]+>/g,'')}`])+`<button type="button" class="confbtn" data-id="${c.id}" data-dose="${c.dose}">Confirmo peso y dosis de ${NAMES[c.id]}</button>`;
}
function syrRow(label,c,unsel){
 if(c&&c.blocked)return `<div class="row ci"><div class="k">${label}</div><div class="v">—</div><div class="n">${NAMES[c.id]} ${PILL[c.role]} <span class="calc">Sin dosis: reconfirma la elección. ${c.why}</span></div></div>`;
 if(c&&c.ok&&!c.conf)return `<div class="row unsel"><div class="k">${label}</div><div class="v">—</div><div class="n">${NAMES[c.id]} <span class="pill p-warn">Confirmar dosis</span> <span class="calc">supera el techo de revisión: confírmala en su tarjeta</span></div></div>`;
 if(unsel)return `<div class="row unsel"><div class="k">${label}</div><div class="v">—</div><div class="n"><span class="pill p-warn">Sin seleccionar</span> <span class="calc">${unsel}</span></div></div>`;
 if(c.none)return `<div class="row ci"><div class="k">${label}</div><div class="v">—</div><div class="n"><span class="pill p-ci">⛔ Sin bloqueante utilizable</span></div></div>`;
 if(!c.ok)return `<div class="row"><div class="k">${label}</div><div class="v">—</div><div class="n">${NAMES[c.id]} <span class="pill p-bad">No calculado</span></div></div>`;
 return `<div class="row"><div class="k">${label}</div><div class="v">${r(c.dose)} ${c.unit}<small>${r(c.vol,'mL')} mL</small></div>
 <div class="n">${NAMES[c.id]} <span class="calc">${c.k} ${c.unit}/kg</span></div></div>`;
}

/* Fila superior sin selección (H-11): muestra ya la dosis sugerida y un botón para usarla. */
function syrSug(label,c,cat){
 if(!c||!c.ok||!c.conf)return null;
 return `<div class="row unsel sug"><div class="k">${label}</div><div class="v">${r(c.dose)} ${c.unit}<small>${r(c.vol,'mL')} mL</small></div>
 <div class="n">${NAMES[c.id]} <span class="pill p-warn">Sugerido · sin seleccionar</span> <span class="calc">${c.k} ${c.unit}/kg</span></div>
 <button type="button" class="selbtn usebtn" data-sel="${cat}" data-id="${c.id}">Usar ${NAMES[c.id]}</button></div>`;
}
/* ================= plan ================= */
const OTRO_W=['ev','<b>Caso fuera de los escenarios validados</b> (p. ej., insuficiencia respiratoria hipoxémica, asma, estado epiléptico, intoxicación): el plan usa la lógica por defecto. Revisa cada decisión.','escenario «Otro / general»'];
/* Revalida la selección con el rol ACTUAL del fármaco: Evitar, No disponible o Contraindicado no muestran dosis. */
function selInd(p,ind){
 if(!M.ind)return null;
 const x=ind.find(y=>y[0]===M.ind),role=x?x[1]:'nd';
 if(role!=='first'&&role!=='alt')return {blocked:true,id:M.ind,role,why:x?x[2]:'No disponible.'};
 return bcalc(M.ind,indDose(M.ind,p).k);
}
function selNmb(p,nm){
 if(!M.nmb)return null;
 const x=nm.L.find(y=>y.id===M.nmb);
 if(!x||x.role==='ci'||x.role==='nd')return {blocked:true,id:M.nmb,role:x?x.role:'nd',why:x?x.why:'No disponible.'};
 return bcalc(x.id,x.k,{basis:x.basis,max:x.max});
}
function bindConf(root){
 document.querySelectorAll(root+' .confbtn').forEach(b=>b.addEventListener('click',()=>{
  CONF[b.dataset.id+':'+b.dataset.dose]=true;const y=window.scrollY;renderPlan();renderMaint();window.scrollTo(0,y);toast('Dosis confirmada');
 }));
}
function escTitle(p){return ESC[p.esc]+(p.esc==='poli'?(p.hemo?' con hemorragia activa':' sin hemorragia activa'):'')+(hasTce(p)?' + TCE':'');}
function renderPlan(){
 const p=P,pre=pretreat(p),ind=inductors(p),nm=nmbList(p);
 const st=p.state==='shock'?'<span class="pill p-bad">Shock</span>':p.state==='riesgo'?'<span class="pill p-warn">Riesgo de hipotensión</span>':'<span class="pill p-ok">Estable</span>';
 const i1=ind.find(x=>x[1]==='first')||null,n1=nm.L.find(x=>x.role==='first')||null;
 // Filas superiores: solo lo SELECCIONADO y revalidado con los datos actuales (rol vigente del fármaco).
 const cI=selInd(p,ind),cN=selNmb(p,nm);
 let h=expBanner()+(p.esc==='otro'?warn(OTRO_W):'')+(M.cleared?warn(['info',`Se borró la selección previa (${M.cleared}) porque cambió el escenario o el estado hemodinámico. Vuelve a seleccionar con los datos actuales.`,'cambio de escenario o de estado']):'')+`<div class="title"><h2>${escTitle(p)}</h2>${st}</div>
 <div class="strip">
  <div class="chip"><b>${p.w}</b>kg real</div><div class="chip"><b>${r(p.ibw)}</b>kg ideal</div>
  ${p.obese?`<div class="chip"><b>${r(p.lbw)}</b>kg magro</div>`:''}
  <div class="chip"><b>${p.bmi.toFixed(1)}</b>IMC</div><div class="chip"><b>${Math.round(p.pam)}</b>PAM</div>
  <div class="chip"><b>${p.si?p.si.toFixed(2):'–'}</b>Índ. shock</div>
 </div>
 <div class="syr">
  ${pre?(M.pre?syrRow('Pretratamiento · T −3 min',bcalc('fent',pre.k)):((!contraind(p).fent&&syrSug('Pretratamiento · T −3 min',bcalc('fent',pre.k),'pre'))||syrRow('Pretratamiento · T −3 min',null,'sugerido: Fentanilo'))):''}
  ${cI?syrRow('Inducción · T 0',cI):((i1&&syrSug('Inducción · T 0',bcalc(i1[0],indDose(i1[0],p).k),'ind'))||syrRow('Inducción · T 0',null,i1?'sugerido: '+NAMES[i1[0]]+' · toca Seleccionar':'ningún inductor utilizable'))}
  ${cN?syrRow('Bloqueo NM · T 0 +',cN):n1?(syrSug('Bloqueo NM · T 0 +',bcalc(n1.id,n1.k,{basis:n1.basis,max:n1.max}),'nmb')||syrRow('Bloqueo NM · T 0 +',null,'sugerido: '+NAMES[n1.id]+' · toca Seleccionar')):syrRow('Bloqueo NM · T 0 +',{none:true})}
  <div class="row rescue"><div class="k">Rescate · solo si hipotensión peri-intubación</div><div class="v">10–20 mcg<small>1–2 mL</small></div><div class="n">Epinefrina <span class="calc">10 mcg/mL · no de rutina</span></div></div>
 </div>`;
 const ci=ciSummary(p);
 if(!i1)ci.unshift(['ci','<b>Ningún inductor es utilizable</b> (contraindicado, no disponible o a evitar). Pide ayuda experta y elige el inductor según tu protocolo.','etomidato, ketamina y propofol bloqueados']);
 if(!n1)ci.unshift(['ci','<b>Ningún bloqueante neuromuscular es utilizable</b> (contraindicado o no disponible). El cisatracurio no sirve para SIR por su inicio lento. Pide ayuda experta; valora intubación sin bloqueante o vía aérea quirúrgica según el contexto.','rocuronio, succinilcolina y vecuronio bloqueados']);
 h=h.replace('<div class="strip">',(ci.length?`<div class="cibox">${ci.map(warn).join('')}</div>`:'')+'<div class="strip">');
 alerts(p).forEach(a=>h+=warn(a));
 h+=`<div class="sec"><h3>Metas</h3><ul class="t">${targets(p).map(condLi).join('')}</ul>${ruleTag(p.esc==='sepsis'?'R-17':p.esc==='iam'?'R-18':'R-10')}</div>`;

 const step=(tm,title,body,open)=>`<details class="step"${open?' open':''}><summary><span class="tm">${tm}</span>${title}</summary><div class="body">${body}</div></details>`;
 h+=`<div class="sec"><h3>Secuencia</h3>`;
 h+=step('T −10 min','Preparación y optimización'+(p.state!=='estable'||p.esc==='sangra'||(p.esc==='poli'&&p.hemo)?' · <b>pasos críticos antes de inducir</b>':''),`<ul class="t">${prep(p).map(condLi).join('')}</ul>`,p.state!=='estable'||p.esc==='sangra'||(p.esc==='poli'&&p.hemo));
 h+=step('T −5 min','Preoxigenación','<div class="note">3–5 min con FiO₂ 100 % (u 8 respiraciones a capacidad vital). Oxigenación apneica con cánula nasal durante la laringoscopia.</div>');
 h+=step('T −3 min','Pretratamiento',pre?(contraind(p).fent?bolus('fent',0,'','ci','Contraindicado por '+contraind(p).fent.join('; ')+'.'):bolus('fent',pre.k,pre.r,'first',pre.why,{sel:'pre'})):`<div class="note">${p.state!=='estable'?'No indicado: riesgo de hipotensión ('+doseWhy(p)+').':'No indicado en este escenario con estos datos.'} La lidocaína no se recomienda de rutina.</div>`);
 h+=step('T 0','Inducción · opciones',ind.map(x=>{if(x[1]==='nd'||x[1]==='ci')return bolus(x[0],0,'',x[1],x[2]);const d=indDose(x[0],p);return bolus(x[0],d.k,d.r,x[1],x[2],{cond:doseWhy(p,x[0]),sel:'ind'});}).join('')+ruleTag('R-09'),true);
 h+=step('T 0 +','Bloqueo neuromuscular · opciones',nm.L.map(x=>bolus(x.id,x.k,x.r,x.role,x.why,{basis:x.basis,max:x.max,sel:'nmb'})).join(''),true);
 h+=step('+45 s','Laringoscopia e intubación','<div class="note">Videolaringoscopio de primera intención (ASA 2022: de elección en la vía aérea difícil prevista). Rocuronio: 45–60 s; succinilcolina: al terminar las fasciculaciones; vecuronio: 90–150 s. Confirmar con capnografía de onda.</div>');
 h+=step('+5 min','Post-intubación',`<ul class="t">${vent(p).map(condLi).join('')}<li><b>Iniciar analgosedación sin demora</b> (pestaña Infusiones).</li><li>Antes de extubar: monitorización cuantitativa en el aductor del pulgar y TOF ≥ 0,9 (ASA 2023; ESAIC 2023). Sin monitor cuantitativo no se puede descartar bloqueo residual.</li></ul>`);
 const cS=bcalc('suga',16),CIs=contraind(p).suga;
 const sgTxt=CIs?`<b>Sugammadex contraindicado</b> (${CIs.join('; ')}): no cuentes con reversión farmacológica inmediata.`:`Sugammadex 16 mg/kg (${cS.W.l}): <b>${r(cS.dose)} mg = ${r(cS.vol,'mL')} mL</b>. ${cS.bp.txt}${ceilWarn(cS)}`;
 h+=step('Rescate','Vía aérea fallida',`<ul class="t"><li>${sgTxt} <b>Ficha técnica: reversión inmediata solo tras rocuronio</b> (≈3 min después de una dosis única de 1,2 mg/kg). Tras vecuronio no está establecida. Si el plan usa rocuronio, ten el sugammadex calculado y a mano antes de inducir. Para reversión no urgente, ASA 2023 y ESAIC 2023 recomiendan sugammadex sobre neostigmina en bloqueo profundo, moderado o superficial por rocuronio o vecuronio, guiado por TOF. No sustituye el plan quirúrgico.${n1&&n1.id==='vec'?' <b>Este plan usa vecuronio: no cuentes con sugammadex para una reversión inmediata.</b>':''}${(drugPrec(p).suga||[]).map(t=>warn(['prec',t])).join('')}${ruleTag('R-01')}</li><li>Dispositivo supraglótico → si no se puede intubar ni oxigenar: cricotiroidotomía.</li></ul>`);
 h+=`</div><button class="cta" id="toInf">Infusiones de mantenimiento</button>`;
 $('plan').innerHTML=h;commaDom($('plan'));
 $('toInf').addEventListener('click',()=>show('v-inf'));
 bindConf('#plan');
 document.querySelectorAll('#plan .selbtn').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.sel,id=b.dataset.id,y=window.scrollY;
  if(k==='pre')M.pre=!M.pre; else M[k]=M[k]===id?'':id;
  M.cleared='';
  renderPlan();renderMaint();window.scrollTo(0,y);
  toast(k==='pre'?(M.pre?'Pretratamiento seleccionado':'Pretratamiento retirado'):(M[k]?`${NAMES[id]} seleccionado`:`${NAMES[id]} retirado de la selección`));
 }));
}

/* ================= infusiones ================= */
function defaults(p){
 const CI=contraind(p);
 let sed='prop';
 if(p.state==='shock')sed='mida';
 else if(p.state==='riesgo')sed=p.esc==='epoc'?'keta':'mida';
 else if(p.esc==='sangra')sed='mida';
 if(p.esc==='sepsis')sed='prop';   // analgesia primero; propofol a dosis baja; evitar benzodiacepinas
 if(CI[sed])sed=p.esc==='sepsis'&&!CI.keta?'keta':'mida';
 return {sed};
}
/* Estado del fármaco registrado como administrado, con los datos actuales: aviso si es Evitar, No disponible o Contraindicado. */
function regWarn(p){
 const L=[],ind=inductors(p),nm=nmbList(p).L;
 if(M.ind){const x=ind.find(y=>y[0]===M.ind);const ro=x?x[1]:'nd';
  if(ro==='avoid')L.push(['prec',`<b>${NAMES[M.ind]}</b> figura como inductor seleccionado o administrado pero en este contexto está marcado <b>«Evitar»</b>: ${x[2]} Reconfirma la elección y vigila la hipotensión.`,`${escTitle(p)} · ${doseWhy(p)}`,'Evitar']);
  else if(ro==='nd')L.push(['nd',`<b>${NAMES[M.ind]}</b> figura como seleccionado pero está marcado como no disponible. Reconfirma la elección.`,'Disponibilidad']);
  else if(ro==='ci')L.push(['ci',`<b>${NAMES[M.ind]}</b> figura como seleccionado o administrado pero está contraindicado. Verifica el registro y vigila sus efectos adversos.`,x[2].replace(/^Contraindicado por /,'').replace(/\.$/,'')]);}
 if(M.nmb){const x=nm.find(y=>y.id===M.nmb);
  if(x&&x.role==='ci')L.push(['ci',`<b>${NAMES[M.nmb]}</b> figura como seleccionado o administrado pero está contraindicado. Verifica el registro y vigila sus efectos adversos.`,contraind(p)[M.nmb].join('; ')]);
  else if(x&&x.role==='nd')L.push(['nd',`<b>${NAMES[M.nmb]}</b> figura como seleccionado pero está marcado como no disponible. Reconfirma la elección.`,'Disponibilidad']);}
 return L;
}
function renderMaint(){
 if(!P)return;
 const p=P;
 if(!M.init){const d=defaults(p);M.sed=d.sed;M.bnm='none';M.adj=false;M.init=true;}   // inductor y bloqueante NO se rellenan: solo lo seleccionado
 const old=p.edad>=65,low=p.state!=='estable'||old;
 const opt=(v,arr)=>arr.map(a=>`<option value="${a[0]}"${a[0]===v?' selected':''}>${a[1]}</option>`).join('');
 let h=expBanner()+(p.esc==='otro'?warn(OTRO_W):'')+`<p class="lead">Administrado en la SIR</p><div class="grid2">
 <label>Inductor<select id="mInd">${opt(M.ind,[['','— Sin registrar —'],['etom','Etomidato'],['keta','Ketamina'],['prop','Propofol']])}</select></label>
 <label>Bloqueante<select id="mNmb">${opt(M.nmb,[['','— Sin registrar —'],['roc','Rocuronio'],['succ','Succinilcolina'],['vec','Vecuronio']])}</select></label></div>
 <p class="lead">Esquema</p><div class="grid2">
 <label>Analgesia<select id="mAnal">${opt(M.anal,[['fent','Fentanilo'],['none','Ninguna']])}</select></label>
 <label>Sedación<select id="mSed">${opt(M.sed,[['prop','Propofol'],['mida','Midazolam'],['dex','Dexmedetomidina'],['keta','Ketamina'],['none','Ninguna']])}</select></label>
 <label>Bloqueo NM continuo<select id="mBnm">${opt(M.bnm,[['none','No (lo habitual)'],['roc','Rocuronio'],['cis','Cisatracurio'],['vec','Vecuronio']])}</select></label>
 <label>Coadyuvante<select id="mAdj"${M.sed==='keta'?' disabled':''}>${opt(M.adj?'1':'0',[['0','Ninguno'],['1','Ketamina analgésica']])}</select></label></div>
 <p class="lead">Preparar para</p>
 <div class="seg" id="mH">${[6,8,10,12].map(x=>`<button data-h="${x}" class="${x===M.H?'on':''}">${x} h</button>`).join('')}</div>`;

 const CI=contraind(p),prc=id=>(drugPrec(p)[id]||[]).map(t=>warn(['prec',t])).join('');
 const ciCard=(id,title)=>`<div class="drug ci" role="alert"><div class="hd"><span class="nm">${title}</span>${PILL.ci}</div><div class="why"><b>Contraindicado por ${CI[id].join('; ')}.</b> No se calcula la infusión: elige otro fármaco.</div></div>`;
 if(!M.ind||!M.nmb)h+=warn(['info','Registra aquí el inductor y el bloqueante administrados, o selecciónalos en Plan SIR. El resumen solo incluye lo seleccionado.',`sin registrar: ${[!M.ind?'inductor':'',!M.nmb?'bloqueante':''].filter(Boolean).join(' y ')}`]);
 regWarn(p).forEach(w=>h+=warn(w));
 if(M.nmb==='roc')h+=warn(['prec','Rocuronio dura 45–70 min y el inductor solo minutos: inicia la analgosedación <b>ya</b> (riesgo de despertar paralizado).','rocuronio administrado']);
 else if(M.nmb==='vec')h+=warn(['prec','Vecuronio a dosis de SIR dura 60–90 min o más: inicia la analgosedación <b>ya</b>.','vecuronio administrado']);
 else if(M.nmb==='succ')h+=warn(['info','Succinilcolina: se recupera en 8–10 min'+(p.pche?' (con déficit de pseudocolinesterasa, horas)':'')+'. Para parálisis continua, primero un bolo de BNM no despolarizante.','succinilcolina administrada']);
 if(M.ind==='etom')h+=warn(['info','Etomidato: dosis única, efecto de 3–5 min. No repetir ni infundir.','etomidato administrado']);

 h+=`<div class="sec"><h3>Infusiones</h3>`;
 const B=BASIS.inf;
 if(M.anal==='fent'){
  if(CI.fent)h+=ciCard('fent','Fentanilo · analgesia');
  else{const st=low?0.5:1,bW=wt(B.fent,p).w;
  h+=infCard('fent','Fentanilo · analgesia',st,'mcg/kg/h',0.5,3,B.fent,`Rescate 0.5–1 mcg/kg (${r(0.5*bW)}–${r(bW)} mcg). Meta CPOT &lt; 3 o BPS &lt; 5.${p.hepa?' Hepatopatía: límite bajo.':''}`);}}
 if(M.adj&&M.sed!=='keta'){
  if(CI.keta)h+=ciCard('keta','Ketamina · coadyuvante');
  else h+=infCard('keta','Ketamina · coadyuvante',1,'mcg/kg/min',1,2,B.keta,'Ahorra opioide (PADIS 2018: bolo opcional de 0,5 mg/kg, omitir si se indujo con ketamina; luego 1–2 mcg/kg/min). Se toma solo la fracción de ampolla necesaria.'+(p.esc==='epoc'?' Broncodilatadora.':''));}
 const neuro=p.esc==='ich'||p.esc==='isq'||hasTce(p);
 if(M.sed==='prop'){
  if(CI.prop)h+=ciCard('prop','Propofol · sedación');
  else{const st=(low||p.esc==='ic')?5:10;
  h+=infCard('prop','Propofol · sedación',st,'mcg/kg/min',5,50,B.prop,`Puro, sin diluir. Desechar frasco y equipo a las 12 h (6 h si se pasa a jeringa). Titular de 5 en 5 mcg/kg/min.${neuro?' Preferido en neurocrítico.':''} ${p.esc==='sepsis'?'<b>Sepsis:</b> analgesia primero (fentanilo) y propofol a la menor dosis eficaz; reducir si cae la PA, sin suspender el vasopresor. ':''}Más de 4 mg/kg/h o 48 h: triglicéridos, CK y lactato.${M.bnm==='none'?' Al pasar a sedación ligera, PADIS 2025 sugiere dexmedetomidina antes que propofol.':''}`+(p.state!=='estable'?(p.esc==='sepsis'?' <b>Inestable: reduce la dosis o usa ketamina.</b>':' <b>Inestable: considera midazolam o ketamina.</b>'):''));}}
 if(M.sed==='mida'){const st=(old||p.erc||p.hepa)?0.02:0.03;
  h+=infCard('mida','Midazolam · sedación',st,'mg/kg/h',0.02,0.1,B.mida,`${p.esc==='sepsis'?'<b>Sepsis: evitar benzodiacepinas; solo si no hay alternativa.</b> ':''}Por estabilidad hemodinámica. Cambiar a propofol o dexmedetomidina cuando la PA lo permita (acumulación, delirium).${p.erc?' <b>ERC: acumula metabolitos activos.</b>':''}${p.hepa?' <b>Hepatopatía: aclaramiento reducido.</b>':''}`);}
 if(M.sed==='dex'){const st=low?0.2:0.4;
  h+=infCard('dex','Dexmedetomidina · sedación ligera',st,'mcg/kg/h',0.2,1.4,B.dex,prc('dex')+'<span class="offl">Tramo &gt; 0,7 mcg/kg/h: fuera de ficha FDA (0,2–0,7); la ficha EMA llega a 1,4, máximo que no debe superarse.</span> De elección para sedación ligera (PADIS 2025). Sin bolo de carga. Bradicardia e hipotensión. <b>No para sedación profunda ni con BNM continuo.</b>'+(p.esc==='raqui'?' Cuidado con la bradicardia medular.':''));}
 if(M.sed==='keta'){
  if(CI.keta)h+=ciCard('keta','Ketamina · analgosedación');
  else h+=infCard('keta','Ketamina · analgosedación',0.2,'mg/kg/h',0.1,0.5,B.keta,'<b>Sedante único fuera de guía</b> (PADIS sin recomendación): rango limitado a 0,1–0,5 mg/kg/h; asocia otro sedante si no alcanzas la meta. Mantiene el tono simpático; broncodilatadora. Hipertensión y taquicardia posibles; en falla cardiaca vigila la depresión miocárdica.');}
 if(M.sed==='none')h+=warn(['prec','Sin sedación: solo si está tranquilo con analgesia. Nunca con BNM.','sedación: ninguna']);
 if(M.bnm!=='none'){
  const deep=M.sed==='prop'||M.sed==='mida'||M.sed==='keta';
  h+=warn(['prec',`BNM continuo solo con indicación: SDRA grave temprano (ATS 2024, recomendación condicional; PaO₂/FiO₂ &lt; 150 en ensayos previos y &lt; 100 en la guía 2024), HIC refractaria, asincronía grave o escalofríos. Requiere RASS −5 y TOF (meta 1–2/4).${M.bnm!=='cis'?' <b>Aminoesteroide (rocuronio, vecuronio) con corticoides: riesgo de miopatía; prefiere cisatracurio y la menor duración posible.</b>':''}`,'bloqueo neuromuscular continuo']);
  const wN=wt(B[M.bnm],p);
  if(!deep)h+=`<div class="drug ci blockinf" role="alert"><div class="hd"><span class="nm">${NAMES[M.bnm]} · bloqueo continuo</span>${PILL.ci}</div><div class="why"><b>Bloqueado: combinación incompatible.</b> Con BNM continuo la sedación debe ser profunda. Elige propofol, midazolam o ketamina como sedación para calcular la infusión.<span class="cond">Condición: BNM continuo + ${M.sed==='dex'?'dexmedetomidina':'sin sedación'}</span></div></div>`;
  else if(CI[M.bnm])h+=bolus(M.bnm,0,'','ci','Contraindicado por '+CI[M.bnm].join('; ')+'.');
  else if(M.bnm==='roc')h+=infCard('roc','Rocuronio',8,'mcg/kg/min',8,12,B.roc,prc('roc')+'<span class="offl">Inicio 8 mcg/kg/min: por debajo de la ficha (10–12); titula por TOF.</span> '+(M.nmb==='succ'?`Tras succinilcolina, bolo de 0.6 mg/kg (${r(0.6*wN.w)} mg, ${wN.l}). `:'')+(p.hepa?'<b>Hepatopatía: prefiere cisatracurio.</b>':''));
  else if(M.bnm==='cis')h+=infCard('cis','Cisatracurio',3,'mcg/kg/min',0.5,10,B.cis,prc('cis')+`Ficha técnica: 3 mcg/kg/min en UCI (0,5–10,2), titular por TOF. Bolo 0.15 mg/kg (${r(0.15*wN.w)} mg, ${wN.l}) si no hay BNM activo. Eliminación de Hofmann: de elección en ERC o hepatopatía. Ampollas refrigeradas.`);
  else if(M.bnm==='vec')h+=infCard('vec','Vecuronio',1,'mcg/kg/min',0.8,1.7,B.vec,prc('vec')+'<span class="offl">Tramo &gt; 1,2 mcg/kg/min: fuera de ficha (0,8–1,2); 1,2–1,7 según compendios de UCI (PDR).</span> '+`${M.nmb==='vec'?'Iniciar cuando reaparezca respuesta en el TOF. ':`Bolo 0.1 mg/kg (${r(0.1*wN.w)} mg, ${wN.l}) si no hay BNM activo. `}Reconstituir con agua estéril; usar en 24 h. Se acumula en ERC y hepatopatía.`+(p.erc||p.hepa?' <b>Prefiere cisatracurio.</b>':''));
 }
 h+=`</div>`;
 let rass='RASS −1 a 0 una vez estabilizado.';
 if(M.bnm!=='none')rass='RASS −5 (obligatorio con BNM) + BIS 40–60 si está disponible.';
 else if(neuro)rass='RASS −2 a −4 si hay HIC; ventana diaria para exploración neurológica.';
 else if(p.esc==='epoc')rass='RASS −3 a −4 mientras haya broncoespasmo grave; luego aligerar.';
 h+=`<div class="sec"><h3>Metas</h3><ul class="t"><li>Sedación: ${rass}</li><li>Analgesia primero: CPOT &lt; 3 o BPS &lt; 5.</li><li>Vigila la hipotensión post-intubación los primeros 30 min.</li><li>Rotula cada mezcla: fármaco, cantidad, volumen, concentración, hora y responsable.</li></ul></div>
 <button class="cta" id="copy">Copiar resumen</button>`;
 $('maint').innerHTML=h;commaDom($('maint'));
 const map={mInd:'ind',mNmb:'nmb',mAnal:'anal',mSed:'sed',mBnm:'bnm'};
 Object.keys(map).forEach(id=>$(id).addEventListener('change',e=>{M[map[id]]=e.target.value;if(id==='mInd'||id==='mNmb')M.cleared='';renderMaint();if(id==='mInd'||id==='mNmb'){const y=window.scrollY;renderPlan();window.scrollTo(0,y);}}));
 $('mAdj').addEventListener('change',e=>{M.adj=e.target.value==='1';renderMaint();});
 document.querySelectorAll('#mH button').forEach(b=>b.addEventListener('click',()=>{M.H=+b.dataset.h;renderMaint();renderPlan();}));
 $('copy').addEventListener('click',copySummary);
}
/* Resumen: SOLO lo seleccionado (fuente única M), revalidado con los datos actuales. Sin opciones sugeridas ni medicamentos de rescate. */
function summaryText(){
 const p=P,L=[];
 L.push(`SIR — ${escTitle(p)}`);
 if(p.esc==='otro')L.push('AVISO: caso fuera de los escenarios validados; revisa cada decisión.');
 const CI=contraind(p);Object.keys(CI).forEach(id=>L.push(`CONTRAINDICADO: ${NAMES[id]} (${CI[id].join('; ')}).`));
 L.push(`${p.sexo==='M'?'H':'M'}, ${p.edad} a, ${p.w} kg, ${p.h} cm (IMC ${p.bmi.toFixed(1)}). PA ${p.pas}/${p.pad} (PAM ${Math.round(p.pam)})${p.fc?', FC '+p.fc+', IS '+p.si.toFixed(2):''}${p.spo2?', SpO2 '+p.spo2+'%':''}.`);
 const line=(label,c)=>{
  if(c.blocked)return `${label}: ${NAMES[c.id]} — ${{avoid:'EVITAR en este contexto',nd:'NO DISPONIBLE',ci:'CONTRAINDICADO'}[c.role]||'NO UTILIZABLE'}. ${c.why} Dosis no calculada; reconfirma la elección.`;
  if(!c.ok)return `${label}: ${NAMES[c.id]} (no calculado).`;
  if(!c.conf)return `${label}: ${NAMES[c.id]} — dosis por encima del techo de revisión pendiente de confirmar (no se incluye).`;
  return `${label}: ${NAMES[c.id]} ${c.k} ${c.unit}/kg ${r(c.dose)} ${c.unit} (${r(c.vol,'mL')} mL de ${r(c.bp.conc)} ${c.bp.u}). Preparación: ${c.bp.txt}${c.over?' (dosis por encima del techo de revisión, confirmada)':''}`;};
 const pre=pretreat(p);
 if(M.pre&&pre&&!CI.fent)L.push(line('Pretratamiento · T −3 min',bcalc('fent',pre.k)));
 const cI=selInd(p,inductors(p)),cN=selNmb(p,nmbList(p));
 L.push(cI?line('Inducción · T 0',cI):'Inducción · T 0: sin seleccionar.');
 L.push(cN?line('Bloqueo NM · T 0 +',cN):'Bloqueo NM · T 0 +: sin seleccionar.');
 const adm=[M.ind,M.nmb].filter(Boolean).map(id=>NAMES[id]);
 L.push(`Administrado: ${adm.length?adm.join(' + '):'sin registrar'}.`);
 const inf=[...document.querySelectorAll('#maint .inf')];
 if(inf.length){L.push(`Infusiones para ${M.H} h:`);inf.forEach(c=>L.push('• '+c.querySelector('.nm').textContent+': '+c.querySelector('.rate').textContent+'. '+[...c.querySelector('.prep').childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g,' ')));}
 return decComma(L.join('\n'));
}
function copySummary(){
 if(!P){toast('Primero calcula con datos válidos');return}
 const txt=summaryText();
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
function invalidate(){P=null;M.init=false;CONF={};placeholder('Los datos del paciente cambiaron. Pulsa <b>Continuar al Plan SIR</b> en Paciente para obtener dosis actualizadas.');}
/* Recalcula al cambiar escenario o sus opciones (sin mensajes en Paciente). */
function refresh(){P=null;M.init=false;compute(true);}
function compute(silent){
 const p=read(),v=validateFull(p),box=$('err');
 const noEsc=!p.esc;v.errors=v.errors.filter(e=>!/escenario clínico/.test(e));   // el escenario se elige en Plan SIR
 if(v.errors.length){
  P=null;placeholder('Hay datos que corregir en Paciente:<br>• '+v.errors.join('<br>• '));
  if(!silent){box.className='alert';box.innerHTML='<b>Corrige antes de calcular:</b><br>• '+v.errors.join('<br>• ');commaDom(box);}
  return false;
 }
 const sig=signature(p);
 if(v.warns.length&&sig!==confirmedSig){
  P=null;placeholder('Hay valores extremos pendientes de confirmar en Paciente.');
  if(!silent){box.className='alert w';box.innerHTML='<b>Valores inusuales — confirma que son correctos:</b><br>• '+v.warns.join('<br>• ')+'<button class="cta" id="confirmVals" type="button">Los datos son correctos · calcular</button>';commaDom(box);
   $('confirmVals').addEventListener('click',()=>{confirmedSig=sig;if(compute())show('v-plan');});}
  return false;
 }
 box.className='alert hide';
 if(noEsc){P=null;placeholder('Datos del paciente completos. <b>Selecciona el escenario clínico</b> arriba para calcular el plan.');return 'noesc';}
 try{P=derive(p);
  // Cambio de escenario o de estado hemodinámico: la selección previa deja de ser válida y se borra (se avisa).
  const ctx=P.esc+'|'+P.state;
  if(M.ctx&&M.ctx!==ctx&&(M.ind||M.nmb||M.pre)){M.cleared=[M.pre?'pretratamiento':'',M.ind?NAMES[M.ind]:'',M.nmb?NAMES[M.nmb]:''].filter(Boolean).join(' + ');M.ind='';M.nmb='';M.pre=false;}
  M.ctx=ctx;
  renderPlan();renderMaint();return true}
 catch(e){P=null;placeholder('No fue posible calcular con estos datos. Revísalos y vuelve a intentarlo.');return false}
}
function expBanner(){
 return `<div class="exp" role="note"><b>⚠ Atención:</b> algoritmo v${ALG.version} (${ALG.fecha}) · ${ALG.estado}. Verifica cada dosis antes de administrar.</div>`;
}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
 const v=b.dataset.v;if((v==='v-plan'||v==='v-inf')&&!P&&compute(true)!==true){show(v);return}
 show(v);
}));
$('calc').addEventListener('click',()=>{if(compute())show('v-plan');else window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})});
$('selOk').addEventListener('click',()=>{SEL_OK=true;$('selWarn').classList.add('hide');show('v-pac');toast('Presentaciones y duración verificadas');});
$('goSel').addEventListener('click',()=>show('v-sel'));
$('extra').addEventListener('change',refresh);
function renderExtra(){
 const x={poli:[['hemo','Hemorragia activa significativa'],['tce','TCE asociado']],raqui:[['tce','TCE asociado'],['sci72','Más de 48 h desde la lesión']],sangra:[['trauma','Origen traumático'],['tce','TCE asociado (origen traumático)']],isq:[['trombo','Candidato a trombólisis o trombectomía']],sepsis:[['vaso','Con vasopresor en curso']],iam:[['vd','Compromiso de ventrículo derecho']]}[S.esc]||[];
 $('extra').innerHTML=x.map(a=>`<label><input type="checkbox" id="${a[0]}">${a[1]}</label>`).join('');
}
document.querySelectorAll('#esc button[data-v]').forEach(b=>b.addEventListener('click',()=>{S.esc=b.dataset.v;document.querySelectorAll('#esc button[data-v]').forEach(x=>x.classList.toggle('on',x===b));$('esc').classList.add('picked');renderExtra();refresh();}));
// Tras elegir escenario se muestra solo el elegido, para que las dosis queden en la primera pantalla.
$('escChg').addEventListener('click',()=>$('esc').classList.remove('picked'));
/* Sin datos del paciente anterior al abrir o recargar (Firefox y Safari restauran casillas y campos). */
function clearPatient(){document.querySelectorAll('#v-pac input').forEach(e=>{if(e.type==='checkbox')e.checked=false;else e.value='';});}
clearPatient();
window.addEventListener('pageshow',e=>{if(e.persisted){clearPatient();invalidate();}});
document.querySelectorAll('#sexo button').forEach(b=>b.addEventListener('click',()=>{S.sexo=b.dataset.v;document.querySelectorAll('#sexo button').forEach(x=>x.classList.toggle('on',x===b));invalidate();}));
$('v-pac').addEventListener('input',invalidate);
$('v-pac').addEventListener('change',e=>{if(e.target.id!=='confirmVals')invalidate();});

/* ================= teclado (escritorio) ================= */
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&['1','2','3','4','5'].includes(e.key)){e.preventDefault();const v=['v-sel','v-pac','v-plan','v-inf','v-info'][+e.key-1];document.querySelector(`.tabs button[data-v="${v}"]`).click();}
 else if(e.key==='Enter'&&document.querySelector('#v-pac.on')&&e.target.tagName==='INPUT'){e.preventDefault();$('calc').click();}
});

/* ================= ajustes ================= */
function initSettings(){
 [['s-etom','etomOk'],['s-roc','rocOk'],['s-succ','succOk']].forEach(([id,k])=>{$(id).checked=ST[k];$(id).addEventListener('change',e=>{ST[k]=e.target.checked;save();if(P)refresh();})});
 renderPresList();
 const hs=()=>document.querySelectorAll('#s-h button').forEach(b=>b.classList.toggle('on',+b.dataset.h===ST.H));hs();
 document.querySelectorAll('#s-h button').forEach(b=>b.addEventListener('click',()=>{ST.H=M.H=+b.dataset.h;save();hs();if(P){renderPlan();renderMaint();}}));
 $('showDisc').addEventListener('click',()=>$('disc').classList.remove('hide'));
 $('okDisc').addEventListener('click',()=>{ST.disc=true;save();$('disc').classList.add('hide')});
 if(!ST.disc)$('disc').classList.remove('hide');
 const est=x=>ruleSrc(x)+' · Revisión '+ruleDate(x);
 $('rules').innerHTML=Object.keys(RULES).map(k=>`<li><b>${k}</b>${RULES[k].t}<small>${RULES[k].f}</small><small>${est(RULES[k])}</small>${(RULES[k].u||[]).map(([n,l])=>`<a href="${l}" target="_blank" rel="noopener">${n}</a>`).join('')}</li>`).join('');
 $('algv').textContent=`SirDoc ${ALG.version} · algoritmo v${ALG.version} (${ALG.fecha}) · ${ALG.estado}`;
}
initSettings();

/* Presentaciones: un selector por fármaco + opción "Otra" validada. */
function renderPresList(){
 const ORDER=['etom','keta','prop','fent','mida','dex','roc','succ','vec','cis','suga','nore'];
 $('presList').innerHTML=ORDER.map(k=>{
  const opts=PRES[k].map((x,i)=>`<option value="${i}"${SEL[k]===i?' selected':''}>${x.l}${x.src==='mvnd'?' · vital no disponible (importación)':''}</option>`).join('')+(PRES_LIM[k]&&!PRES[k][0].powder?`<option value="-1"${SEL[k]===-1?' selected':''}>Otra presentación…</option>`:'');
  const c=CUSTOM[k]||{},u=PRES[k][0].u;
  return `<div class="pres" data-k="${k}"><label><span>${NAMES[k]}</span><select id="ps-${k}" aria-label="Presentación de ${NAMES[k]}">${opts}</select></label>
  <div class="custom${SEL[k]===-1?'':' hide'}" id="pc-${k}"><input id="pa-${k}" type="text" inputmode="decimal" placeholder="${u}" value="${c.amt||''}" aria-label="Cantidad en ${u}"><span>${u} en</span><input id="pv-${k}" type="text" inputmode="decimal" placeholder="mL" value="${c.vol||''}" aria-label="Volumen en mL"><span>mL</span><button type="button" class="mini" id="pb-${k}">Usar</button></div>
  <div class="perr hide" id="pe-${k}" role="alert"></div></div>`;
 }).join('');
 ORDER.forEach(k=>{
  const sel=$('ps-'+k);if(!sel)return;
  sel.addEventListener('change',e=>{
   const v=+e.target.value;
   if(v===-1){$('pc-'+k).classList.remove('hide');return;}   // se aplica al pulsar "Usar"
   $('pc-'+k).classList.add('hide');$('pe-'+k).classList.add('hide');
   SEL[k]=v;delete CUSTOM[k];ST.pres[k]=v;save();if(P)compute(true);
  });
  const b=$('pb-'+k);if(b)b.addEventListener('click',()=>{
   const a=parseNum($('pa-'+k).value),v=parseNum($('pv-'+k).value),e=$('pe-'+k);
   const err=(!a.ok||!v.ok)?'Formato no válido: escribe solo números.':customErr(k,a.value,v.value);
   if(err){e.textContent=err;e.classList.remove('hide');return;}
   e.classList.add('hide');SEL[k]=-1;CUSTOM[k]={amt:a.value,vol:v.value};ST.pres[k]=-1;ST.custom[k]={amt:a.value,vol:v.value};save();
   toast(`${NAMES[k]}: ${a.value} ${PRES[k][0].u}/${v.value} mL en uso`);if(P)compute(true);
  });
 });
}

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
