// Criterios de aceptación de la matriz de medidas v1.5.0 → v1.6.0 (M01–M26).
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
  const check = (id, on = true) => { $(id).checked = on; ev($(id), 'change'); };
  const esc = e => d.querySelector(`#esc button[data-v="${e}"]`).click();
  const fill = (e, vals, checks = []) => { esc(e); for (const k in vals) set(k, vals[k]); checks.forEach(c => check(c)); };
  const calc = () => { $('calc').click(); const c = $('confirmVals'); if (c) c.click(); };
  const sel = (id, v) => { $(id).value = v; ev($(id), 'change'); };
  const pick = (cat, id) => { const b = d.querySelector(`#plan .selbtn[data-sel="${cat}"][data-id="${id}"]`); if (!b) throw new Error('sin botón ' + cat + ' ' + id); b.click(); };
  const text = id => $(id).textContent.replace(/\s+/g, ' ');
  const row = i => d.querySelectorAll('#plan .syr .row')[i];
  const card = (root, name) => [...d.querySelectorAll(`#${root} .drug`)].find(c => c.querySelector('.nm').textContent.startsWith(name));
  return { w, d, $, set, check, esc, fill, calc, sel, pick, text, row, card, errors, summary: () => w.eval('summaryText()') };
}
const OK = { edad: 45, peso: 70, talla: 175, pas: 120, pad: 80, fc: 85, spo2: 97 };
const SHOCK = { ...OK, pas: 80, pad: 50, fc: 120 };

test('[M01] EPOC estable + propofol → shock: la selección se borra y no queda dosis de propofol arriba', async () => {
  const a = await app(); a.fill('epoc', OK); a.calc(); a.pick('ind', 'prop');
  assert.match(a.row(0).textContent, /Propofol/); assert.match(a.row(0).querySelector('.v').textContent, /mg/);
  for (const k in SHOCK) a.set(k, SHOCK[k]); a.calc();
  assert.equal(a.row(0).querySelector('.v').textContent.trim(), '—');
  assert.doesNotMatch(a.row(0).textContent, /Propofol/);
  assert.match(a.text('plan'), /Se borró la selección previa \(Propofol\)/);
  assert.match(a.summary(), /Inducción · T 0: sin seleccionar/);
});

test('[M01] Sangrado en shock + propofol registrado en Infusiones: aviso «Evitar» en plan, Infusiones y resumen', async () => {
  const a = await app(); a.fill('sangra', SHOCK); a.calc();
  a.sel('mInd', 'prop');
  const r0 = a.row(0);
  assert.equal(r0.querySelector('.v').textContent.trim(), '—'); assert.match(r0.textContent, /Propofol.*Evitar.*reconfirma/);
  assert.match(a.text('maint'), /Evitar.*Propofol.*«Evitar»/);
  assert.match(a.summary(), /Inducción · T 0: Propofol — EVITAR en este contexto.*Dosis no calculada; reconfirma/);
  assert.doesNotMatch(a.summary(), /Propofol [\d.]+ mg\/kg/);
});

test('[M01] etomidato seleccionado y luego marcado no disponible: no aparece su dosis', async () => {
  const a = await app(); a.fill('poli', OK); a.calc(); a.pick('ind', 'etom');
  assert.match(a.row(0).querySelector('.v').textContent, /mg/);
  a.check('s-etom', false);
  assert.equal(a.row(0).querySelector('.v').textContent.trim(), '—'); assert.match(a.row(0).textContent, /Etomidato.*No disponible/);
  assert.match(a.summary(), /Etomidato — NO DISPONIBLE/); assert.doesNotMatch(a.summary(), /Etomidato [\d.]+ mg\/kg/);
  assert.deepEqual(a.errors, []);
});

test('[M02] dexmedetomidina o sin sedación + BNM continuo: bloqueo sin ninguna velocidad del BNM', async () => {
  const a = await app(); a.fill('sepsis', OK); a.calc();
  for (const sed of ['dex', 'none']) for (const bnm of ['cis', 'roc', 'vec']) {
    a.sel('mSed', sed); a.sel('mBnm', bnm);
    const names = [...a.d.querySelectorAll('#maint .inf .nm')].map(n => n.textContent);
    assert.ok(!names.some(n => /Cisatracurio|Rocuronio|Vecuronio/.test(n)), `${sed}+${bnm}: ${names}`);
    assert.ok(a.d.querySelector('#maint .blockinf'), `${sed}+${bnm}: sin tarjeta de bloqueo`);
  }
  a.sel('mSed', 'prop'); a.sel('mBnm', 'cis');
  assert.ok([...a.d.querySelectorAll('#maint .inf .nm')].some(n => /Cisatracurio/.test(n.textContent)));
});

