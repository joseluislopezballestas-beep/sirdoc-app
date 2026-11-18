/* Alterna modo noche/luz intensa sin alterar ninguna variable clínica de SirDoc.
   1.7.0: noche por defecto siempre; el modo claro solo por elección manual. Se aplica en <head> para evitar destellos. */
(() => {
  'use strict';
  const key = 'sirdoc.visualTheme.v2';
  const root = document.documentElement;
  let saved = 'night';
  try { saved = localStorage.getItem(key) === 'day' ? 'day' : 'night'; } catch (_) {}
  function setTheme(mode) {
    root.setAttribute('data-sirdoc-theme', mode);
    const control = document.getElementById('sd-mode');
    if (control) {
      const day = mode === 'day';
      control.textContent = day ? '☀ Alta luz' : '☾ Noche';
      control.setAttribute('aria-label', day ? 'Modo alta iluminación activo. Cambiar a noche' : 'Modo noche activo. Cambiar a alta iluminación');
      control.setAttribute('aria-pressed', day ? 'true' : 'false');
      control.title = 'Cambiar entre noche y alta iluminación';
    }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.removeAttribute('media'); m.setAttribute('content', mode === 'day' ? '#F4F8FB' : '#0B131D'); });
    try { localStorage.setItem(key, mode); } catch (_) {}
  }
  function install() {
    const header = document.querySelector('.top');
    if (header && !document.getElementById('sd-mode')) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.id = 'sd-mode'; btn.className = 'sd-mode';
      btn.addEventListener('click', () => setTheme(root.getAttribute('data-sirdoc-theme') === 'day' ? 'night' : 'day'));
      const timer = header.querySelector('#timer');
      header.insertBefore(btn, timer || null);
    }
    setTheme(saved);
  }
  root.setAttribute('data-sirdoc-theme', saved);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
