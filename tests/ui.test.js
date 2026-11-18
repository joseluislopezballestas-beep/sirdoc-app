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
  const pick = (cat, id) => { const b = d.querySelector(`#plan .selbtn[data-sel="${cat}"][data-id="${id}"]`); if (!b) throw new Error('sin botón ' + cat + ' ' + id); b.click(); };
  return { w, d, $, set, fill, calc, text, doses, errors, pick };
}
const OK = { edad: 45, peso: 70, talla: 175, pas: 120, pad: 80, fc: 85, spo2: 97 };

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
  const a = await app(); a.fill('poli', OK); a.calc(); a.pick('nmb', 'roc');
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
  assert.ok(a.doses() > 0); assert.match(a.text('plan'), /80,5 ?kg real/);
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
  const s = a.$('ps-mida'); s.value = '2'; s.dispatchEvent(new a.w.Event('change'));
  const after = a.text('maint'); assert.match(after, /Midazolam 5 mg\/5 mL/); assert.notEqual(before, after);
});

test('el resumen copiado no incluye la firma del creador', async () => {
  const a = await app(); let copied = '';
  Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: t => { copied = t; return Promise.resolve(); } } });
  a.fill('poli', OK); a.calc(); a.d.querySelector('.tabs button[data-v="v-inf"]').click(); a.$('copy').click();
  assert.match(copied, /SIR — Politraumatizado/); assert.doesNotMatch(copied, /Ballestas/);
});

test('la dosis mostrada y el volumen mostrado son coherentes (volumen = dosis redondeada / concentración)', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: '80,5' }); a.calc(); a.pick('ind', 'etom');
  const m = a.text('plan').match(/Inducción · T 0 ?([\d.,]+) mg ?([\d.,]+) mL Etomidato/);
  assert.ok(m, 'fila de inducción'); assert.equal(Number(m[2].replace(',','.')), Math.round(Number(m[1].replace(',','.')) / 2 * 10) / 10);   // etomidato 2 mg/mL
});

test('[clínico] sugammadex 16 mg/kg solo como reversión inmediata tras rocuronio (ficha técnica)', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /reversión inmediata solo tras rocuronio/); assert.doesNotMatch(t, /Revierte rocuronio o vecuronio/);
  assert.doesNotMatch(t, /el sugammadex también lo revierte/);
});

test('[matriz v1.7.0] reglas R-xx solo en Info: el plan y las infusiones no muestran numeración ni estado de fuente', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  for (const id of ['plan', 'maint']) {
    assert.doesNotMatch(a.text(id), /\bR-\d{2}\b/, id);
    assert.doesNotMatch(a.text(id), /Fuente (verificada|identificada|pendiente)|Revisión \d{2}\/\d{2}\/\d{4}/, id);
  }
  const rules = a.d.querySelectorAll('#rules li'); assert.equal(rules.length, 21);
  const info = a.text('rules');
  assert.match(info, /R-05/); assert.match(info, /R-01/); assert.match(info, /Fuente verificada/); assert.match(info, /Revisión 14\/11\/2026/);
});

test('[H-07] las alertas llevan etiqueta de texto (no solo color)', async () => {
  const a = await app(); a.fill('sangra', { ...OK, pas: 85, pad: 55, fc: 120 }); a.calc();
  assert.match(a.text('plan'), /⚠Precaución.*Riesgo alto de colapso.*Condición: shock: PAS < 90/);
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
  assert.match(t, /Rocuronio✓ 1\.ª elección 84 mg/); assert.doesNotMatch(t, /1,6 mg\/kg/);
});

test('[v1.3.0] contraindicación de succinilcolina desde 48 h y BNM en infusión según ficha', async () => {
  const a = await app();
  assert.match(a.d.querySelector('label:has(#quem)').textContent, /> 48 h/);
  a.fill('poli', OK); a.calc();
  const sel = a.$('mBnm'); sel.value = 'cis'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  assert.match(a.text('maint'), /Inicio 3 mcg\/kg\/min/); assert.match(a.text('maint'), /Rango 0,5–10 mcg\/kg\/min/);
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

test('[v1.3.4] succinilcolina 1 mg/kg por peso real (ESAIC 2023)', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /SuccinilcolinaAlternativa 70 mg7(,0)? mL · 10 mg\/mL 1 mg\/kg × 70 kg \(peso real\) · rango 0,3–1,1/);
});