test('[M03] rangos fuera de ficha rotulados y regla del vecuronio con fuente', async () => {
  const a = await app(); a.fill('sepsis', OK); a.calc();
  a.sel('mSed', 'dex');
  const dex = a.card('maint', 'Dexmedetomidina').textContent;
  assert.match(dex, /Rango 0\.2–1\.4 mcg\/kg\/h/); assert.match(dex, /Tramo > 0,7 mcg\/kg\/h: fuera de ficha FDA/);
  a.sel('mSed', 'prop'); a.sel('mBnm', 'vec');
  assert.match(a.card('maint', 'Vecuronio').textContent, /Tramo > 1,2 mcg\/kg\/min: fuera de ficha.*R-13/);
  a.sel('mBnm', 'roc');
  assert.match(a.card('maint', 'Rocuronio').textContent, /Inicio 8 mcg\/kg\/min: por debajo de la ficha/);
  const R = a.w.eval('RULES'), RI = a.w.eval('RULE_INF');
  assert.equal(RI.vec, 'R-13'); assert.match(R['R-13'].t, /vecuronio/); assert.ok(R['R-13'].u.some(([n]) => /Vecuronio/.test(n)));
  assert.match(R['R-12'].f, /EMA/);
});

test('[M05] ketamina coadyuvante 70 kg, 8 h: fracción de ampolla y duración ≤ 24 h', async () => {
  const a = await app(); a.fill('sepsis', OK); a.calc(); a.sel('mAdj', '1');
  const c = a.card('maint', 'Ketamina · coadyuvante').textContent;
  assert.match(c, /Tomar 1\.0 mL \(50 mg\) de Ketamina 500 mg\/10 mL/);
  const dur = c.match(/Dura ≈ ([\d.]+|> 24) h a la dosis de inicio/)[1];
  assert.notEqual(dur, '> 24'); assert.ok(Number(dur) <= 24);
  assert.doesNotMatch(c, /ampolla de 500 mg se usa en fracción/);
});

test('[M09] paciente de 300 kg: rocuronio y sugammadex muestran el aviso y exigen confirmar', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: 300, talla: 190 }); a.calc();
  const roc = a.card('plan', 'Rocuronio');
  assert.match(roc.textContent, /por encima del techo de revisión de la app \(200 mg\)/);
  assert.ok(roc.querySelector('.selbtn[disabled]')); assert.ok(roc.querySelector('.confbtn[data-id="roc"]'));
  assert.ok(a.d.querySelector('#plan .confbtn[data-id="suga"]'), 'sugammadex sin confirmación');
  a.d.querySelector('#plan .confbtn[data-id="roc"]').click();
  const roc2 = a.card('plan', 'Rocuronio');
  assert.match(roc2.textContent, /confirmada/); assert.ok(roc2.querySelector('.selbtn:not([disabled])'));
  a.pick('nmb', 'roc'); assert.match(a.row(1).querySelector('.v').textContent, /20\d mg/);
  assert.deepEqual(a.errors, []);
});

test('[M11] escenario «Otro / general»: plan por defecto con aviso arriba y en el resumen', async () => {
  const a = await app(); a.fill('otro', OK); a.calc();
  const plan = a.$('plan');
  assert.ok(plan.querySelectorAll('.dose').length > 0);
  const firstWarn = plan.querySelector('.wn'); assert.match(firstWarn.textContent, /Caso fuera de los escenarios validados/);
  assert.ok(firstWarn.compareDocumentPosition(plan.querySelector('.title')) & 4, 'el aviso va antes del título');
  assert.match(a.summary(), /AVISO: caso fuera de los escenarios validados/);
});

