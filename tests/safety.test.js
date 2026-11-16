// Seguridad clínica y de datos: entradas incompletas, extremas o erróneas; contraindicaciones; interacciones;
// fármacos no disponibles; politrauma con y sin hemorragia; presentaciones definidas por el usuario.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { JSDOM } = require('jsdom');
const INDEX = path.join(__dirname, '..', 'index.html');

function memStorage() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
async function app() {
  const dom = await JSDOM.fromFile(INDEX, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: memStorage(), configurable: true }); } });
  const w = dom.window; w.scrollTo = () => {};
  const errors = []; w.addEventListener('error', e => errors.push(e.message));
  await new Promise(res => w.addEventListener('load', res));
  const d = w.document, $ = id => d.getElementById(id);
  const set = (id, v) => { $(id).value = String(v); $(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const check = (id, on = true) => { const e = $(id); e.checked = on; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const fill = (esc, vals, checks = []) => { d.querySelector(`#esc button[data-v="${esc}"]`).click(); for (const k in vals) set(k, vals[k]); checks.forEach(c => check(c)); };
  const calc = () => $('calc').click();
  const text = id => $(id).textContent.replace(/\s+/g, ' ');
  const card = (scope, name) => [...d.querySelectorAll(`#${scope} .drug`)].find(c => c.querySelector('.nm').textContent === name);
  const avail = (id, on) => check('s-' + id, on);
  return { w, d, $, set, check, fill, calc, text, card, avail, errors };
}
const OK = { edad: 45, peso: 70, talla: 175, pas: 120, pad: 80, fc: 85, spo2: 97 };
const ESCS = ['poli', 'raqui', 'sangra', 'epoc', 'ich', 'isq', 'ic', 'sepsis', 'iam'];

test('[seguridad] 600 combinaciones aleatorias de datos incompletos, extremos o erróneos: nunca una dosis inválida', async t => {
  const a = await app();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = arr => arr[Math.floor(rnd() * arr.length)];
  const POOL = ['', ' ', 'abc', '-5', '0', '1e3', '70,5', '70.5.1', '9999', '0,0001', '18', '17', '120', '300', '30', '45', '250', '7 0', '80', '65', '200', 'NaN', '∞', '100', '2,5'];
  const CHECKS = ['hta', 'dm', 'erc', 'hepa', 'via', 'acid', 'hiperK', 'hm', 'neuro', 'quem', 'alRoc', 'mg', 'betab', 'potNMB', 'anticoag', 'aco'];
  let shown = 0, blocked = 0;
  for (let i = 0; i < 600; i++) {
    const V = { edad: ['18', '45', '70', '99', '110'], peso: ['35', '52,5', '70', '140', '280'], talla: ['125', '150', '175', '210'], pas: ['55', '80', '95', '120', '185', '240'], pad: ['30', '50', '70', '95', '125'], fc: ['35', '60', '110', '170'], spo2: ['70', '88', '99'] };
    const f = k => (rnd() < 0.9 ? pick(V[k]) : pick(POOL));
    a.fill(pick(ESCS), { edad: f('edad'), peso: f('peso'), talla: f('talla'), pas: f('pas'), pad: f('pad'), fc: f('fc'), spo2: f('spo2') });
    CHECKS.forEach(c => a.check(c, rnd() < 0.15));
    a.d.querySelectorAll('#extra input').forEach(e => { e.checked = rnd() < 0.4; });
    ['etom', 'roc', 'succ'].forEach(k => a.avail(k, rnd() > 0.2));
    a.calc(); const c = a.$('confirmVals'); if (c && rnd() < 0.7) c.click();
    const all = a.text('plan') + ' ' + a.text('maint');
    assert.doesNotMatch(all, /NaN|Infinity|undefined|null mg|\[object/, `caso ${i}`);
    const doses = [...a.d.querySelectorAll('#plan .dose, #plan .syr .v, #maint .rate')].map(e => e.textContent);
    if (doses.length) {
      shown++;
      doses.forEach(t => { if (t.trim().startsWith('—')) return; const v = parseFloat(t); assert.ok(isFinite(v) && v > 0, `caso ${i}: valor ${t}`); });
      // las dosis por kg nunca superan el rango declarado de su tarjeta
      a.d.querySelectorAll('#plan .drug .calc').forEach(e => {
        const m = e.textContent.match(/^([\d.]+) (?:mg|mcg)\/kg .*? rango ([\d.]+)–([\d.]+)/);
        if (m) assert.ok(+m[1] >= +m[2] - 1e-9 && +m[1] <= +m[3] + 1e-9, `caso ${i}: ${m[1]} fuera de ${m[2]}–${m[3]}`);
      });
    } else { blocked++; assert.match(all, /Sin resultados vigentes|Ingresa los datos/, `caso ${i}`); }
  }
  assert.deepEqual(a.errors, []);
  t.diagnostic(`con dosis: ${shown}; bloqueados por datos inválidos: ${blocked}`); assert.ok(shown > 120 && blocked > 100, `con dosis ${shown}, bloqueados ${blocked}`);
});

test('[seguridad] datos parciales nunca generan dosis; un dato corregido invalida el resultado previo', async () => {
  const a = await app();
  for (const miss of ['edad', 'peso', 'talla', 'pas', 'pad']) {
    const v = { ...OK }; v[miss] = ''; a.fill('poli', v); a.calc();
    assert.equal(a.d.querySelectorAll('#plan .dose').length, 0, miss); assert.match(a.text('err'), /Faltan datos obligatorios/);
  }
  a.fill('poli', OK); a.calc(); assert.ok(a.d.querySelectorAll('#plan .dose').length > 0);
  a.set('peso', '7o'); assert.equal(a.d.querySelectorAll('#plan .dose').length, 0);
});

test('[contraindicación] succinilcolina bloqueada (sin dosis) y fuera de 1.ª elección por cada causa', async () => {
  for (const c of ['hiperK', 'hm', 'neuro', 'quem']) {
    const a = await app(); a.avail('roc', false); a.fill('poli', OK, [c]); a.calc();
    const s = a.card('plan', 'Succinilcolina');
    assert.ok(s.classList.contains('ci'), c); assert.equal(s.querySelector('.dose'), null, c);
    assert.match(a.text('plan'), /⛔Contraindicación.*Succinilcolina: contraindicado/);
    assert.match(a.card('plan', 'Vecuronio').textContent, /1\.ª elección/, c);
  }
  const a = await app(); a.fill('raqui', OK); a.check('sci72'); a.calc();
  assert.ok(a.card('plan', 'Succinilcolina').classList.contains('ci'), 'lesión medular > 48 h');
});

test('[contraindicación] alergia a aminoesteroides bloquea rocuronio y vecuronio; sin bloqueante utilizable se avisa', async () => {
  const a = await app(); a.fill('poli', OK, ['alRoc']); a.calc();
  assert.ok(a.card('plan', 'Rocuronio').classList.contains('ci')); assert.ok(a.card('plan', 'Vecuronio').classList.contains('ci'));
  assert.match(a.card('plan', 'Succinilcolina').textContent, /1\.ª elección/);
  a.check('hiperK'); a.calc();
  assert.match(a.text('plan'), /Ningún bloqueante neuromuscular es utilizable/); assert.match(a.text('plan'), /Sin bloqueante utilizable/);
  a.$('toInf') && a.$('toInf').click();
  a.$('mBnm').value = 'roc'; a.$('mBnm').dispatchEvent(new a.w.Event('change', { bubbles: true }));
  assert.equal(a.d.querySelectorAll('#maint .inf').length > 0 && [...a.d.querySelectorAll('#maint .inf .nm')].some(e => e.textContent === 'Rocuronio'), false, 'no se calcula infusión contraindicada');
  assert.ok(a.card('maint', 'Rocuronio').classList.contains('ci')); assert.deepEqual(a.errors, []);
});

test('[no disponible] fármacos marcados en Ajustes aparecen como no disponibles, sin dosis, y la app usa la siguiente opción', async () => {
  const a = await app(); a.avail('etom', false); a.avail('roc', false); a.fill('poli', OK); a.calc();
  const e = a.card('plan', 'Etomidato'), r = a.card('plan', 'Rocuronio');
  assert.ok(e.classList.contains('nd') && r.classList.contains('nd')); assert.equal(e.querySelector('.dose'), null);
  assert.match(a.card('plan', 'Ketamina').textContent, /1\.ª elección/); assert.match(a.card('plan', 'Succinilcolina').textContent, /1\.ª elección/);
  assert.match(a.text('plan'), /⊘No disponible.*Etomidato: no disponible/);
});

test('[tipos de aviso] contraindicación, precaución, evidencia insuficiente, no disponible e información son distinguibles', async () => {
  const a = await app(); a.avail('etom', false); a.fill('poli', { ...OK, talla: 130, peso: 52, pas: 85, pad: 50 }, ['hiperK']); a.calc();
  const kinds = new Set([...a.d.querySelectorAll('#plan .wn')].map(e => [...e.classList].find(c => c.startsWith('wn-') && c !== 'wn')));
  for (const k of ['wn-ci', 'wn-prec', 'wn-ev', 'wn-nd', 'wn-info']) assert.ok(kinds.has(k), k);
  a.d.querySelectorAll('#plan .wn').forEach(e => assert.match(e.querySelector('.wn-h').textContent, /Contraindicación|Precaución|Evidencia insuficiente|No disponible|Información/));
  assert.equal(a.d.querySelector('#plan .wn-ci').getAttribute('role'), 'alert');
  // la contraindicación se muestra antes que las métricas y las metas
  const html = a.$('plan').innerHTML; assert.ok(html.indexOf('wn-ci') < html.indexOf('class="strip"'));
  // el vecuronio (regla sin fuente primaria) lleva aviso de evidencia insuficiente
  assert.match(a.card('plan', 'Vecuronio').textContent, /Evidencia insuficiente/);
});

test('[interacciones] miastenia, magnesio/aminoglucósidos, betabloqueador, anticonceptivo y anticoagulación', async () => {
  const a = await app(); a.fill('iam', { ...OK, fc: 55 }, ['mg', 'potNMB', 'betab', 'aco', 'anticoag']); a.calc();
  const t = a.text('plan');
  assert.match(a.card('plan', 'Rocuronio').textContent, /Miastenia gravis: sensibilidad aumentada/);
  assert.match(a.card('plan', 'Rocuronio').textContent, /potencian y prolongan el bloqueo/);
  assert.match(a.card('plan', 'Ketamina').textContent, /Isquemia miocárdica/);
  assert.match(t, /Atropina 0\.5–1 mg cargada/); assert.match(t, /método de respaldo 7 días/); assert.match(t, /prolonga transitoriamente el TTPa/);
  a.$('mSed').value = 'dex'; a.$('mSed').dispatchEvent(new a.w.Event('change', { bubbles: true }));
  assert.match(a.text('maint'), /alto riesgo de bradicardia grave/);
});

test('[politrauma] sin hemorragia: normotensión, sin ácido tranexámico; con hemorragia: hipotensión permisiva salvo TCE', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  let t = a.text('plan');
  assert.match(t, /Politraumatizado sin hemorragia activa/); assert.match(t, /PAM ≥ 65 mmHg; no aplicar hipotensión permisiva/);
  assert.doesNotMatch(t, /tranexámico/); assert.doesNotMatch(t, /hipotensión permisiva: PAS 80–90/i); assert.match(t, /Reevaluar sangrado oculto/);
  assert.match(a.card('plan', 'Etomidato').textContent, /0\.3 mg\/kg/);
  a.check('hemo'); a.calc(); t = a.text('plan');
  assert.match(t, /Politraumatizado con hemorragia activa/); assert.match(t, /Hipotensión permisiva: PAS 80–90 mmHg.*Condición: hemorragia activa significativa sin TCE/);
  assert.match(t, /ácido tranexámico/); assert.match(a.card('plan', 'Etomidato').textContent, /0\.2 mg\/kg.*Dosis para: hemorragia activa significativa/);
  a.check('tce'); a.calc(); t = a.text('plan');
  assert.doesNotMatch(t, /Hipotensión permisiva/); assert.match(t, /No aplicar hipotensión permisiva.*Condición: TCE asociado/);
});

test('[presentaciones] cambiar presentación recalcula volúmenes; "otra" solo acepta concentraciones plausibles', async () => {
  const a = await app(); a.fill('poli', OK); a.calc();
  const succVol = () => a.card('plan', 'Succinilcolina').querySelector('.prep').textContent;
  assert.match(succVol(), /100 mg\/2 mL/);
  const s = a.$('ps-succ'); s.value = '1'; s.dispatchEvent(new a.w.Event('change'));
  assert.match(succVol(), /Cargar 1\.0 mL \(100 mg\) de Succinilcolina 1 g\/10 mL/);
  // otra presentación inválida (rocuronio 100 mg/5 mL = 20 mg/mL) → rechazada, sigue la estándar
  const r = a.$('ps-roc'); r.value = '-1'; r.dispatchEvent(new a.w.Event('change'));
  a.$('pa-roc').value = '100'; a.$('pv-roc').value = '5'; a.$('pb-roc').click();
  assert.match(a.$('pe-roc').textContent, /fuera del rango admitido/);
  a.calc(); assert.match(a.card('plan', 'Rocuronio').querySelector('.prep').textContent, /50 mg\/5 mL/);
  // otra presentación válida (etomidato 40 mg/10 mL = 4 mg/mL) → se usa
  const e = a.$('ps-etom'); e.value = '-1'; e.dispatchEvent(new a.w.Event('change'));
  a.$('pa-etom').value = '40'; a.$('pv-etom').value = '10'; a.$('pb-etom').click();
  a.calc(); const et = a.card('plan', 'Etomidato').textContent.replace(/\s+/g, ' ');
  assert.match(et, /21 mg5\.3 mL · 4 mg\/mL/); assert.match(et, /40 mg\/10 mL \(otra\)/);
  assert.deepEqual(a.errors, []);
});
