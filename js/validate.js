'use strict';
/* =========================================================================
   Validación de datos del paciente (función pura, sin DOM).
   - errors: impiden calcular. Datos ausentes, formato inválido, valores
     físicamente imposibles o fuera del rango de uso de la app.
   - warns: valores inusuales pero posibles. Requieren confirmación explícita
     del usuario antes de mostrar dosis.
   Los límites son de PLAUSIBILIDAD de datos, no recomendaciones clínicas.
   ========================================================================= */
const FIELDS={
 edad:{n:'Edad',u:'años',req:true,min:18,max:120},
 w:{n:'Peso',u:'kg',req:true,min:30,max:300},
 h:{n:'Talla',u:'cm',req:true,min:120,max:230},
 pas:{n:'PAS',u:'mmHg',req:true,min:30,max:300},
 pad:{n:'PAD',u:'mmHg',req:true,min:10,max:200},
 fc:{n:'FC',u:'lpm',req:true,min:20,max:250},
 spo2:{n:'SpO₂',u:'%',req:true,min:40,max:100}
};

function validateFull(p){
 const errors=[],warns=[];
 if(!p.esc)errors.push('Selecciona el escenario clínico.');
 const fmt=p._fmt||[];
 fmt.forEach(k=>errors.push(`${FIELDS[k].n}: formato no válido. Escribe solo números (decimales con coma o punto).`));
 const missing=Object.keys(FIELDS).filter(k=>FIELDS[k].req&&p[k]==null&&!fmt.includes(k)).map(k=>FIELDS[k].n);
 if(missing.length)errors.push(`Faltan datos obligatorios: ${missing.join(', ')}.`);
 Object.keys(FIELDS).forEach(k=>{
  const f=FIELDS[k],v=p[k];if(v==null)return;
  if(k==='edad'&&v<18){errors.push('Edad < 18 años: la app es solo para adultos; la dosificación pediátrica es distinta.');return}
  if(v<f.min||v>f.max)errors.push(`${f.n} ${v} ${f.u} fuera del rango admitido (${f.min}–${f.max} ${f.u}). Verifica el dato.`);
 });
 if(p.pas!=null&&p.pad!=null&&p.pad>=p.pas)errors.push(`PAD (${p.pad}) debe ser menor que PAS (${p.pas}).`);
 if(errors.length)return {errors,warns};

 // Valores extremos posibles → confirmación
 if(p.pas<70)warns.push(`PAS ${p.pas} mmHg muy baja.`);
 if(p.pas>230)warns.push(`PAS ${p.pas} mmHg muy alta.`);
 if(p.pad>130)warns.push(`PAD ${p.pad} mmHg muy alta.`);
 if(p.pas-p.pad<15)warns.push(`Presión de pulso de ${p.pas-p.pad} mmHg: confirma PAS y PAD.`);
 if(p.fc!=null&&(p.fc<40||p.fc>160))warns.push(`FC ${p.fc} lpm extrema.`);
 if(p.spo2!=null&&p.spo2<80)warns.push(`SpO₂ ${p.spo2} % muy baja.`);
 if(p.edad>100)warns.push(`Edad ${p.edad} años.`);
 const bmi=p.w/((p.h/100)**2);
 if(bmi<16||bmi>50)warns.push(`IMC ${bmi.toFixed(1)}: confirma peso (${p.w} kg) y talla (${p.h} cm).`);
 return {errors,warns};
}
const validate=p=>validateFull(p).errors;
/* Firma de los datos: la confirmación de valores extremos vale solo para estos datos exactos. */
const signature=p=>JSON.stringify([p.esc,p.sexo,p.edad,p.w,p.h,p.pas,p.pad,p.fc,p.spo2]);

if(typeof module!=='undefined')module.exports={FIELDS,validateFull,validate,signature};