test('[v1.3.5] sepsis: etomidato de elección, metas SSC 2026 y vasopresor en curso = shock', async () => {
  const a = await app(); a.fill('sepsis', { ...OK, edad: 70 }); a.calc();
  let t = a.text('plan');
  assert.match(t, /Sepsis \/ choque séptico/); assert.match(t, /PAM inicial 60–65 mmHg \(SSC 2026\)\.Condición: sepsis · edad ≥ 65 años/);
  assert.match(t, /Etomidato✓ 1\.ª elección/); assert.match(t, /Dosis de inductor reducidas aunque la PA sea normal\.Condición: sepsis/);
  a.fill('sepsis', { ...OK }); a.$('vaso').checked = true; a.$('vaso').dispatchEvent(new a.w.Event('change', { bubbles: true })); a.calc();
  t = a.text('plan'); assert.match(t, /Riesgo alto de colapso.*Condición: shock: vasopresor en curso/); assert.match(t, /Norepinefrina 0,05 mcg\/kg\/min/);
  assert.deepEqual(a.errors, []);
});

test('[v1.3.5] IAM: oxígeno según ACC/AHA 2025, fentanilo si PA alta y VD', async () => {
  const a = await app(); a.fill('iam', { ...OK, pas: 160, pad: 95 }); a.calc();
  let t = a.text('plan');
  assert.match(t, /Infarto agudo de miocardio/); assert.match(t, /SpO₂ < 90 % \(ACC\/AHA 2025\)/);
  assert.match(t, /Parches de desfibrilación/); assert.match(t, /consumo miocárdico de O₂/); assert.match(a.text('rules'), /R-18/);
  a.$('vd').checked = true; a.$('vd').dispatchEvent(new a.w.Event('change', { bubbles: true })); a.calc();
  assert.match(a.text('plan'), /Compromiso de VD/);
  assert.deepEqual(a.errors, []);
});

test('[v1.3.6] sepsis: sedación sin midazolam por defecto, hidrocortisona y líquidos; IAM: fentanilo por taquicardia', async () => {
  const a = await app(); a.fill('sepsis', { ...OK, pas: 85, pad: 50, fc: 120 }); a.calc();
  const t = a.text('plan');
  assert.match(t, /hidrocortisona 200 mg\/día/); assert.match(t, /30 mL\/kg en las primeras 3 h/); assert.match(t, /0,25–0,5 mcg\/kg\/min/);
  assert.match(a.text('rules'), /R-17/);
  const m = a.text('maint'); assert.match(m, /Propofol · sedación/); assert.doesNotMatch(m, /Midazolam · sedación/);
  const b = await app(); b.fill('iam', { ...OK, pas: 135, pad: 85, fc: 105 }); b.calc();
  const u = b.text('plan');
  assert.match(u, /Fentanilo/); assert.match(u, /rango 1–3/); assert.match(u, /SpO₂ 92–96 %/); assert.match(u, /No usar betabloqueadores ni esmolol/);
  assert.match(u, /No intubar de forma profiláctica/); assert.match(a.text('rules'), /R-18/);
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []);
});

test('[v1.3.7] en pantalla solo estado de la fuente y fecha de revisión (sin aprobación)', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const all = a.text('plan') + a.text('maint') + [...a.d.querySelectorAll('#rules li')].map(x => x.textContent).join(' ');
  assert.doesNotMatch(all, /Aprobada|Aprobación|Md\. Jose Luis/);
  assert.match(a.d.querySelector('#rules li').textContent, /Fuente verificada · Revisión 14\/11\/2026/);
});

