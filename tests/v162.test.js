// v1.6.2: correcciones del informe de pruebas por escenario (H-01 a H-12) y matriz de reglas por escenario.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
function memStorage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
async function app() {
  const dom = await JSDOM.fromFile(INDEX, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: memStorage(), configurable: true }); } });
  const w = dom.window; w.scrollTo = () => {};
  const errors = []; w.addEventListener('error', e => errors.push(e.message));
  await new Promise(res => w.addEventListener('load', res));
  const d = w.document, $ = id => d.getElementById(id);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
  const set = (id, v) => { $(id).value = String(v); ev($(id), 'input'); };
  const check = id => { $(id).checked = true; ev($(id), 'change'); };
  const run = (e, vals, checks = []) => {
    if (vals.sexo) d.querySelector(`#sexo button[data-v="${vals.sexo}"]`).click();
    for (const k of ['edad', 'peso', 'talla', 'pas', 'pad', 'fc', 'spo2']) set(k, vals[k]);
    d.querySelector(`#esc button[data-v="${e}"]`).click(); checks.forEach(check);
    $('calc').click(); const c = $('confirmVals'); if (c) c.click();
  };
  const text = id => $(id).textContent.replace(/\s+/g, ' ');
  return { w, d, $, run, text, errors, close: () => w.close(), state: () => w.eval('P&&P.state'), summary: () => w.eval('summaryText()') };
}
const PROF = {
  estable: { sexo: 'M', edad: 45, peso: 70, talla: 175, pas: 125, pad: 80, fc: 85, spo2: 96 },
  riesgo: { sexo: 'F', edad: 60, peso: 65, talla: 160, pas: 95, pad: 60, fc: 105, spo2: 92 },
  shock: { sexo: 'M', edad: 55, peso: 80, talla: 172, pas: 75, pad: 45, fc: 130, spo2: 88 },
  obeso: { sexo: 'M', edad: 50, peso: 140, talla: 170, pas: 130, pad: 85, fc: 95, spo2: 93 },
  anciano: { sexo: 'F', edad: 85, peso: 50, talla: 150, pas: 110, pad: 65, fc: 90, spo2: 94 },
  hta: { sexo: 'M', edad: 65, peso: 85, talla: 178, pas: 200, pad: 115, fc: 100, spo2: 95 },
};
const EXTRA = { poli: [[], ['hemo'], ['hemo', 'tce'], ['tce']], raqui: [[], ['sci72'], ['tce']], sangra: [[], ['trauma'], ['trauma', 'tce']], isq: [[], ['trombo']], sepsis: [[], ['vaso']], iam: [[], ['vd']] };
const ESCS = ['poli', 'raqui', 'sangra', 'epoc', 'ich', 'isq', 'ic', 'sepsis', 'iam', 'otro'];
const outsideBanner = a => { const c = a.$('plan').cloneNode(true); c.querySelectorAll('.exp').forEach(e => e.remove()); return c.textContent.replace(/\s+/g, ' '); };

test('[matriz] 10 escenarios × 6 perfiles × casillas: sin errores, sin valores inválidos, coma decimal y condiciones coherentes', async () => {
  let n = 0;
  for (const e of ESCS) for (const pk in PROF) for (const ex of (EXTRA[e] || [[]])) {
    const a = await app(); a.run(e, PROF[pk], ex); n++;
    const tag = `${e}/${pk}/${ex.join('+')}`, plan = outsideBanner(a), maint = a.text('maint'), sum = a.summary(), st = a.state();
    assert.deepEqual(a.errors, [], tag);
    assert.match(plan, /Inducción · opciones/, `${tag}: sin plan`);
    assert.doesNotMatch(plan + maint + sum, /NaN|undefined|Infinity/, tag);
    assert.doesNotMatch(plan.replace(/\d+\.ª/g, ''), /(?<![\w.])\d+\.\d{1,2}(?![\d.])/, `${tag}: punto decimal en el plan`);
    assert.doesNotMatch(sum.replace(/v\d+\.\d+\.\d+/g, ''), /(?<![\w.])\d+\.\d{1,2}(?![\d.])/, `${tag}: punto decimal en el resumen`);
    // Ninguna condición mostrada contradice los datos del paciente.
    if (st !== 'shock') assert.doesNotMatch(plan, /Condición: (choque séptico|shock:)/, `${tag}: condición de shock sin shock`);
    if (!(e === 'poli' && ex.includes('hemo')) && !(e === 'sangra' && ex.includes('trauma') && !ex.includes('tce'))) assert.doesNotMatch(plan, /Hipotensión permisiva/, `${tag}: hipotensión permisiva fuera de su condición`);
    if (ex.includes('tce')) assert.doesNotMatch(plan, /Hipotensión permisiva/, `${tag}: permisiva con TCE`);
    a.close();
  }
  assert.equal(n, 120);
});

