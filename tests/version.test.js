// Coherencia de versión: index.html, sw.js y data.js deben declarar la misma versión (evita mezclar archivos).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const rd = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
test('versión única en index.html, sw.js, data.js y package.json', () => {
  const alg = rd('js/data.js').match(/version:'([0-9.]+)'/)[1];
  const idx = [...rd('index.html').matchAll(/\?v=([0-9.]+)"/g)].map(m => m[1]);
  assert.ok(idx.length >= 6); idx.forEach(v => assert.equal(v, alg, 'index.html'));
  assert.match(rd('sw.js'), new RegExp(`'sirdoc-${alg.replace(/\./g, '\\.')}'`)); assert.match(rd('sw.js'), new RegExp(`\\?v=${alg.replace(/\./g, '\\.')}`));
  assert.equal(JSON.parse(rd('package.json')).version, alg);
});
