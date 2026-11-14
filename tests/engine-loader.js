// Carga el motor de cálculo (sin interfaz) en un contexto aislado para probarlo.
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function loadEngine() {
  const ctx = vm.createContext({ console });
  vm.runInContext('var P=null, M={H:8}, ST={etomOk:true,rocOk:true,succOk:true}, S={}; var $=()=>null;', ctx);
  for (const f of ['util.js', 'validate.js', 'data.js', 'logic.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  const get = name => vm.runInContext(name, ctx);
  return { ctx, get, setP: p => { ctx.P = p; }, setH: h => { ctx.M.H = h; } };
};
