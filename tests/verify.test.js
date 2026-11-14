// Verificación INDEPENDIENTE de cálculos: se leen las cifras que la app muestra y se recalculan aquí
// con fórmulas escritas aparte (no se reutiliza el código de la app). Recorre pacientes, estados,
// escenarios y TODAS las presentaciones de cada fármaco.
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
  const fill = (esc, vals, checks = []) => {
    d.querySelector(`#esc button[data-v="${esc}"]`).click();
    for (const k in vals) set(k, vals[k]);
    checks.forEach(c => { const e = $(c); if (e) { e.checked = true; e.dispatchEvent(new w.Event('change', { bubbles: true })); } });
  };
  const sex = s => d.querySelector(`#sexo button[data-v="${s}"]`).click();
  const calc = () => { $('calc').click(); const c = $('confirmVals'); if (c) c.click(); };
  const pres = (id, i) => { const s = $('ps-' + id); s.value = String(i); s.dispatchEvent(new w.Event('change')); };
  const sel = (id, v) => { const s = $(id); s.value = v; s.dispatchEvent(new w.Event('change', { bubbles: true })); };
  return { w, d, $, fill, sex, calc, pres, sel, errors, get: n => w.eval(n) };
}
const num = s => Number(String(s).replace(',', '.'));
const close = (a, b, rel = 0.012, abs = 0.051) => Math.abs(a - b) <= Math.max(abs, rel * Math.abs(b));
// Pesos de referencia escritos aquí, independientes de la app
function weights(sexo, w, h) {
  const bmi = w / (h / 100) ** 2;
  const ibw = Math.max(35, (sexo === 'M' ? 50 : 45.5) + 0.9055 * (h - 152.4));
  const lbw = sexo === 'M' ? 9270 * w / (6680 + 216 * bmi) : 9270 * w / (8780 + 244 * bmi);
  return { 'peso real': w, 'peso ideal': ibw, 'peso magro': lbw, 'peso ajustado': ibw + 0.4 * (w - ibw), obese: bmi >= 30 };
}
const roundDose = x => (x < 20 ? Math.round(x * 10) / 10 : Math.round(x));
const PRESN = { etom: 1, keta: 1, prop: 2, fent: 2, mida: 3, dex: 3, roc: 1, succ: 3, vec: 1, cis: 1, suga: 2, nore: 1 };

