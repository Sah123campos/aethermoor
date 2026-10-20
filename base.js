// Base do jogo: o espaço de nomes AM, utilidades, eventos, controles
// (teclado remapeável, mouse e toque) e o salvamento.
'use strict';

const AM = {
  TILE: 16,
  BASE: 216,          // menor lado da tela em pixels do jogo (o resto se adapta)
  VW: 384, VH: 216,   // atualizados conforme a janela
};

// ---------- utilidades ----------
AM.u = {
  chave: (x, y) => x + ',' + y,
  dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
  aleat: (a, b) => a + Math.random() * (b - a),
  inteiro: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  escolha: lista => lista[Math.floor(Math.random() * lista.length)],
  chance: p => Math.random() < p,
  embaralhar(l) { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; },
  hora(min) { const m = Math.floor(min) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); },
  // base64 de arrays tipados (para o salvamento)
  paraB64(arr) {
    const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  },
  deB64(b64, Tipo) {
    const s = atob(b64), bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return new Tipo(bytes.buffer);
  },
  // ruído suave 2D com semente (para o mapa)
  ruido2D(semente) {
    const r = sorteador(semente), p = new Uint8Array(512), g = [];
    for (let i = 0; i < 256; i++) { p[i] = i; const a = r() * Math.PI * 2; g.push([Math.cos(a), Math.sin(a)]); }
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const f = t => t * t * t * (t * (t * 6 - 15) + 10);
    const pt = (ix, iy, x, y) => { const v = g[p[(ix & 255) + p[iy & 255]]]; return v[0] * (x - ix) + v[1] * (y - iy); };
    const n = (x, y) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), sx = f(x - x0), sy = f(y - y0);
      const a = lerp(pt(x0, y0, x, y), pt(x0 + 1, y0, x, y), sx), b = lerp(pt(x0, y0 + 1, x, y), pt(x0 + 1, y0 + 1, x, y), sx);
      return lerp(a, b, sy);
    };
    // várias oitavas, resultado mais ou menos entre -1 e 1
    return (x, y, oitavas = 4) => {
      let s = 0, amp = 1, freq = 1, tot = 0;
      for (let i = 0; i < oitavas; i++) { s += n(x * freq, y * freq) * amp; tot += amp; amp *= .5; freq *= 2; }
      return s / tot * 1.6;
    };
  },
};

// ---------- eventos (missões, tutorial e Doidobot escutam) ----------
AM.ev = (() => {
  const ouvintes = {};
  return {
    on(nome, fn) { (ouvintes[nome] ||= []).push(fn); },
    emit(nome, dados = {}) { (ouvintes[nome] || []).forEach(fn => fn(dados)); (ouvintes['*'] || []).forEach(fn => fn(nome, dados)); },
  };
})();

// ---------- opções (lembradas neste navegador) ----------
AM.opc = {
  teclas: null, escalaTexto: 1, velocidade: 1, lerdo: false, semPressa: true, daltonico: false,
  destaques: true, freqDoidobot: 'normal', som: true, musica: true,
};
try { Object.assign(AM.opc, JSON.parse(localStorage.getItem('aethermoor.jogo.opcoes') || '{}')); } catch (e) { /* sem armazenamento */ }
AM.salvarOpcoes = () => { try { localStorage.setItem('aethermoor.jogo.opcoes', JSON.stringify(AM.opc)); } catch (e) { /* tudo bem */ } };