test('[M12] cada alergia bloquea solo su fármaco; la pseudocolinesterasa es precaución', async () => {
  const AL = { alSucc: 'Succinilcolina', alSuga: 'Sugammadex', alEtom: 'Etomidato', alKeta: 'Ketamina', alProp: 'Propofol', alFent: 'Fentanilo' };
  for (const [k, name] of Object.entries(AL)) {
    const a = await app(); a.fill('ich', { ...OK, pas: 170, pad: 95 }, [k]); a.calc();   // HIC hipertensa: hay pretratamiento con fentanilo
    const ci = [...a.d.querySelectorAll('#plan .cibox .wn-ci')].map(x => x.textContent);
    assert.ok(ci.some(t => t.includes(name + ': contraindicado')), `${k}: no bloquea ${name}`);
    for (const other of Object.values(AL).filter(n => n !== name)) assert.ok(!ci.some(t => t.includes(other + ': contraindicado')), `${k} bloquea ${other}`);
    if (name !== 'Sugammadex' && name !== 'Fentanilo') { const c = a.card('plan', name); assert.ok(c.classList.contains('ci') && !c.querySelector('.dose'), `${name}: tarjeta con dosis`); }
    if (name === 'Sugammadex') assert.match(a.text('plan'), /Sugammadex contraindicado/);
    if (name === 'Fentanilo') { assert.ok(a.card('plan', 'Fentanilo').classList.contains('ci')); assert.ok(a.card('maint', 'Fentanilo').classList.contains('ci')); }
  }
  const a = await app(); a.fill('poli', OK, ['pche']); a.calc();
  assert.equal(a.d.querySelectorAll('#plan .cibox .wn-ci').length, 0);
  const s = a.card('plan', 'Succinilcolina'); assert.ok(s.querySelector('.dose')); assert.match(s.textContent, /pseudocolinesterasa/);
});

test('[M13] sangrado con PA 80/50: hemoderivados primero; norepinefrina después y rotulada como coadyuvante', async () => {
  for (const [esc, ch] of [['sangra', []], ['sangra', ['trauma']], ['poli', ['hemo']]]) {
    const a = await app(); a.fill(esc, { ...OK, pas: 80, pad: 50, fc: 120 }, ch); a.calc();
    const items = [...a.d.querySelectorAll('#plan details.step')[0].querySelectorAll('li')].map(l => l.textContent);
    const iH = items.findIndex(t => /^Hemoderivados/.test(t)), iN = items.findIndex(t => /Norepinefrina 0\.05/.test(t));
    assert.ok(iH >= 0 && iN > iH, `${esc}: orden ${iH}/${iN}`);
    assert.match(items[iN], /^Coadyuvante, no sustituye a los hemoderivados/);
  }
});

test('[M14] sepsis con PA 80/50: ninguna tarjeta propone midazolam', async () => {
  const a = await app(); a.fill('sepsis', SHOCK); a.calc();
  for (const sed of ['prop', 'mida', 'dex', 'keta', 'none']) { a.sel('mSed', sed); assert.doesNotMatch(a.text('maint'), /considera midazolam/i, sed); }
  a.sel('mSed', 'prop'); assert.match(a.text('maint'), /reduce la dosis o usa ketamina/);
});

test('[M15] el aviso de obesidad nombra la base que usa cada fármaco (texto = cálculo)', async () => {
  const a = await app(); a.fill('poli', { ...OK, peso: 130, talla: 170 }); a.calc();
  const t = [...a.d.querySelectorAll('#plan .wn-info')].map(x => x.textContent).find(x => /Base de peso por fármaco/.test(x));
  assert.ok(t, 'sin aviso de obesidad');
  const groups = {}; for (const m of t.matchAll(/(peso (?:magro|ajustado|ideal|real)) \(([^)]+)\)/g)) for (const n of m[2].split(', ')) (groups[n] = groups[n] || []).push(m[1]);
  let n = 0;
  a.d.querySelectorAll('#plan .drug').forEach(c => {
    const calc = c.querySelector('.calc'); if (!calc) return;
    const name = c.querySelector('.nm').textContent.toLowerCase(), wl = calc.textContent.match(/\((peso [a-z]+)\)/)[1];
    assert.ok((groups[name] || []).includes(wl), `${name}: cálculo ${wl}, aviso ${groups[name]}`); n++;
  });
  for (const [sed, bnm] of [['prop', 'roc'], ['mida', 'cis'], ['keta', 'vec']]) {
    a.sel('mSed', sed); a.sel('mBnm', bnm); a.sel('mAdj', '1');
    a.d.querySelectorAll('#maint .inf').forEach(c => {
      const name = c.querySelector('.nm').textContent.split(' · ')[0].toLowerCase(), wl = c.querySelector('.calc').textContent.match(/\((peso [a-z]+)\)/)[1];
      assert.ok((groups[name] || []).some(g => g === wl), `${name} (infusión): cálculo ${wl}, aviso ${groups[name]}`); n++;
    });
  }
  assert.ok(n > 8);
});