test('[H-01] meta de PA con TCE por edad, igual en politrauma, raquimedular y sangrado traumático', async () => {
  for (const [edad, lim] of [[45, 110], [60, 100], [69, 100], [80, 110]]) {
    for (const [e, ex] of [['poli', ['tce']], ['raqui', ['tce']], ['sangra', ['trauma', 'tce']]]) {
      const a = await app(); a.run(e, { ...PROF.estable, edad }, ex);
      assert.match(a.text('plan'), new RegExp(`PAS ≥ ${lim} mmHg; evitar SpO₂ < 90 %`), `${e} edad ${edad}`); a.close();
    }
  }
});

test('[H-03] sangrado: TCE solo cuenta si el origen es traumático', async () => {
  let a = await app(); a.run('sangra', PROF.estable, ['tce']);
  assert.match(a.text('plan'), /PAM ≥ 65 mmHg/); assert.doesNotMatch(a.text('plan'), /Paciente sangrando \+ TCE/); a.close();
  a = await app(); a.run('sangra', PROF.estable, ['trauma', 'tce']);
  assert.match(a.text('plan'), /Paciente sangrando \+ TCE/); assert.match(a.text('plan'), /Normocapnia/); a.close();
});

test('[H-04] sepsis sin shock: sin corticoides ni condición de choque; con vasopresor o shock, sí', async () => {
  let a = await app(); a.run('sepsis', PROF.estable);
  assert.doesNotMatch(a.text('plan'), /Corticoides IV/); assert.match(a.text('plan'), /Sin shock ni vasopresor: vigilar PA/); a.close();
  for (const [prof, ex] of [['estable', ['vaso']], ['shock', []]]) {
    a = await app(); a.run('sepsis', PROF[prof], ex);
    assert.match(a.text('plan'), /Corticoides IV sugeridos/); assert.match(a.text('plan'), /Condición: choque séptico/); a.close();
  }
});

test('[H-05] pretratamiento no indicado: el motivo corresponde al paciente', async () => {
  let a = await app(); a.run('ic', PROF.hta);
  assert.match(a.text('plan'), /PretratamientoNo indicado en este escenario con estos datos/); assert.doesNotMatch(a.text('plan'), /No indicado en este contexto \(riesgo de hipotensión\)/); a.close();
  a = await app(); a.run('ic', PROF.shock);
  assert.match(a.text('plan'), /PretratamientoNo indicado: riesgo de hipotensión \(shock/); a.close();
});

test('[H-06] «Dosis para» nombra cada condición que cambió la dosis', async () => {
  let a = await app(); a.run('otro', PROF.hta);
  assert.match(a.text('plan'), /Propofol.*?Dosis para: edad ≥ 65 años \(propofol\)/); a.close();
  a = await app(); a.run('poli', PROF.anciano);
  assert.match(a.text('plan'), /Etomidato.*?Dosis para: riesgo de hipotensión: IS ≥ 0,8 · edad ≥ 75 años/); a.close();
});

test('[H-08] ictus isquémico en shock: primero corregir la hipotensión, sin metas de reducción', async () => {
  for (const ex of [[], ['trombo']]) {
    const a = await app(); a.run('isq', PROF.shock, ex); const t = a.text('plan');
    assert.match(t, /Primero corregir la hipotensión/); assert.doesNotMatch(t, /< 185\/110 antes de la trombólisis|reducción inicial ≈ 15 %/); a.close();
  }
});

test('[H-09] hemoderivados una sola vez (Preparación), no repetidos en Metas', async () => {
  const a = await app(); a.run('poli', PROF.shock, ['hemo']); const t = a.text('plan');
  const metas = t.split('Metas')[1].split('Secuencia')[0];
  assert.doesNotMatch(metas, /Hemoderivados/); assert.match(t, /Hemoderivados y control del sangrado primero/); a.close();
});

test('[H-10, H-12, marca de agua] colores y posición', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/app.css'), 'utf8');
  const rc = css.match(/\.rescond\{[^}]+\}/)[0];
  assert.doesNotMatch(rc, /--bad/); assert.match(rc, /--warn/);
  assert.match(css.match(/#toast\{[^}]+\}/)[0], /top:/);
  assert.ok(Number(css.match(/#wm\{[^}]*opacity:([\d.]+)/)[1]) <= 0.02);
});

test('[H-11] fila superior: dosis sugerida visible y «Usar» la selecciona; la preparación crítica queda abierta', async () => {
  let a = await app(); a.run('poli', PROF.estable);
  const row = a.d.querySelector('#plan .syr .row');
  assert.match(row.textContent, /Etomidato/); assert.match(row.querySelector('.v').textContent, /21 mg/);
  assert.match(a.summary(), /Inducción · T 0: sin seleccionar/, 'una sugerencia no es una selección');
  row.querySelector('.usebtn').click();
  assert.match(a.summary(), /Inducción · T 0: Etomidato 0,3 mg\/kg 21 mg/);
  assert.equal(a.d.querySelector('#plan details.step').open, false, 'preparación plegada en paciente estable'); a.close();
  a = await app(); a.run('poli', PROF.shock, ['hemo']);
  assert.equal(a.d.querySelector('#plan details.step').open, true, 'preparación abierta con hemoderivados o vasopresor');
  assert.match(a.d.querySelector('#plan details.step summary').textContent, /pasos críticos antes de inducir/); a.close();
});
