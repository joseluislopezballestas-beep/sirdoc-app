// Pruebas de interfaz (jsdom): flujo real con la app completa.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { JSDOM } = require('jsdom');
const INDEX = path.join(__dirname, '..', 'index.html');

// Almacenamiento en memoria (jsdom no ofrece localStorage en file://). Se puede precargar para simular una recarga.
function memStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m };
}
async function app(seed) {
  const store = memStorage(seed);
  const dom = await JSDOM.fromFile(INDEX, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: store, configurable: true }); } });
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
  assert.ok(a.doses() > 0); assert.match(a.text('plan'), /algoritmo v\d+\.\d+\.\d+/); assert.match(a.text('maint'), /sin validación clínica formal/);
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

test('[clínico] sugammadex 16 mg/kg solo como reversión inmediata tras rocuronio (ficha técnica)', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /reversión inmediata solo tras rocuronio/); assert.doesNotMatch(t, /Revierte rocuronio o vecuronio/);
  assert.doesNotMatch(t, /el sugammadex también lo revierte/);
});

test('[matriz] cada dosis muestra su regla, estado de fuente y aprobación', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /R-05 · Fuente identificada; texto completo no revisado · Aprobación clínica pendiente/);   // etomidato
  assert.match(t, /R-04 · Fuente pendiente de verificar/); assert.match(t, /R-09 ·/); assert.match(t, /R-10 ·/);
  assert.match(t, /R-01 · Fuente verificada · Aprobada por Md\. Jose Luis Lopez Ballestas/);                       // sugammadex
  assert.match(a.text('maint'), /R-12 ·/);
  const rules = a.d.querySelectorAll('#rules li'); assert.equal(rules.length, 16);
});

test('[H-07] las alertas llevan etiqueta de texto (no solo color)', async () => {
  const a = await app(); a.fill('sangra', { ...OK, pas: 85, pad: 55, fc: 120 }); a.calc();
  assert.match(a.text('plan'), /Riesgo alto: Shock/);
});

test('[H-17] talla baja: se avisa del peso ideal mínimo de 35 kg', async () => {
  const a = await app(); a.fill('poli', { ...OK, talla: 130, peso: 40 }); a.calc();
  assert.match(a.text('plan'), /peso ideal calculado \(.+ kg\) es menor de 35 kg/);
});

test('[H-18] el cronómetro se guarda, se restaura tras recargar y se detiene', async () => {
  const a = await app(); a.$('timer').click();
  const saved = Number(a.w.localStorage.getItem('sirdoc.t0'));
  try { assert.ok(saved > 0); } finally { a.$('timer').click(); }
  assert.equal(a.w.localStorage.getItem('sirdoc.t0'), null);
  const b = await app({ 'sirdoc.t0': String(Date.now() - 125000) });          // "recarga" 2 min 5 s después
  try { assert.match(b.$('timer').textContent, /BNM \+2:0[5-6]/); } finally { b.$('timer').click(); }
  const c = await app({ 'sirdoc.t0': String(Date.now() - 7 * 3600e3) });      // > 6 h: no se restaura
  assert.match(c.$('timer').textContent, /Marcar BNM/);
});

test('[v1.3.0] rocuronio 1,2 mg/kg también en shock (se retiró 1,6 mg/kg)', async () => {
  const a = await app(); a.fill('sangra', { ...OK, pas: 85, pad: 55, fc: 120 }); a.calc();
  const t = a.text('plan');
  assert.match(t, /Rocuronio1\.ª elección 84 mg/); assert.doesNotMatch(t, /1\.6 mg\/kg/);
});

test('[v1.3.0] contraindicación de succinilcolina desde 48 h y BNM en infusión según ficha', async () => {
  const a = await app();
  assert.match(a.d.querySelector('label:has(#quem)').textContent, /> 48 h/);
  a.fill('poli', OK); a.calc();
  const sel = a.$('mBnm'); sel.value = 'cis'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  assert.match(a.text('maint'), /Inicio 3 mcg\/kg\/min/); assert.match(a.text('maint'), /Rango 0\.5–10 mcg\/kg\/min/);
  const s2 = a.$('mBnm'); s2.value = 'roc'; s2.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  const m = a.text('maint');
  assert.match(m, /Inicio 8 mcg\/kg\/min/); assert.match(m, /Rango 8–12 mcg\/kg\/min/); assert.match(m, /corticoides: riesgo de miopatía/);
});

test('[v1.3.0] la matriz enlaza los estudios y no cita conversaciones de herramientas', async () => {
  const a = await app();
  const links = [...a.d.querySelectorAll('#rules a, .refs a')].map(x => x.href);
  assert.ok(links.length >= 20); assert.ok(links.every(h => /^https:\/\//.test(h)));
  assert.ok(links.some(h => h.includes('10.1164/rccm.202311-2011ST')));
  assert.doesNotMatch(a.d.body.textContent, new RegExp(['open', 'evidence'].join(''), 'i'));   // sin citas a conversaciones de herramientas
});

test('[v1.3.3] TOF ≥ 0,9 antes de extubar y guías ESAIC/ASA enlazadas', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /TOF ≥ 0,9/); assert.match(t, /sugammadex calculado y a mano/);
  const links = [...a.d.querySelectorAll('#rules a')].map(x => x.href);
  for (const d of ['10.1097/EJA.0000000000001769', '10.1097/ALN.0000000000004379', '10.1097/ALN.0000000000004002'])
    assert.ok(links.some(h => h.includes(d)), d);
});