test('[M17] el estilo de contraindicación solo aparece en contraindicaciones de fármacos', async () => {
  const a = await app();
  for (const v of ['v-sel', 'v-pac', 'v-info']) assert.equal(a.$(v).querySelectorAll('.wn-ci').length, 0, v);
  assert.ok(a.$('v-sel').querySelector('.wn-prec'));
});

test('[M18] cada campo del paciente muestra su unidad, también con valor escrito', async () => {
  const a = await app(); a.fill('poli', OK);
  const U = { edad: 'años', peso: 'kg', talla: 'cm', pas: 'mmHg', pad: 'mmHg', fc: 'lpm', spo2: '%' };
  for (const [id, u] of Object.entries(U)) { const i = a.$(id); assert.ok(i.value); assert.equal(i.parentElement.querySelector('i').textContent, u, id); }
});

test('[M21–M22] epinefrina sin ambigüedad de volumen; sin aviso muerto de FC', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const t = a.text('plan');
  assert.match(t, /1 mL de epinefrina 1 mg\/1 mL \+ 9 mL de SSN = 10 mL a 100 mcg\/mL.*1 mL de la jeringa A \+ 9 mL de SSN = 10 mL a 10 mcg\/mL/);
  assert.doesNotMatch(t, /en 100 mL de SSN/);
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'js', 'logic.js'), 'utf8'), /FC no registrada|if\(!p\.fc\)/);
});

test('[M23] la especificación de cálculos está en la versión vigente del algoritmo', async () => {
  const a = await app(); const v = a.w.eval('ALG.version');
  const doc = fs.readFileSync(path.join(ROOT, 'docs', 'ESPECIFICACION-CALCULOS.md'), 'utf8');
  assert.match(doc.split('\n')[0], new RegExp(`algoritmo v${v.replace(/\./g, '\\.')}\\)`));
  assert.match(doc, /FC \| lpm \| \*\*sí\*\*/);
});

test('[M25–M26] CSP activa sin errores; al recargar no quedan casillas ni datos del paciente anterior', async () => {
  const html = fs.readFileSync(INDEX, 'utf8');
  assert.match(html, /http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'/);
  assert.doesNotMatch(html, /<script>(?!<\/script>)|\son[a-z]+="/);   // sin scripts ni manejadores en línea
  const a = await app(); a.fill('poli', OK, ['hm', 'alSucc']);
  a.w.dispatchEvent(new a.w.PageTransitionEvent('pageshow', { persisted: true }));
  assert.equal(a.$('hm').checked, false); assert.equal(a.$('alSucc').checked, false); assert.equal(a.$('peso').value, '');
  assert.deepEqual(a.errors, []);
});

test('[M16] tras elegir escenario solo queda visible el elegido, con opción de cambiar', async () => {
  const a = await app(); a.esc('poli');
  assert.ok(a.$('esc').classList.contains('picked'));
  a.$('escChg').click(); assert.ok(!a.$('esc').classList.contains('picked'));
  assert.equal(a.w.eval('S.esc'), 'poli');
});

test('[v1.6.1] rocuronio con la misma base de peso (ajustado) en bolo e infusión en obesidad', async () => {
  const A = await app();
  assert.equal(A.w.eval('BASIS.bolus.roc'), 'abw');
  assert.equal(A.w.eval('BASIS.inf.roc'), 'abw');
  A.fill('otro', { ...OK, peso: 130, talla: 170 });
  A.calc(); A.sel('mSed', 'prop'); A.sel('mBnm', 'roc');
  const c = A.card('maint', 'Rocuronio');
  assert.ok(c, 'tarjeta de rocuronio en infusiones');
  assert.match(c.textContent, /peso ajustado/);
  assert.doesNotMatch(c.textContent, /peso ideal/);
});
