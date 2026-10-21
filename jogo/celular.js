// Celular: Aethermoor é jogado com a tela deitada, igual aos outros jogos.
// Em pé aparece o aviso "Gire o celular" (feito no CSS). Onde o navegador
// deixa (Android), o primeiro toque já entra em tela cheia e vira a tela sozinho.
// Se a pessoa sair da tela cheia, o próximo toque volta.
'use strict';

(() => {
  const el = document.documentElement;
  const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
  const podeVirar = !!(pedir && screen.orientation && screen.orientation.lock);
  const celular = matchMedia('(pointer: coarse)').matches;
  const emTelaCheia = () => !!(document.fullscreenElement || document.webkitFullscreenElement);

  function travar() {
    try { const p = screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (e) { /* sem trava de rotação */ }
  }
  function deitar() {
    if (!podeVirar) return false;
    if (emTelaCheia()) { travar(); return true; }
    try {
      const p = pedir.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(travar, () => {}); else travar();
    } catch (e) { return false; }
    return true;
  }
  window.deitarTela = deitar;

  addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('btnGirar');
    if (podeVirar) {
      b.hidden = false;
      document.getElementById('girarDica').textContent = 'Ou toque no botão e a tela vira sozinha:';
    }
    b.addEventListener('click', deitar);
    if (typeof Rosto !== 'undefined') Rosto.criar(document.getElementById('girarBot')).expressao('piscadinha');
  });

  addEventListener('pointerup', e => {
    if (!celular || e.pointerType !== 'touch' || !podeVirar || emTelaCheia()) return;
    if (e.target.closest && e.target.closest('input, textarea, select, #btnGirar')) return;
    deitar();
  }, true);
})();