test('[v1.5] resumen: SOLO lo seleccionado (ketamina + rocuronio no genera etomidato) y sin rescate', async () => {
  const a = await app(); a.fill('ic', { edad: 76, peso: 72, talla: 165, pas: 198, pad: 112, fc: 95, spo2: 95 }); a.calc();
  let sum = a.w.eval('summaryText()');
  assert.match(sum, /Inducción · T 0: sin seleccionar\./); assert.match(sum, /Bloqueo NM · T 0 \+: sin seleccionar\./);
  assert.match(sum, /Administrado: sin registrar\./); assert.doesNotMatch(sum, /Etomidato|Rocuronio|Epinefrina/);
  assert.match(a.text('plan'), /Inducción · T 0 ?[\d,]+ mg ?[\d,]+ mL ?Etomidato Sugerido · sin seleccionar/);
  a.pick('ind', 'keta'); a.pick('nmb', 'roc');
  sum = a.w.eval('summaryText()');
  assert.match(sum, /Inducción · T 0: Ketamina [\d.,]+ mg\/kg [\d.,]+ mg \([\d.,]+ mL de 10 mg\/mL\)/);
  assert.match(sum, /Bloqueo NM · T 0 \+: Rocuronio 1,2 mg\/kg 86 mg \(8,6 mL de 10 mg\/mL\)/);
  assert.match(sum, /Administrado: Ketamina \+ Rocuronio\./);
  assert.doesNotMatch(sum, /Etomidato/); assert.doesNotMatch(sum, /Epinefrina/);
  // la selección del plan y el registro "Administrado" son el mismo dato
  assert.equal(a.$('mInd').value, 'keta'); assert.equal(a.$('mNmb').value, 'roc');
  a.$('mInd').value = 'etom'; a.$('mInd').dispatchEvent(new a.w.Event('change', { bubbles: true }));
  assert.match(a.w.eval('summaryText()'), /Inducción · T 0: Etomidato/);
  assert.match(a.d.querySelector('#plan .selbtn.on[data-sel="ind"]').dataset.id, /etom/);
  assert.match(a.text('plan'), /Inducción · T 0 ?[\d.,]+ mg ?[\d.,]+ mL ?Etomidato/);
  assert.deepEqual(a.errors, []);
});

test('[v1.5] pestañas en orden, advertencia de presentaciones, FC y SpO₂ obligatorias, epinefrina solo de rescate', async () => {
  const a = await app();
  assert.deepEqual([...a.d.querySelectorAll('.tabs button')].map(b => b.dataset.v), ['v-sel', 'v-pac', 'v-plan', 'v-inf', 'v-info']);
  assert.ok(a.$('v-sel').classList.contains('on'));
  assert.match(a.$('v-sel').querySelector('.wn-prec').textContent, /ADVERTENCIA|Advertencia: verifique antes de continuar/i);
  assert.ok(a.$('v-sel').querySelector('#presList') && a.$('v-sel').querySelector('#s-h'));
  assert.ok(a.$('v-plan').querySelector('#esc'), 'el escenario se elige en Plan SIR');
  assert.doesNotMatch(a.$('v-pac').textContent, /opcional/i);
  a.fill('poli', { ...OK, fc: '', spo2: '' }); a.calc();
  assert.match(a.text('err'), /Faltan datos obligatorios: FC, SpO₂/); assert.equal(a.d.querySelectorAll('#plan .dose').length, 0);
  a.fill('poli', OK); a.calc();
  assert.match(a.text('plan'), /EPINEFRINA PUSH-DOSE: 10–20 mcg.*CONDICIÓN DE ADMINISTRACIÓN: administrar exclusivamente como medida de rescate ante hipotensión peri-intubación/);
  assert.match(a.text('plan'), /Rescate · solo si hipotensión peri-intubación/);
  a.$('selOk').click(); assert.ok(a.$('selWarn').classList.contains('hide'));
});

test('[v1.5] sin escenario: los datos se validan en Paciente y el plan pide elegir escenario', async () => {
  const a = await app();
  for (const k in OK) { a.$(k === 'peso' ? 'peso' : k).value = String(OK[k]); }
  a.$('calc').click();
  assert.ok(a.$('v-plan').classList.contains('on')); assert.match(a.text('plan'), /Selecciona el escenario clínico/);
  a.d.querySelector('#esc button[data-v="sepsis"]').click();
  assert.ok(a.d.querySelectorAll('#plan .dose').length > 0, 'al elegir el escenario se calcula el plan');
});
