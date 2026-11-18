// v1.7.0: diseño Clinical 2.0 integrado, portada por versión, tema noche por defecto, sin marca de agua, reglas R-xx solo en Info.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
function mem(init = {}) { const m = new Map(Object.entries(init)); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; }
async function app(store = mem()) {
  const dom = await JSDOM.fromFile(INDEX, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { Object.defineProperty(w, 'localStorage', { value: store, configurable: true }); w.scrollTo = () => {}; } });
  const w = dom.window; await new Promise(r => w.addEventListener('load', r));
  return { w, d: w.document, store, close: () => w.close() };
}
test('[1.7.0] tema: noche por defecto; el modo claro solo por elección manual y se recuerda', async () => {
  const st = mem();
  let a = await app(st);
  assert.equal(a.d.documentElement.getAttribute('data-sirdoc-theme'), 'night');
  const b = a.d.getElementById('sd-mode'); assert.ok(b); assert.equal(b.getAttribute('aria-pressed'), 'false');
  b.click();
  assert.equal(a.d.documentElement.getAttribute('data-sirdoc-theme'), 'day');
  a.d.querySelectorAll('meta[name="theme-color"]').forEach(m => { assert.equal(m.getAttribute('content'), '#F4F8FB'); assert.equal(m.hasAttribute('media'), false); });
  a.close();
  a = await app(st); assert.equal(a.d.documentElement.getAttribute('data-sirdoc-theme'), 'day', 'elección manual recordada'); a.close();
});
test('[1.7.0] portada: una vez por versión, sin nombre; el nombre y el caduceo quedan solo en Info', async () => {
  const st = mem();
  let a = await app(st);
  const intro = a.d.getElementById('intro'); assert.ok(intro, 'portada en la primera apertura de la versión');
  assert.doesNotMatch(intro.textContent, /Lopez Ballestas/);
  assert.equal(a.d.getElementById('wm'), null, 'sin marca de agua');
  assert.equal((a.d.body.innerHTML.match(/Lopez Ballestas/g) || []).length, 1, 'el nombre aparece una sola vez');
  const credit = a.d.querySelector('#v-info .credit'); assert.ok(credit); assert.match(credit.textContent, /Created and designed\s*Md\. Jose Luis Lopez Ballestas/); assert.ok(credit.querySelector('svg.asc'), 'caduceo');
  a.close();
  a = await app(st); assert.equal(a.d.getElementById('intro'), null, 'segunda apertura de la misma versión: sin portada'); a.close();
  st.removeItem('sirdoc.intro.' + '1.7.0'); st.setItem('sirdoc.intro.1.6.9', '1');
  a = await app(st); assert.ok(a.d.getElementById('intro'), 'tras actualizar a otra versión vuelve a mostrarse una vez'); a.close();
});
test('[1.7.0] capa de diseño incluida en la PWA sin conexión', () => {
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /css\/sirdoc-clinical\.css/); assert.match(sw, /js\/sirdoc-theme\.js/);
  const html = fs.readFileSync(INDEX, 'utf8');
  assert.ok(html.indexOf('sirdoc-clinical.css') > html.indexOf('css/app.css'), 'la capa va después de app.css');
});
