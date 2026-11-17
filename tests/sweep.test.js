// Barrido de regresión (M10): pacientes × fármacos × presentaciones × horas, con recálculo independiente.
// Falla ante cualquier discrepancia de dosis/h, concentración, velocidad, duración, estabilidad o recipiente.
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./engine-loader');
const E = load();
const derive = E.get('derive'), infPrep = E.get('infPrep'), infCard = E.get('infCard');
const run = code => E.get(code);

// Mismas pautas que usa la app en Infusiones (inicio, rango, unidad), con la base de peso de BASIS.inf.
const DRUGS = [['fent', [0.5, 1], 'mcg/kg/h', 0.5, 3], ['prop', [5, 10], 'mcg/kg/min', 5, 50], ['mida', [0.02, 0.03], 'mg/kg/h', 0.02, 0.1],
  ['dex', [0.2, 0.4], 'mcg/kg/h', 0.2, 1.4], ['keta', [1], 'mcg/kg/min', 1, 2], ['keta', [0.2], 'mg/kg/h', 0.1, 0.5],
  ['roc', [8], 'mcg/kg/min', 8, 12], ['cis', [3], 'mcg/kg/min', 0.5, 10], ['vec', [1], 'mcg/kg/min', 0.8, 1.7], ['nore', [0.05], 'mcg/kg/min', 0.05, 0.5]];
const NPRES = { fent: 2, prop: 2, mida: 3, dex: 3, keta: 1, roc: 1, cis: 1, vec: 1, nore: 1 };
const PAT = [];
for (const sexo of ['M', 'F']) for (const w of [35, 45, 55, 70, 85, 100, 120, 150, 200, 250, 300]) for (const h of [150, 158, 165, 172, 180, 188, 195]) PAT.push({ sexo, w, h });
// Pesos y dosis recalculados aquí, sin el código de la app
function W(sexo, w, h, basis) {
  const bmi = w / (h / 100) ** 2; if (bmi < 30 || basis === 'tbw') return w;
  const ibw = Math.max(35, (sexo === 'M' ? 50 : 45.5) + 0.9055 * (h - 152.4));
  return basis === 'ibw' ? ibw : basis === 'abw' ? ibw + 0.4 * (w - ibw) : 9270 * w / ((sexo === 'M' ? 6680 : 8780) + (sexo === 'M' ? 216 : 244) * bmi);
}
const shown = s => Number(s);

test('[barrido] infusiones: cálculo, estabilidad, recipiente y rotulado de concentración', t => {
  const BASIS = JSON.parse(JSON.stringify(run('BASIS'))), PRES = JSON.parse(JSON.stringify(run('PRES'))), INF = JSON.parse(JSON.stringify(run('INF')));
  let n = 0, capWarn = 0, multi = 0;
  for (const [id, starts, unit, lo, hi] of DRUGS) for (let pi = 0; pi < NPRES[id]; pi++) {
    run(`SEL.${id}=${pi}`);
    const pres = PRES[id][pi], basis = BASIS.inf[id], cap = INF[id].cap || 24;
    for (const P of PAT) for (const H of [6, 8, 10, 12]) for (const k of starts) {
      E.setP(derive({ esc: 'sepsis', sexo: P.sexo, edad: 50, w: P.w, h: P.h, pas: 120, pad: 80, fc: 80, spo2: 97 })); E.setH(H);
      const o = infPrep(id, k, unit, lo, hi, basis, H), tag = `${id}#${pi} ${P.sexo}${P.w}/${P.h} ${H}h k${k}`;
      // dosis/h en la unidad de la presentación
      const perH = k * W(P.sexo, P.w, P.h, basis) * (unit.endsWith('/min') ? 60 : 1) * (unit.startsWith('mcg') === (pres.u === 'mcg') ? 1 : unit.startsWith('mcg') ? 1 / 1000 : 1000);
      assert.ok(Math.abs(o.ph(k) - perH) <= 1e-6 * perH, `${tag}: dosis/h ${o.ph(k)} ≠ ${perH}`);
      const conc = o.conc, rate = perH / conc;
      assert.ok(Math.abs(o.rate(k) - rate) <= 1e-9 * rate, `${tag}: velocidad`);
      const dur = o.Vf / rate;
      assert.ok(dur + 1e-6 >= H, `${tag}: dura ${dur} < ${H} h`);
      // rotulado de concentración: ≤ 1 % de la real
      const m = o.cTxt.match(/^([\d.]+) (mg|mcg)\/mL$/); assert.ok(m, `${tag}: ${o.cTxt}`);
      const lab = shown(m[1]) / (m[2] === pres.u ? 1 : m[2] === 'mcg' ? 1000 : 1 / 1000);
      assert.ok(Math.abs(lab - conc) / conc <= 0.01, `${tag}: rótulo ${o.cTxt} vs ${conc}`);
      // estabilidad: nada que supere el tope sin aviso
      const html = infCard(id, 'X', k, unit, lo, hi, basis, '');
      if (dur > cap + 0.05) { assert.match(html, new RegExp(`tope de la app: ${cap} h\\). Desecha el sobrante`), `${tag}: dura ${dur.toFixed(1)} h sin aviso`); capWarn++; }
      else assert.doesNotMatch(html, /tope de la app/, `${tag}: aviso sin motivo`);
      // recipiente: siempre indicado; nada "sin diluir" > 50 mL en una sola jeringa
      assert.match(o.txt, /Recipiente: /, `${tag}: sin recipiente`);
      if (o.Vf > 50.05) { assert.doesNotMatch(o.cont, /^jeringa de 50 mL$/, `${tag}: ${o.Vf} mL en una jeringa`); if (/sin diluir/.test(o.txt)) { assert.match(o.cont, /jeringas de 50 mL|frasco/, tag); multi++; } }
      n++;
    }
    run(`SEL.${id}=0`);
  }
  t.diagnostic(`preparaciones: ${n}; con aviso de estabilidad: ${capWarn}; sin diluir > 50 mL con recipiente múltiple: ${multi}`);
  assert.ok(n > 10000, `preparaciones: ${n}`);
});
