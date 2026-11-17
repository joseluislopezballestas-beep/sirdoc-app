'use strict';
/* =========================================================================
   Utilidades puras (sin DOM). Reglas de redondeo de presentación:
   - Dosis (mg, mcg, kg): < 20 → 1 decimal; ≥ 20 → entero.
   - Volúmenes (mL): < 1 → 2 decimales; < 10 → 1 decimal; ≥ 10 → 1 decimal.
   - Horas: 1 decimal; ≥ 24 se muestra "> 24".
   - Concentración de mezclas (rc): 3 cifras significativas.
   El redondeo afecta SOLO a lo que se muestra; los cálculos usan el valor exacto.
   ========================================================================= */
function r(x,unit){ if(x==null||isNaN(x)||!isFinite(x))return '–';
 if(unit==='mL') return x<1?x.toFixed(2):x<10?x.toFixed(1):(Math.round(x*10)/10)+'';
 if(unit==='h') return x>=24?'> 24':(Math.round(x*10)/10)+'';
 return x<20?(Math.round(x*10)/10)+'':Math.round(x)+''; }
/* Redondeo de una dosis a la precisión que se muestra (< 20 → 0,1; ≥ 20 → 1).
   El volumen se calcula a partir de la dosis YA redondeada, para que dosis y mL coincidan. */
/* Concentración de una mezcla: 3 cifras significativas (error de rotulado ≤ 0,5 %), nunca redondeo a 1 decimal. */
function rc(x){ if(x==null||isNaN(x)||!isFinite(x))return '–'; return x>=100?String(Math.round(x)):String(Number(x.toPrecision(3))); }
function roundDose(x){return x<20?Math.round(x*10)/10:Math.round(x)}
const plural=(n,s,p)=>n+' '+(n===1?s:p);

/* Interpreta un número escrito por el usuario. Acepta coma o punto decimal.
   Devuelve {ok:true,value} | {ok:true,value:null} (vacío) | {ok:false} (formato inválido). */
function parseNum(raw){
 const s=String(raw==null?'':raw).trim().replace(',','.');
 if(s==='')return {ok:true,value:null};
 if(!/^\d+(\.\d+)?$/.test(s))return {ok:false,value:null};
 const v=Number(s);
 return isFinite(v)?{ok:true,value:v}:{ok:false,value:null};
}

/* Un número es utilizable como dosis, volumen o velocidad solo si es finito y > 0. */
const usable=x=>typeof x==='number'&&isFinite(x)&&x>0;

/* Coma decimal (es-CO) en lo que se muestra. No toca versiones (v1.6.1), separadores de miles (2.000) ni números pegados a letras. */
function decComma(s){return String(s).replace(/(?<![\w.])(\d+)\.(\d+)(?![.\d])/g,(m,a,b)=>(b.length===3&&a!=='0')?m:a+','+b);}
function commaDom(root){if(!root)return;const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest('.exp,script,style')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 for(let n=w.nextNode();n;n=w.nextNode()){const t=decComma(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t;}}
if(typeof module!=='undefined')module.exports={r,rc,roundDose,plural,parseNum,usable,decComma};