// ---------- controles ----------
AM.TECLAS_PADRAO = {
  cima: ['KeyW', 'ArrowUp'], baixo: ['KeyS', 'ArrowDown'], esq: ['KeyA', 'ArrowLeft'], dir: ['KeyD', 'ArrowRight'],
  usar: ['Space'], interagir: ['KeyF', 'Enter'], inventario: ['KeyE', 'KeyI'], missoes: ['KeyQ'],
  construir: ['KeyB'], atributos: ['KeyC'], mapa: ['KeyM'], doidobot: ['KeyH'], jutsu: ['KeyJ'],
  correr: ['ShiftLeft', 'ShiftRight'], pausa: ['Escape'], chat: ['KeyT'],
  h1: ['Digit1'], h2: ['Digit2'], h3: ['Digit3'], h4: ['Digit4'], h5: ['Digit5'], h6: ['Digit6'], h7: ['Digit7'], h8: ['Digit8'],
};
AM.NOMES_ACOES = {
  cima: 'Andar para cima', baixo: 'Andar para baixo', esq: 'Andar para a esquerda', dir: 'Andar para a direita',
  usar: 'Usar ferramenta / atacar', interagir: 'Interagir / colher / comer', inventario: 'Inventário', missoes: 'Missões',
  construir: 'Construção', atributos: 'Atributos', mapa: 'Mapa', doidobot: 'Chamar o Doidobot', jutsu: 'Jutsu Clone das Sombras',
  correr: 'Correr', pausa: 'Menu / voltar', chat: 'Mensagem para a sala (multijogador)',
};

AM.input = (() => {
  const apertadas = new Set(), novas = new Set();
  const mouse = { x: 0, y: 0, dentro: false, esq: false, dir: false, cliqueEsq: false, cliqueDir: false, roda: 0, mexeu: 0 };
  const toque = { x: 0, y: 0, ativo: false, botoes: new Set(), novos: new Set() };
  let ligado = false;

  const teclas = () => Object.assign({}, AM.TECLAS_PADRAO, AM.opc.teclas || {});
  function acaoDaTecla(code) {
    const t = teclas();
    return Object.keys(t).filter(a => t[a].includes(code));
  }
  addEventListener('keydown', e => {
    if (!ligado || e.target.closest('input, textarea, select')) return;
    if (AM.input.capturando) { AM.input.capturando(e.code); AM.input.capturando = null; e.preventDefault(); return; }
    const acoes = acaoDaTecla(e.code);
    if (acoes.length) {
      e.preventDefault();
      acoes.forEach(a => { if (!apertadas.has(a)) novas.add(a); apertadas.add(a); });
    }
  });
  addEventListener('keyup', e => acaoDaTecla(e.code).forEach(a => apertadas.delete(a)));
  addEventListener('blur', () => apertadas.clear());

  return {
    mouse, toque, capturando: null,
    ligar(v = true) { ligado = v; if (!v) { apertadas.clear(); novas.clear(); } },
    get ligado() { return ligado; },
    seg: a => apertadas.has(a) || toque.botoes.has(a),
    apertou: a => novas.has(a) || toque.novos.has(a),
    soltar(a) { apertadas.delete(a); novas.delete(a); },
    // chamado no fim de cada quadro
    limpar() { novas.clear(); toque.novos.clear(); mouse.cliqueEsq = mouse.cliqueDir = false; mouse.roda = 0; },
    tecla: a => (teclas()[a] || [])[0] || '',
    nomeTecla(code) {
      return (code || '').replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', 'Seta ').replace('Space', 'Espaço')
        .replace('ShiftLeft', 'Shift').replace('ShiftRight', 'Shift').replace('Escape', 'Esc').replace('Enter', 'Enter');
    },
    // eixo de movimento (-1..1)
    eixo() {
      let x = (apertadas.has('dir') ? 1 : 0) - (apertadas.has('esq') ? 1 : 0);
      let y = (apertadas.has('baixo') ? 1 : 0) - (apertadas.has('cima') ? 1 : 0);
      if (toque.ativo) { x = toque.x; y = toque.y; }
      const n = Math.hypot(x, y);
      return n > 1 ? { x: x / n, y: y / n } : { x, y };
    },
  };
})();

// ---------- salvamento ----------
AM.CHAVE_SAVE = 'aethermoor.save';
AM.temSave = () => { try { return !!localStorage.getItem(AM.CHAVE_SAVE); } catch (e) { return false; } };
