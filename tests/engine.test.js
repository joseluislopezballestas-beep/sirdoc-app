// Pruebas del motor matemático y de validación (node --test).
const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./engine-loader');
const E = load();
const derive = E.get('derive'), wt = E.get('wt'), bprep = E.get('bprep'), infPrep = E.get('infPrep');
const validateFull = E.get('validateFull'), parseNum = E.get('parseNum'), r = E.get('r');
const J = x => JSON.parse(JSON.stringify(x)); // objetos de otro contexto vm → planos
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (±${tol})`);
const pat = o => derive(Object.assign({ esc: 'poli', sexo: 'M', edad: 45, w: 70, h: 175, pas: 120, pad: 80, fc: 80, spo2: null }, o));

test('parseNum: coma o punto decimal, rechaza texto, signos y notación científica', () => {
  assert.deepEqual(J(parseNum('80,5')), { ok: true, value: 80.5 });
  assert.deepEqual(J(parseNum(' 70 ')), { ok: true, value: 70 });
  assert.deepEqual(J(parseNum('')), { ok: true, value: null });
  for (const bad of ['8o', '-5', '1e3', '70.5.1', '7 0', 'NaN', 'Infinity']) assert.equal(parseNum(bad).ok, false, bad);
});

test('redondeo de presentación', () => {
  assert.equal(r(19.94), '19.9'); assert.equal(r(84.4), '84'); assert.equal(r(0.456, 'mL'), '0.46');
  assert.equal(r(7.55, 'mL'), '7.5'); assert.equal(r(30, 'h'), '> 24'); assert.equal(r(NaN), '–'); assert.equal(r(Infinity), '–');
});

test('pesos de referencia (Devine, Janmahasatian, ajustado)', () => {
  const m = pat({ w: 80, h: 175 });
  near(m.ibw, 50 + 0.9055 * 22.6); near(m.bmi, 80 / 1.75 ** 2); assert.equal(m.obese, false);
  const f = pat({ sexo: 'F', w: 100, h: 160 });
  near(f.ibw, 45.5 + 0.9055 * 7.6); near(f.bmi, 39.0625);
  near(f.lbw, 9270 * 100 / (8780 + 244 * 39.0625)); near(f.abw, f.ibw + 0.4 * (100 - f.ibw));
  assert.equal(f.obese, true);
  assert.deepEqual(J(wt('lbw', f)), { w: f.lbw, l: 'peso magro' });
  assert.deepEqual(J(wt('abw', f)), { w: f.abw, l: 'peso ajustado' });
  assert.deepEqual(J(wt('ibw', f)), { w: f.ibw, l: 'peso ideal' });
  assert.deepEqual(J(wt('tbw', f)), { w: 100, l: 'peso real' });
  assert.equal(wt('lbw', m).w, 80, 'sin obesidad se usa peso real');
});

test('PAM, índice de shock y estado hemodinámico', () => {
  const a = pat({ pas: 120, pad: 75, fc: 90 }); near(a.pam, 90); near(a.si, 0.75); assert.equal(a.state, 'estable');
  assert.equal(pat({ pas: 85, pad: 60 }).state, 'shock');
  assert.equal(pat({ pas: 100, pad: 45, fc: 60 }).state, 'shock', 'PAM 63 < 65');
});

test('estado hemodinámico: umbrales', () => {
  assert.equal(pat({ pas: 95, pad: 70, fc: 70 }).state, 'riesgo');
  assert.equal(pat({ pas: 120, pad: 80, fc: 120 }).state, 'shock', 'IS 1.0');
  assert.equal(pat({ pas: 120, pad: 80, fc: 100 }).state, 'riesgo', 'IS 0.83');
  assert.equal(pat({ fc: null }).si, null);
  assert.equal(pat({ esc: 'ic' }).doseState, 'riesgo');
  assert.equal(pat({ edad: 80 }).doseState, 'riesgo');
});

test('preparación de bolos: concentración y número de ampollas', () => {
  E.setP(pat({}));
  const k = bprep('keta', 75); assert.equal(k.conc, 10); assert.match(k.txt, /Cargar 2\.0 mL \(100 mg\).*\+ 8\.0 mL.*= 10 mL/);
  assert.equal(bprep('succ', 120).conc, 10); assert.match(bprep('succ', 120).txt, /Cargar 3\.0 mL \(150 mg\).*= 15 mL a 10 mg\/mL \(2 ampollas\)/);
  assert.equal(bprep('vec', 10.5).conc, 1); assert.match(bprep('vec', 10.5).txt, /^2 viales/);
  assert.equal(bprep('roc', 96).conc, 10); assert.match(bprep('roc', 96).txt, /^2 ampollas/);
  assert.equal(bprep('etom', 21).conc, 2); assert.equal(bprep('fent', 140).conc, 50); assert.equal(bprep('suga', 1120).conc, 100);
});

test('infusiones: valores de referencia calculados a mano (70 kg, 8 h)', () => {
  E.setP(pat({ w: 70, h: 175 }));
  let o = infPrep('fent', 1, 'mcg/kg/h', 0.5, 3, 'abw', 8);   // 70 mcg/h; 2 amp (1000 mcg) en 50 mL → 20 mcg/mL
  assert.equal(o.Vf, 50); near(o.conc, 20); near(o.rate(1), 3.5);
  o = infPrep('prop', 10, 'mcg/kg/min', 5, 50, 'abw', 8);     // 42 mg/h; 2 amp (400 mg/40 mL) puro → 4.2 mL/h
  assert.equal(o.Vf, 40); near(o.conc, 10); near(o.rate(10), 4.2);
  o = infPrep('dex', 0.4, 'mcg/kg/h', 0.2, 1.5, 'abw', 8);    // 28 mcg/h; 400 mcg en 100 mL (4 mcg/mL) → 7 mL/h
  assert.equal(o.Vf, 100); near(o.conc, 4); near(o.rate(0.4), 7);
  o = infPrep('nore', 0.05, 'mcg/kg/min', 0.05, 0.5, 'abw', 8); // 0.21 mg/h; 4 mg en 100 mL (40 mcg/mL) → 5.25 mL/h
  assert.equal(o.Vf, 100); near(o.conc, 0.04); near(o.rate(0.05), 5.25);
  o = infPrep('mida', 0.03, 'mg/kg/h', 0.02, 0.1, 'abw', 8);  // 2.1 mg/h; 1 amp 50 mg en 50 mL → 2.1 mL/h
  assert.equal(o.Vf, 50); near(o.conc, 1); near(o.rate(0.03), 2.1);
});

test('infusiones: propiedades para todo fármaco, peso (30–300 kg) y duración (6–12 h)', () => {
  const cases = [['fent', 1, 'mcg/kg/h', 0.5, 3, 'abw'], ['prop', 10, 'mcg/kg/min', 5, 50, 'abw'], ['mida', 0.03, 'mg/kg/h', 0.02, 0.1, 'abw'],
    ['dex', 0.4, 'mcg/kg/h', 0.2, 1.5, 'abw'], ['keta', 0.5, 'mg/kg/h', 0.25, 1.5, 'abw'], ['roc', 0.5, 'mg/kg/h', 0.3, 0.7, 'ibw'],
    ['cis', 2, 'mcg/kg/min', 1, 5, 'ibw'], ['vec', 1, 'mcg/kg/min', 0.8, 1.7, 'ibw'], ['nore', 0.05, 'mcg/kg/min', 0.05, 0.5, 'abw']];
  for (const w of [30, 45, 70, 110, 160, 300]) for (const H of [6, 8, 10, 12]) for (const [id, k, u, lo, hi, b] of cases) {
    E.setP(pat({ w, h: w > 200 ? 200 : 170 }));
    const o = infPrep(id, k, u, lo, hi, b, H), tag = `${id} ${w}kg ${H}h`;
    for (const x of [o.Vf, o.conc, o.rate(k), o.rate(lo), o.rate(hi)]) assert.ok(isFinite(x) && x > 0, tag);
    near(o.rate(k) * o.conc, o.ph(k), 1e-9);                       // mL/h × conc = dosis/h
    assert.ok(o.dStart >= H - 1e-9, `${tag}: dura ${o.dStart} h < ${H} h`);
    assert.ok(o.rate(lo) <= o.rate(k) && o.rate(k) <= o.rate(hi), tag);
  }
});

test('conversión de unidades: mcg/kg/min → mg/h con presentación en mg', () => {
  E.setP(pat({ w: 70 }));
  const o = infPrep('nore', 0.1, 'mcg/kg/min', 0.05, 0.5, 'abw', 6);
  near(o.ph(0.1), 0.1 * 70 * 60 / 1000);                         // 0.42 mg/h
});

test('validación: datos ausentes, formato, imposibles e incoherentes bloquean el cálculo', () => {
  const ok = { esc: 'poli', sexo: 'M', edad: 45, w: 70, h: 175, pas: 120, pad: 80, fc: 80, spo2: 97, _fmt: [] };
  assert.deepEqual(J(validateFull(ok).errors), []);
  const errs = o => validateFull(Object.assign({}, ok, o)).errors.join(' | ');
  assert.match(errs({ esc: null }), /escenario/);
  assert.match(errs({ w: null }), /Faltan datos obligatorios: Peso/);
  assert.match(errs({ w: null, _fmt: ['w'] }), /Peso: formato no válido/);
  assert.doesNotMatch(errs({ w: null, _fmt: ['w'] }), /Faltan/);
  assert.match(errs({ edad: 17 }), /solo para adultos/);
  assert.match(errs({ edad: 130 }), /Edad 130/);
  assert.match(errs({ w: 25 }), /Peso 25 kg fuera del rango/);
  assert.match(errs({ pad: 120 }), /PAD \(120\) debe ser menor/);
  assert.match(errs({ fc: 0 }), /FC 0/);
  assert.match(errs({ spo2: 101 }), /SpO₂ 101/);
  assert.match(errs({ pas: 0 }), /PAS 0/);
});

test('validación: valores extremos posibles piden confirmación, no bloquean', () => {
  const base = { esc: 'sangra', sexo: 'M', edad: 45, w: 70, h: 175, pas: 120, pad: 80, fc: 80, spo2: 96, _fmt: [] };
  const v = o => validateFull(Object.assign({}, base, o));
  let x = v({ pas: 60, pad: 35 }); assert.equal(x.errors.length, 0); assert.match(x.warns.join(), /PAS 60/);
  assert.match(v({ fc: 180 }).warns.join(), /FC 180/);
  assert.match(v({ pas: 100, pad: 92 }).warns.join(), /Presión de pulso/);
  assert.match(v({ w: 180, h: 165 }).warns.join(), /IMC/);
  assert.equal(v({}).warns.length, 0);
});