/* Comprueba cada tarjeta de bolo: dosis = k × peso del criterio, mL = dosis / concentración y preparación coherente. */
function checkBolus(card, W, ctx) {
  const name = card.querySelector('.nm').textContent;
  const dose = card.querySelector('.dose'); if (!dose) return 0;
  const dm = dose.textContent.match(/^([\d.]+) (mg|mcg)([\d.]+) mL · ([\d.]+) (mg|mcg)\/mL/);
  assert.ok(dm, `${ctx} ${name}: formato de dosis ${dose.textContent}`);
  const D = num(dm[1]), V = num(dm[3]), C = num(dm[4]);
  const cm = card.querySelector('.calc').textContent.match(/^([\d.]+) (mg|mcg)\/kg × ([\d.]+) kg \((peso [a-z]+)\)( · rango [^·]+?)?( ?· máx\. (\d+) (?:mg|mcg))?(?:Dosis|$)/);
  assert.ok(cm, `${ctx} ${name}: línea de cálculo ${card.querySelector('.calc').textContent}`);
  const k = num(cm[1]), wl = cm[4], wexp = W[wl];
  assert.ok(close(num(cm[3]), wexp, 0.01, 0.06), `${ctx} ${name}: peso ${cm[3]} ≠ ${wexp} (${wl})`);
  let exp = k * wexp; if (cm[7]) exp = Math.min(exp, num(cm[7]));
  assert.ok(close(D, roundDose(exp), 0.006, 0.051), `${ctx} ${name}: dosis ${D} ≠ ${roundDose(exp)}`);
  assert.ok(close(V, D / C, 0.02, 0.051), `${ctx} ${name}: volumen ${V} ≠ ${D}/${C}`);
  const prep = card.querySelector('.prep').textContent;
  const dil = prep.match(/Cargar ([\d.]+) mL \(([\d.]+) (mg|mcg)\) de .+? \(?([\d.]+)? ?.*?\+ ([\d.]+) mL de SSN = ([\d.]+) mL a ([\d.]+) (mg|mcg)\/mL \((\d+) ampollas?\)/);
  if (dil) {
    const [dv, drawn, , , sv, fv, T] = [num(dil[1]), num(dil[2]), 0, 0, num(dil[5]), num(dil[6]), num(dil[7])];
    assert.ok(close(dv + sv, fv, 0.01, 0.06), `${ctx} ${name}: ${dv} + ${sv} ≠ ${fv} mL`);
    assert.ok(close(drawn / fv, T, 0.01), `${ctx} ${name}: ${drawn}/${fv} ≠ ${T}`);
    assert.ok(close(T, C), `${ctx} ${name}: concentración de jeringa ${T} ≠ ${C}`);
    assert.ok(drawn + 1e-9 >= D, `${ctx} ${name}: se cargan ${drawn} < dosis ${D}`);
  } else {
    const pm = prep.match(/^(\d+) (ampollas?|vial(?:es)?) de .*?(?:sin diluir \(([\d.]+) (mg|mcg)\/mL\)|reconstituir cada uno con (\d+) mL de agua estéril → ([\d.]+) (mg|mcg)\/mL)/);
    assert.ok(pm, `${ctx} ${name}: preparación ${prep}`);
    const c2 = num(pm[3] || pm[6]);
    assert.ok(close(c2, C), `${ctx} ${name}: concentración ${c2} ≠ ${C}`);
  }
  return 1;
}
/* Comprueba cada tarjeta de infusión: dosis/h, mL/h, concentración, volumen final y duración. */
function checkInf(card, W, H, ctx) {
  const name = card.querySelector('.nm').textContent;
  const rate = parseFloat(card.querySelector('.rate').textContent);
  const calc = card.querySelector('.calc').textContent;
  const m = calc.match(/^Inicio ([\d.]+) (mg|mcg)\/kg\/(h|min) × ([\d.]+) kg \((peso [a-z]+)\) = ([\d.]+) (mg|mcg)\/hRango ([\d.]+)–([\d.]+) (mg|mcg)\/kg\/(h|min) = ([\d.]+)–([\d.]+) mL\/h/);
  assert.ok(m, `${ctx} ${name}: línea ${calc}`);
  const k = num(m[1]), du = m[2], per = m[3], wl = m[5];
  assert.ok(close(num(m[4]), W[wl], 0.01, 0.06), `${ctx} ${name}: peso ${m[4]} ≠ ${W[wl]}`);
  const perH = x => x * W[wl] * (per === 'min' ? 60 : 1);
  const doseH = perH(k), shown = num(m[6]), su = m[7];
  const shownIn = su === du ? shown : (su === 'mcg' ? shown / 1000 : shown * 1000);
  assert.ok(close(shownIn, doseH, 0.02, 0.06), `${ctx} ${name}: ${shownIn} ${du}/h ≠ ${doseH}`);
  const prep = card.querySelector('.prep').textContent;
  const pm = prep.match(/= ([\d.]+) mL → ([\d.]+) (mg|mcg)\/mL/);
  assert.ok(pm, `${ctx} ${name}: preparación ${prep}`);
  const Vf = num(pm[1]); let C = num(pm[2]); const cu = pm[3];
  const Cdu = cu === du ? C : (cu === 'mcg' ? C / 1000 : C * 1000);   // concentración en la unidad de la dosis
  assert.ok(close(rate, doseH / Cdu, 0.02, 0.051), `${ctx} ${name}: ${rate} mL/h ≠ ${doseH}/${Cdu}`);
  assert.ok(close(num(m[12]), perH(num(m[8])) / Cdu, 0.02, 0.051) && close(num(m[13]), perH(num(m[9])) / Cdu, 0.02, 0.051), `${ctx} ${name}: rango mL/h`);
  const dur = prep.match(/Dura ≈ ([\d.]+|> 24) h a la dosis de inicio/);
  assert.ok(dur, `${ctx} ${name}: duración`);
  const durExp = Vf / rate;
  if (dur[1] !== '> 24') assert.ok(close(num(dur[1]), durExp, 0.03, 0.11), `${ctx} ${name}: dura ${dur[1]} ≠ ${durExp}`);
  assert.ok(durExp + 0.15 >= H, `${ctx} ${name}: la mezcla dura ${durExp.toFixed(2)} h < ${H} h solicitadas`);
  const tot = prep.match(/\(([\d.]+) (mg|mcg)\)|(\d+) (?:ampollas?|viales?) de .+?\(([\d.]+) mL\)/);
  assert.ok(Vf > 0 && rate > 0 && C > 0, `${ctx} ${name}: valores positivos`);
  return 1;
}

const PATIENTS = [
  { sexo: 'M', edad: 45, peso: 70, talla: 175, pas: 125, pad: 80, fc: 85 },
  { sexo: 'F', edad: 30, peso: 52, talla: 158, pas: 112, pad: 70, fc: 90 },
  { sexo: 'M', edad: 68, peso: 135, talla: 172, pas: 150, pad: 95, fc: 78 },     // obesidad
  { sexo: 'F', edad: 80, peso: 60, talla: 150, pas: 95, pad: 60, fc: 105 },       // riesgo
  { sexo: 'M', edad: 50, peso: 90, talla: 180, pas: 80, pad: 50, fc: 125 },       // shock
  { sexo: 'F', edad: 40, peso: 42, talla: 135, pas: 120, pad: 75, fc: 80 },       // talla baja (peso ideal mínimo)
  { sexo: 'M', edad: 35, peso: 220, talla: 190, pas: 140, pad: 90, fc: 100 }      // obesidad extrema, tope de succinilcolina
];
const ESCS = ['poli', 'raqui', 'sangra', 'epoc', 'ich', 'isq', 'ic', 'sepsis', 'iam'];

test('[verificación] bolos: dosis, peso, volumen, concentración y dilución en todos los escenarios y pacientes', async t => {
  const a = await app(); let n = 0;
  for (const P of PATIENTS) for (const esc of ESCS) {
    a.sex(P.sexo); const { sexo, ...v } = P; a.fill(esc, v); a.calc();
    const W = weights(P.sexo, P.peso, P.talla);
    a.d.querySelectorAll('#plan .drug').forEach(c => { n += checkBolus(c, W, `${esc}/${P.peso}kg`); });
  }
  t.diagnostic(`bolos verificados: ${n}`); assert.ok(n > 300, `bolos verificados: ${n}`); assert.deepEqual(a.errors, []);
});

test('[verificación] bolos con TODAS las presentaciones de cada fármaco', async t => {
  const a = await app(); let n = 0;
  const P = PATIENTS[2], W = weights(P.sexo, P.peso, P.talla);
  for (const id of ['etom', 'keta', 'prop', 'fent', 'roc', 'succ', 'vec', 'suga']) for (let i = 0; i < PRESN[id]; i++) {
    a.pres(id, i);
    for (const esc of ['poli', 'epoc', 'ich']) {
      a.sex(P.sexo); const { sexo, ...v } = P; a.fill(esc, v, esc === 'ich' ? [] : []); a.calc();
      a.d.querySelectorAll('#plan .drug').forEach(c => { n += checkBolus(c, W, `${id}#${i}/${esc}`); });
    }
  }
  t.diagnostic(`bolos verificados: ${n}`); assert.ok(n > 60, `bolos verificados: ${n}`); assert.deepEqual(a.errors, []);
});

test('[verificación] infusiones: mg/h, mL/h, concentración, rango, volumen y duración (6–12 h, todas las presentaciones)', async t => {
  const a = await app(); let n = 0;
  const combos = [['prop', 'none'], ['mida', 'roc'], ['dex', 'none'], ['keta', 'cis'], ['prop', 'vec']];
  for (const P of [PATIENTS[0], PATIENTS[2], PATIENTS[4], PATIENTS[5]]) {
    const W = weights(P.sexo, P.peso, P.talla);
    for (const H of [6, 8, 10, 12]) for (const [mid, mi] of [['mida', 0], ['mida', 1], ['mida', 2], ['dex', 0], ['dex', 1], ['dex', 2], ['fent', 1], ['prop', 1]]) {
      a.pres(mid, mi);
      a.sex(P.sexo); const { sexo, ...v } = P; a.fill('sepsis', v); a.calc();
      a.d.querySelector(`#mH button[data-h="${H}"]`).click();
      for (const [sed, bnm] of combos) {
        a.sel('mSed', sed); a.sel('mBnm', bnm); a.sel('mAdj', '1');
        a.d.querySelectorAll('#maint .inf').forEach(c => { n += checkInf(c, W, H, `${P.peso}kg/${H}h/${mid}#${mi}/${sed}+${bnm}`); });
      }
      a.pres(mid, 0);
    }
  }
  t.diagnostic(`infusiones verificadas: ${n}`); assert.ok(n > 1000, `infusiones verificadas: ${n}`); assert.deepEqual(a.errors, []);
});

test('[verificación] norepinefrina previa a la inducción: velocidad y preparación', async () => {
  const a = await app(); const P = PATIENTS[4], W = weights(P.sexo, P.peso, P.talla);
  a.sex(P.sexo); const { sexo, ...v } = P; a.fill('sepsis', v); a.calc();
  const t = a.$('plan').textContent.replace(/\s+/g, ' ');
  const m = t.match(/Norepinefrina 0\.05 mcg\/kg\/min = ([\d.]+) mL\/h.*?= ([\d.]+) mL → ([\d.]+) (mcg|mg)\/mL/);
  assert.ok(m, 'texto de norepinefrina');
  const C = m[4] === 'mg' ? num(m[3]) * 1000 : num(m[3]);
  const w = W.obese ? W['peso ajustado'] : W['peso real'];
  assert.ok(close(num(m[1]), 0.05 * w * 60 / C, 0.03, 0.06), `${m[1]} mL/h ≠ ${0.05 * w * 60 / C}`);
});
