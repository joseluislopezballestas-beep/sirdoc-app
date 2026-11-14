// Pruebas de interfaz (jsdom): flujo real con la app completa.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { JSDOM } = require('jsdom');
const INDEX = path.join(__dirname, '..', 'index.html');

async function app() {
  const dom = await JSDOM.fromFile(INDEX, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true });
  const w = dom.window; w.scrollTo = () => {};
  const errors = []; w.addEventListener('error', e => errors.push(e.message));
  await new Promise(res => w.addEventListener('load', res));
  const d = w.document;
  const $ = id => d.getElementById(id);
  const set = (id, v) => { $(id).value = String(v); $(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const fill = (esc, vals) => { d.querySelector(`#esc button[data-v="${esc}"]`).click(); for (const k in vals) set(k, vals[k]); };
  const calc = () => $('calc').click();
  const text = id => $(id).textContent.replace(/\s+/g, ' ');
  const doses = () => d.querySelectorAll('#plan .dose, #plan .syr .v, #maint .rate').length;
  return { w, d, $, set, fill, calc, text, doses, errors };
}
const OK = { edad: 45, peso: 70, talla: 175, pas: 120, pad: 80, fc: 85 };

test('cálculo válido muestra dosis y el aviso de uso experimental', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  assert.ok(a.doses() > 0); assert.match(a.text('plan'), /algoritmo v1\.1\.2/); assert.match(a.text('maint'), /sin validación clínica formal/);
  assert.deepEqual(a.errors, []);
});

test('al cambiar un dato tras calcular, no quedan resultados antiguos visibles', async () => {
  const a = await app(); a.fill('poli', OK); a.calc(); assert.ok(a.doses() > 0);
  a.set('peso', 90);
  assert.equal(a.doses(), 0); assert.match(a.text('plan'), /Sin resultados vigentes/); assert.match(a.text('maint'), /Sin resultados vigentes/);
});

test('el cambio de peso recalcula todas las dosis dependientes', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const roc70 = a.text('plan').match(/Bloqueo NM · T 0 \+ ?(\d+) mg/)[1];
  a.set('peso', 90); a.calc();
  const roc90 = a.text('plan').match(/Bloqueo NM · T 0 \+ ?(\d+) mg/)[1];
  a.set('peso', 100); a.calc();                                      // IMC 32,7 → peso ajustado (regla actual)
  const roc100 = a.text('plan').match(/Bloqueo NM · T 0 \+ ?(\d+) mg/)[1];
  assert.equal(roc70, '84'); assert.equal(roc90, '108');             // 1,2 mg/kg × peso real (sin obesidad)
  assert.equal(roc100, '99');                                         // 1,2 × (70,46 + 0,4 × 29,54) = 98,8
});

test('formato inválido: no se muestra ninguna dosis y se explica qué corregir', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: '8o' }); a.calc();
  assert.equal(a.doses(), 0); assert.match(a.text('err'), /Peso: formato no válido/);
  a.d.querySelector('.tabs button[data-v="v-plan"]').click();
  assert.equal(a.doses(), 0); assert.match(a.text('plan'), /Hay datos que corregir/);
});

test('decimal con coma es aceptado (80,5 kg)', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: '80,5' }); a.calc();
  assert.ok(a.doses() > 0); assert.match(a.text('plan'), /80\.5 ?kg real/);
});

test('datos ausentes, PAD ≥ PAS, negativos y edad pediátrica bloquean', async () => {
  for (const bad of [{ peso: '' }, { pad: 130 }, { peso: '-70' }, { edad: 15 }, { pas: 0 }]) {
    const a = await app(); a.fill('poli', { ...OK, ...bad }); a.calc();
    assert.equal(a.doses(), 0, JSON.stringify(bad)); assert.ok(!a.$('err').classList.contains('hide'));
  }
});

test('valores extremos posibles exigen confirmación antes de mostrar dosis', async () => {
  const a = await app(); a.fill('sangra', { ...OK, pas: 60, pad: 35, fc: 140 }); a.calc();
  assert.equal(a.doses(), 0); assert.match(a.text('err'), /PAS 60 mmHg muy baja/);
  a.$('confirmVals').click();
  assert.ok(a.doses() > 0);
  a.set('pas', 58); a.calc();                                        // otro dato → pide confirmar de nuevo
  assert.equal(a.doses(), 0); assert.ok(a.$('confirmVals'));
});

test('cambiar la presentación después de calcular actualiza la preparación', async () => {
  const a = await app(); a.fill('sangra', { ...OK, pas: 85, pad: 55, fc: 120 }); a.calc();   // shock → midazolam
  const before = a.text('maint'); assert.match(before, /Midazolam 50 mg\/10 mL/);
  const s = a.$('s-mida'); s.value = '2'; s.dispatchEvent(new a.w.Event('change'));
  const after = a.text('maint'); assert.match(after, /Midazolam 5 mg\/5 mL/); assert.notEqual(before, after);
});

test('el resumen copiado no incluye la firma del creador', async () => {
  const a = await app(); let copied = '';
  Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: t => { copied = t; return Promise.resolve(); } } });
  a.fill('poli', OK); a.calc(); a.d.querySelector('.tabs button[data-v="v-inf"]').click(); a.$('copy').click();
  assert.match(copied, /SIR — Politraumatizado/); assert.doesNotMatch(copied, /Ballestas/);
});

test('la dosis mostrada y el volumen mostrado son coherentes (volumen = dosis redondeada / concentración)', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: '80,5' }); a.calc();
  const m = a.text('plan').match(/Inducción · T 0 ?([\d.]+) mg ?([\d.]+) mL Etomidato/);
  assert.ok(m, 'fila de inducción'); assert.equal(Number(m[2]), Math.round(Number(m[1]) / 2 * 10) / 10);   // etomidato 2 mg/mL
});
