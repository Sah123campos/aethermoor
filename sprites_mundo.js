// Pixel art do mundo gerada por código: chão (com variações e estações),
// objetos (árvores, pedras, móveis, paredes...) e plantações.
'use strict';

AM.spr = (() => {
  const cache = new Map();
  function nova(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function memo(chave, fazer) { let v = cache.get(chave); if (!v) { v = fazer(); cache.set(chave, v); } return v; }
  function salpicar(x, w, h, cores, n, r) {
    for (let i = 0; i < n; i++) { x.fillStyle = cores[Math.floor(r() * cores.length)]; x.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); }
  }
  const P = (x, px, py, cor) => { x.fillStyle = cor; x.fillRect(px, py, 1, 1); };

  // grama por estação: base, clara, escura
  const GRAMA = [['#5aa548', '#7cc35a', '#45893b'], ['#4f9a3c', '#6fb84a', '#3c7a30'], ['#a49a44', '#c4b058', '#857a34'], ['#e6eef7', '#ffffff', '#c6d4e4']];
  const MATA = [['#3f8a3e', '#5aa548', '#2f6a30'], ['#367f34', '#4f9a3c', '#285e28'], ['#8a6a34', '#b0703a', '#6a5028'], ['#d8e2ee', '#f4f8ff', '#b8c6d8']];

  // ---------- chão ----------
  function chao(id, est, v, quadro = 0) {
    const tema = id === AM.CH.P_MASMORRA ? (AM.masmorraCores || {}).chao : '';
    return memo(`c${id}.${est}.${v}.${id === 6 || id === 7 ? quadro : 0}.${tema}`, () => {
      const [c, x] = nova(16, 16), r = sorteador(id * 977 + v * 131 + est * 17 + 3);
      const fundo = (cor, pintas, n) => { x.fillStyle = cor; x.fillRect(0, 0, 16, 16); salpicar(x, 16, 16, pintas, n, r); };
      const CH = AM.CH;
      switch (id) {
        case CH.GRAMA: case CH.MATA: {
          const [b, cl, es] = (id === CH.GRAMA ? GRAMA : MATA)[est];
          fundo(b, [cl, es], 22);
          for (let i = 0; i < 4; i++) { const px = Math.floor(r() * 15), py = 2 + Math.floor(r() * 13); P(x, px, py, es); P(x, px, py - 1, cl); }
          if (est === 0 && id === CH.GRAMA && v === 1) { P(x, 4, 5, '#ff9ec4'); P(x, 11, 10, '#fff3a0'); }
          if (id === CH.MATA && est !== 3) for (let i = 0; i < 3; i++) P(x, Math.floor(r() * 16), Math.floor(r() * 16), est === 2 ? '#c9602a' : '#8a6a3a');
          break;
        }
        case CH.TERRA: fundo('#9a6b42', ['#b07c4e', '#835a36'], 26); break;
        case CH.ARADA: case CH.MOLHADA: {
          const [b, cl, es] = id === CH.ARADA ? ['#8a5a36', '#a06a42', '#6a4428'] : ['#5e3c24', '#704a2e', '#47301c'];
          fundo(b, [cl, es], 14);
          for (let y = 2; y < 16; y += 4) { x.fillStyle = es; x.fillRect(1, y, 14, 1); x.fillStyle = cl; x.fillRect(1, y - 1, 14, 1); }
          break;
        }
        case CH.AREIA: fundo('#e6d29a', ['#f2e2b4', '#cdb67c'], 24); if (v === 2) { P(x, 5, 9, '#c9a46a'); P(x, 6, 9, '#c9a46a'); } break;
        case CH.NEVE: fundo('#eef4fb', ['#ffffff', '#cfdcea'], 20); break;
        case CH.AGUA: case CH.FUNDA: {
          x.fillStyle = id === CH.AGUA ? '#3f86d0' : '#2c64b0'; x.fillRect(0, 0, 16, 16);
          x.fillStyle = id === CH.AGUA ? '#6aa8e6' : '#4a82c8';
          for (let i = 0; i < 3; i++) {
            const wy = (Math.floor(r() * 14) + quadro * 2) % 15, wx = (Math.floor(r() * 12) + quadro) % 12;
            x.fillRect(wx, wy, 3, 1); x.fillRect(wx + 1, wy - 1 < 0 ? 0 : wy - 1, 2, 1);
          }
          break;
        }
        case CH.PEDRA: fundo('#8a8a96', ['#a2a2ae', '#72727e'], 26); x.fillStyle = '#6a6a76'; x.fillRect(3 + v, 6, 4, 1); x.fillRect(6 + v, 7, 1, 3); break;
        case CH.LAMA: fundo('#6a583a', ['#7a6846', '#56462e'], 20); if (v < 2) { x.fillStyle = '#4e5a4a'; x.fillRect(4, 5 + v * 3, 6, 3); x.fillStyle = '#6a8070'; x.fillRect(5, 5 + v * 3, 3, 1); } break;
        case CH.CAMINHO: {
          fundo('#a88a5a', ['#9a7c4e'], 10);
          for (let i = 0; i < 6; i++) {
            const px = Math.floor(r() * 13), py = Math.floor(r() * 13), w = 3 + Math.floor(r() * 2);
            x.fillStyle = '#d4b884'; x.fillRect(px, py, w, 3); x.fillStyle = '#e6cc9a'; x.fillRect(px, py, w, 1); x.fillStyle = '#8a7048'; x.fillRect(px, py + 3, w, 1);
          }
          break;
        }
        case CH.P_MADEIRA: {
          fundo('#b98552', ['#c99560', '#a87545'], 10);
          x.fillStyle = '#8a5a32'; for (let y = 3; y < 16; y += 4) x.fillRect(0, y, 16, 1);
          x.fillRect((v * 5) % 16, 0, 1, 3); x.fillRect((v * 5 + 8) % 16, 4, 1, 3); x.fillRect((v * 3 + 2) % 16, 8, 1, 3); x.fillRect((v * 7 + 11) % 16, 12, 1, 3);
          break;
        }
        case CH.P_PEDRA: fundo('#9a9aa8', ['#aeaebc', '#86869a'], 14); x.fillStyle = '#76768a'; x.fillRect(0, 7, 16, 1); x.fillRect(0, 15, 16, 1); x.fillRect(7, 0, 1, 7); x.fillRect(v < 2 ? 3 : 11, 8, 1, 7); break;
        case CH.P_ESTUFA: fundo('#8ab07a', ['#9cc08a', '#78a068'], 12); x.fillStyle = '#6a9058'; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16); break;
        case CH.PONTE: fundo('#a8703f', ['#b98552', '#8a5a32'], 10); x.fillStyle = '#6b4226'; for (let px = 3; px < 16; px += 4) x.fillRect(px, 0, 1, 16); x.fillRect(0, 0, 16, 1); x.fillRect(0, 15, 16, 1); break;
        case CH.GELO: fundo('#bfe0f4', ['#d8eefa', '#a6cce6'], 10); x.fillStyle = '#ffffff'; x.fillRect(3, 4, 4, 1); x.fillRect(9, 11, 3, 1); break;
        case CH.P_MASMORRA: { const d = AM.masmorraCores || { chao: '#5e4c3c' }; const b = rgb(d.chao); fundo(d.chao, [css(misturar(b, [255, 255, 255], .1)), css(misturar(b, [0, 0, 0], .15))], 20); x.fillStyle = css(misturar(b, [0, 0, 0], .25)); x.fillRect(0, 15, 16, 1); x.fillRect(15, 0, 1, 16); break; }
        default: fundo('#ff00ff', [], 0);
      }
      return c;
    });
  }

  // ---------- objetos ----------
  // devolve { c: canvas, ox, oy } (deslocamento a partir do canto do tile)
  function arvore(est, v) {
    const [c, x] = nova(32, 42), r = sorteador(v * 31 + 7);
    const cores = [['#2e7a3a', '#46a04a', '#7cc860'], ['#24682e', '#3a8a3c', '#5cb04a'], ['#9a461a', '#cc6c28', '#f0a040'], null][est];
    ret(x, 13, 26, 6, 15, '#6b4226'); ret(x, 16, 26, 3, 15, '#4a2c18'); ret(x, 11, 39, 3, 2, '#6b4226'); ret(x, 18, 39, 3, 2, '#4a2c18');
    if (!cores) {   // inverno: galhos pelados com neve
      x.fillStyle = '#5a3a22';
      [[15, 26, 9, 12], [17, 22, 24, 10], [14, 18, 6, 6], [18, 16, 26, 6], [16, 14, 16, 4]].forEach(([x1, y1, x2, y2]) => {
        const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
        for (let i = 0; i <= n; i++) x.fillRect(Math.round(lerp(x1, x2, i / n)), Math.round(lerp(y1, y2, i / n)), 2, 1);
      });
      [[8, 11], [23, 9], [5, 5], [25, 5], [15, 3]].forEach(([px, py]) => ret(x, px, py, 4, 2, '#ffffff'));
      return x.canvas;
    }
    const bolhas = [[16, 14, 12], [8, 18, 8], [24, 18, 8], [11, 9, 8], [21, 9, 8], [16, 22, 8]];
    bolhas.forEach(([px, py, rr]) => disco(x, px, py + 1, rr, cores[0]));
    bolhas.forEach(([px, py, rr]) => disco(x, px - 1, py - 1, rr - 2, cores[1]));
    bolhas.forEach(([px, py, rr]) => disco(x, px + 1, py - rr * .45, Math.max(2, rr * .38 | 0), cores[2]));
    if (est === 0) for (let i = 0; i < 7; i++) P(x, 5 + Math.floor(r() * 22), 4 + Math.floor(r() * 18), '#ffb4d4');
    if (est === 2) for (let i = 0; i < 5; i++) P(x, 5 + Math.floor(r() * 22), 4 + Math.floor(r() * 18), '#ffe066');
    return c;
  }
  function pinheiro(est) {
    const [c, x] = nova(24, 42);
    ret(x, 10, 32, 4, 9, '#5a3a22'); ret(x, 12, 32, 2, 9, '#3e2616');
    const verde = est === 2 ? ['#2f5a3a', '#3f7048'] : ['#23553a', '#2f6e44'];
    for (let camada = 0; camada < 3; camada++) {
      const topo = 2 + camada * 9;
      for (let i = 0; i < 14; i++) { const w = 2 + Math.floor(i * (.55 + camada * .1)); ret(x, 12 - w, topo + i, w * 2, 1, verde[0]); ret(x, 12 - w, topo + i, w, 1, verde[1]); }
      if (est === 3) for (let i = 0; i < 4; i++) { const w = 2 + Math.floor(i * (.55 + camada * .1)); ret(x, 12 - w, topo + i, w * 2, 1, '#f4f8ff'); }
    }
    return c;
  }
  function pedregulho(x, cor, sombra, luz, pintas) {
    disco(x, 8, 9, 6, sombra); disco(x, 7, 8, 5, cor); ret(x, 4, 5, 3, 1, luz); ret(x, 3, 6, 1, 2, luz);
    (pintas || []).forEach(([px, py, pc]) => { ret(x, px, py, 2, 2, pc); });
  }
  function bloco(topo, frente, linha, detalhe) {
    const [c, x] = nova(16, 24);
    ret(x, 0, 0, 16, 8, topo); ret(x, 0, 8, 16, 16, frente);
    ret(x, 0, 7, 16, 1, linha); ret(x, 0, 23, 16, 1, linha);
    if (detalhe) detalhe(x);
    return c;
  }

  function objeto(id, est = 0, v = 0) {
    const ob = AM.OBJ[id];
    if (!ob) return null;
    const chaveEst = ['arvore', 'pinheiro', 'arbusto', 'cacto', 'capim'].includes(ob.chave) ? est : 0;
    const tema = ob.chave === 'rocha' ? (AM.masmorraCores || {}).parede : '';
    return memo(`o${id}.${chaveEst}.${v}.${tema}`, () => {
      const k = ob.chave;
      if (k === 'arvore') return { c: arvore(est, v % 3), ox: -8, oy: -26 };
      if (k === 'pinheiro') return { c: pinheiro(est), ox: -4, oy: -26 };
      const [c, x] = nova(16, 24);
      let oy = -8;
      switch (k) {
        case 'cacto': ret(x, 6, 6, 4, 18, '#4a9a4a'); ret(x, 7, 6, 1, 18, '#6cbf5c'); ret(x, 2, 11, 3, 6, '#4a9a4a'); ret(x, 2, 16, 4, 2, '#4a9a4a'); ret(x, 11, 9, 3, 5, '#4a9a4a'); ret(x, 10, 13, 4, 2, '#4a9a4a'); if (est === 0) ret(x, 7, 5, 2, 2, '#ff8fb8'); break;
        case 'arbusto': {
          const verde = est === 3 ? ['#9aa8b8', '#c6d4e4'] : est === 2 ? ['#8a6a2a', '#b08a3a'] : ['#2f7a36', '#4a9a44'];
          disco(x, 8, 16, 7, verde[0]); disco(x, 7, 15, 5, verde[1]);
          if (v === 1) [[4, 13], [9, 12], [11, 17], [6, 18]].forEach(([px, py]) => ret(x, px, py, 2, 2, '#7a3ad6'));
          break;
        }
        case 'pedra': x.translate(0, 8); pedregulho(x, '#9a9aa6', '#6a6a76', '#c6c6d0'); break;
        case 'ferro': x.translate(0, 8); pedregulho(x, '#8a8a96', '#62626e', '#b8b8c4', [[5, 7, '#c98a6a'], [9, 10, '#d99a72'], [8, 5, '#b8785a']]); break;
        case 'ouro': x.translate(0, 8); pedregulho(x, '#8a8a96', '#62626e', '#b8b8c4', [[5, 7, '#ffd23f'], [9, 10, '#ffe066'], [8, 5, '#e0b020']]); break;
        case 'cristal': { x.translate(0, 8); ret(x, 3, 9, 10, 5, '#5a5a6a');
          [[5, 2, 3, 9], [8, 0, 3, 11], [11, 4, 2, 7]].forEach(([px, py, w, h]) => { ret(x, px, py, w, h, '#5fd6f0'); ret(x, px, py, 1, h, '#c8faff'); });
          break; }
        case 'flor': { x.translate(0, 8); const cores = ['#ff8fb8', '#ffd84d', '#c9a0ff', '#ffffff', '#ff6a5a'];
          [[4, 9], [10, 6], [8, 12]].forEach(([px, py], i) => { const cor = cores[(v + i) % cores.length]; ret(x, px, py + 1, 1, 3, '#3d7633'); ret(x, px - 1, py, 3, 1, cor); ret(x, px, py - 1, 1, 3, cor); P(x, px, py, '#ffe066'); });
          break; }
        case 'capim': { x.translate(0, 8); const cor = est === 2 ? ['#b8a050', '#d4bc68'] : est === 3 ? ['#c8d4e0', '#ffffff'] : ['#4a9a3c', '#7cc35a'];
          for (let i = 0; i < 6; i++) { const px = 2 + i * 2 + (i % 2); ret(x, px, 6 + (i % 3), 1, 9 - (i % 3), cor[0]); P(x, px, 5 + (i % 3), cor[1]); }
          break; }
        case 'junco': x.translate(0, 8); for (let i = 0; i < 4; i++) { ret(x, 3 + i * 3, 3 + (i % 2) * 2, 1, 12, '#6a8a3a'); ret(x, 3 + i * 3, 2 + (i % 2) * 2, 1, 3, '#8a5a32'); } break;
        case 'tronco': x.translate(0, 8); ret(x, 1, 7, 14, 6, '#7a4e2c'); ret(x, 1, 7, 14, 1, '#9a6a3e'); ret(x, 13, 7, 2, 6, '#c9a070'); P(x, 14, 9, '#8a5a32'); break;
        case 'cogumelo': x.translate(0, 8); ret(x, 7, 9, 2, 5, '#f4ead8'); disco(x, 8, 8, 3, '#d8343a'); P(x, 7, 7, '#ffffff'); P(x, 9, 8, '#ffffff'); break;
        case 'toco': x.translate(0, 8); ret(x, 4, 8, 8, 6, '#6b4226'); ret(x, 4, 7, 8, 2, '#c9a070'); P(x, 7, 7, '#8a5a32'); ret(x, 3, 13, 2, 1, '#6b4226'); break;
        case 'muda': case 'muda_pinheiro': x.translate(0, 8); ret(x, 7, 8, 1, 6, '#6b4226'); disco(x, 7, 7, 2, k === 'muda' ? '#5aa548' : '#2f6e44'); break;
        case 'murcha': x.translate(0, 8); ret(x, 7, 6, 1, 8, '#7a6040'); ret(x, 5, 8, 2, 1, '#8a7050'); ret(x, 8, 10, 2, 1, '#8a7050'); break;
        case 'parede_madeira': return { c: bloco('#c99560', '#9a6a3e', '#5a3a1e', x => { for (let y = 12; y < 23; y += 4) ret(x, 0, y, 16, 1, '#7a4e2c'); ret(x, 0, 2, 16, 1, '#b07a48'); ret(x, 0, 5, 16, 1, '#b07a48'); }), ox: 0, oy: -8 };
        case 'parede_pedra': return { c: bloco('#b4b4c0', '#8a8a98', '#55556a', x => { ret(x, 0, 15, 16, 1, '#6a6a7a'); ret(x, 7, 8, 1, 7, '#6a6a7a'); ret(x, 3, 16, 1, 7, '#6a6a7a'); ret(x, 11, 16, 1, 7, '#6a6a7a'); }), ox: 0, oy: -8 };
        case 'vidro': return { c: bloco('rgba(200,240,255,.75)', 'rgba(150,210,240,.55)', '#5a7a8a', x => { ret(x, 0, 0, 1, 24, '#7a9aaa'); ret(x, 15, 0, 1, 24, '#7a9aaa'); ret(x, 3, 11, 1, 8, 'rgba(255,255,255,.8)'); ret(x, 5, 10, 1, 4, 'rgba(255,255,255,.8)'); }), ox: 0, oy: -8 };
        case 'janela': return { c: bloco('#c99560', '#9a6a3e', '#5a3a1e', x => { ret(x, 3, 11, 10, 9, '#5a3a1e'); ret(x, 4, 12, 8, 7, '#9ad8f0'); ret(x, 7, 12, 1, 7, '#5a3a1e'); ret(x, 4, 15, 8, 1, '#5a3a1e'); ret(x, 5, 13, 1, 2, '#e8f8ff'); }), ox: 0, oy: -8 };
        case 'parede_vila': return { c: bloco('#d8cfc0', '#e8dccb', '#6a5a4a', x => { ret(x, 0, 21, 16, 2, '#9a8a7a'); ret(x, 0, 8, 1, 16, '#b8a898'); }), ox: 0, oy: -8 };
        case 'telhado': { const cor = [['#b8473a', '#d8604a', '#8a2f26'], ['#3a5a9a', '#4a72b8', '#2a3f70'], ['#3a7a4a', '#4a9a5a', '#28583a'], ['#8a5a9a', '#a874b8', '#5a3a6a']][v % 4];
          return { c: bloco(cor[1], cor[0], cor[2], x => { for (let y = 2; y < 24; y += 4) for (let px = (y / 4) % 2 ? 0 : 4; px < 16; px += 8) ret(x, px, y, 1, 3, cor[2]); for (let y = 3; y < 24; y += 4) ret(x, 0, y, 16, 1, cor[2]); }), ox: 0, oy: -8 }; }
        case 'rocha': { const d = AM.masmorraCores || { parede: '#3a2e24' }, b = rgb(d.parede);
          return { c: bloco(css(misturar(b, [255, 255, 255], .22)), d.parede, css(misturar(b, [0, 0, 0], .4)), x => { ret(x, 3, 13, 4, 1, css(misturar(b, [0, 0, 0], .3))); ret(x, 9, 18, 5, 1, css(misturar(b, [0, 0, 0], .3))); }), ox: 0, oy: -8 }; }
        case 'porta': case 'portao': case 'porta_vila':
          if (k === 'portao') { ret(x, 1, 12, 2, 12, '#8a5a32'); ret(x, 13, 12, 2, 12, '#8a5a32'); ret(x, 3, 14, 10, 2, '#b98552'); ret(x, 3, 19, 10, 2, '#b98552'); ret(x, 7, 14, 2, 7, '#a8703f'); break; }
          ret(x, 0, 0, 16, 8, '#c99560'); ret(x, 0, 7, 16, 1, '#5a3a1e'); ret(x, 1, 8, 14, 16, '#5a3a1e'); ret(x, 2, 9, 12, 15, '#8a5a32'); ret(x, 7, 9, 1, 15, '#6b4226'); ret(x, 11, 16, 2, 2, '#ffd23f'); break;
        case 'cerca': ret(x, 2, 12, 2, 12, '#8a5a32'); ret(x, 12, 12, 2, 12, '#8a5a32'); ret(x, 2, 11, 2, 1, '#b98552'); ret(x, 12, 11, 2, 1, '#b98552'); ret(x, 0, 15, 16, 2, '#a8703f'); ret(x, 0, 20, 16, 2, '#a8703f'); break;
        case 'tocha': ret(x, 7, 12, 2, 12, '#6b4226'); ret(x, 6, 10, 4, 3, '#3a2a20'); ret(x, 6, 6, 4, 5, '#ff9a2a'); ret(x, 7, 5, 2, 5, '#ffd84a'); P(x, 7, 4, '#fff3a0'); break;
        case 'fogueira': ret(x, 2, 18, 12, 4, '#8a8a96'); ret(x, 3, 17, 10, 1, '#a8a8b4'); ret(x, 4, 14, 8, 3, '#6b4226'); ret(x, 5, 9, 6, 6, '#ff7a2a'); ret(x, 6, 8, 4, 6, '#ffb83a'); ret(x, 7, 7, 2, 5, '#fff3a0'); break;
        case 'fogao': ret(x, 2, 8, 12, 15, '#3a3a46'); ret(x, 2, 8, 12, 3, '#5a5a6a'); ret(x, 4, 9, 3, 1, '#2a2a30'); ret(x, 9, 9, 3, 1, '#2a2a30'); ret(x, 4, 14, 8, 6, '#1e1e26'); ret(x, 5, 17, 6, 2, '#ff8a2a'); ret(x, 11, 2, 2, 7, '#5a5a6a'); break;
        case 'forno': disco(x, 8, 14, 7, '#9a8a7a'); ret(x, 1, 14, 14, 9, '#9a8a7a'); disco(x, 7, 13, 5, '#b4a492'); ret(x, 4, 15, 8, 7, '#2a1e18'); ret(x, 5, 18, 6, 3, '#ff7a2a'); ret(x, 6, 19, 4, 1, '#ffd84a'); break;
        case 'aquecedor': ret(x, 3, 9, 10, 14, '#5a5a6a'); ret(x, 3, 9, 10, 2, '#7a7a8a'); for (let px = 4; px < 12; px += 2) ret(x, px, 13, 1, 7, '#ff6a2a'); ret(x, 2, 22, 12, 2, '#3a3a46'); break;
        case 'cama': ret(x, 1, 8, 14, 16, '#6b4226'); ret(x, 2, 9, 12, 14, '#d84848'); ret(x, 2, 9, 12, 5, '#f4f0e8'); ret(x, 3, 10, 10, 3, '#ffffff'); ret(x, 2, 15, 12, 1, '#b83838'); break;
        case 'bau': ret(x, 2, 12, 12, 11, '#8a5a32'); ret(x, 2, 12, 12, 4, '#a8703f'); ret(x, 2, 16, 12, 1, '#5a3a1e'); ret(x, 7, 15, 2, 3, '#ffd23f'); ret(x, 2, 12, 1, 11, '#5a3a1e'); ret(x, 13, 12, 1, 11, '#5a3a1e'); break;
        case 'tesouro': ret(x, 2, 12, 12, 11, '#b8860b'); ret(x, 2, 12, 12, 4, '#ffd23f'); ret(x, 2, 16, 12, 1, '#7a5600'); ret(x, 7, 15, 2, 3, '#fff3a0'); P(x, 4, 13, '#ffffff'); break;
        case 'bancada': ret(x, 1, 10, 14, 4, '#b98552'); ret(x, 1, 10, 14, 1, '#d4a06a'); ret(x, 2, 14, 2, 9, '#8a5a32'); ret(x, 12, 14, 2, 9, '#8a5a32'); ret(x, 4, 8, 3, 2, '#9aa0b0'); ret(x, 9, 7, 1, 3, '#6b4226'); ret(x, 8, 7, 3, 1, '#c9d1dc'); break;
        case 'cocho': ret(x, 1, 14, 14, 8, '#8a5a32'); ret(x, 2, 14, 12, 3, '#5a3a1e'); if (v) ret(x, 2, 13, 12, 3, '#e8c25a'); ret(x, 2, 22, 2, 2, '#6b4226'); ret(x, 12, 22, 2, 2, '#6b4226'); break;
        case 'palha': x.translate(0, 8); ret(x, 1, 8, 14, 7, '#d8b44a'); ret(x, 2, 7, 12, 2, '#e8c86a'); for (let px = 2; px < 14; px += 3) ret(x, px, 9, 1, 5, '#b8902a'); break;
        case 'colmeia': ret(x, 3, 10, 10, 13, '#e8c25a'); ret(x, 3, 13, 10, 1, '#b8902a'); ret(x, 3, 17, 10, 1, '#b8902a'); ret(x, 2, 8, 12, 3, '#8a5a32'); ret(x, 7, 19, 2, 2, '#3a2a20'); break;
        case 'caixa_venda': ret(x, 1, 11, 14, 12, '#a8703f'); ret(x, 1, 9, 14, 4, '#c99560'); ret(x, 1, 13, 14, 1, '#5a3a1e'); ret(x, 6, 16, 4, 4, '#ffd23f'); P(x, 7, 17, '#b8860b'); break;
        case 'espantalho': ret(x, 7, 6, 2, 18, '#6b4226'); ret(x, 2, 11, 12, 2, '#6b4226'); disco(x, 8, 5, 3, '#e8c25a'); ret(x, 4, 1, 8, 2, '#8a5a32'); ret(x, 5, 12, 6, 7, '#3a6ab0'); P(x, 7, 5, '#3a2a20'); P(x, 9, 5, '#3a2a20'); break;
        case 'mesa': ret(x, 1, 11, 14, 5, '#b98552'); ret(x, 1, 11, 14, 1, '#d4a06a'); ret(x, 2, 16, 2, 7, '#8a5a32'); ret(x, 12, 16, 2, 7, '#8a5a32'); break;
        case 'cadeira': ret(x, 4, 8, 8, 8, '#8a5a32'); ret(x, 4, 15, 8, 2, '#b98552'); ret(x, 4, 17, 2, 6, '#6b4226'); ret(x, 10, 17, 2, 6, '#6b4226'); break;
        case 'vaso': ret(x, 4, 16, 8, 7, '#b8603a'); ret(x, 3, 15, 10, 2, '#d0784a'); disco(x, 8, 12, 4, '#4a9a44'); P(x, 6, 10, '#ff8fb8'); P(x, 10, 12, '#ffd84d'); P(x, 8, 9, '#ffffff'); break;
        case 'balcao': ret(x, 0, 11, 16, 12, '#8a5a32'); ret(x, 0, 9, 16, 4, '#d4a06a'); ret(x, 0, 13, 16, 1, '#5a3a1e'); ret(x, 3, 16, 10, 4, '#6b4226'); break;
        case 'quadro': ret(x, 1, 2, 14, 13, '#8a5a32'); ret(x, 2, 3, 12, 11, '#c9a070'); [[3, 4, '#fff8e7'], [8, 4, '#ffe8b0'], [4, 9, '#f8f0ff'], [9, 9, '#fff8e7']].forEach(([px, py, cor]) => { ret(x, px, py, 4, 4, cor); P(x, px + 1, py, '#d8343a'); }); ret(x, 3, 15, 2, 9, '#6b4226'); ret(x, 11, 15, 2, 9, '#6b4226'); break;
        case 'placa': ret(x, 7, 14, 2, 10, '#6b4226'); ret(x, 2, 8, 12, 7, '#b98552'); ret(x, 3, 10, 8, 1, '#5a3a1e'); ret(x, 3, 12, 6, 1, '#5a3a1e'); break;
        case 'poco': ret(x, 2, 14, 12, 9, '#9a9aa6'); ret(x, 3, 13, 10, 3, '#3f86d0'); ret(x, 2, 13, 12, 1, '#b4b4c0'); ret(x, 2, 4, 2, 10, '#6b4226'); ret(x, 12, 4, 2, 10, '#6b4226'); ret(x, 1, 3, 14, 2, '#8a2f26'); ret(x, 7, 5, 2, 5, '#c9a070'); break;
        case 'entrada': { const [c2, x2] = nova(16, 24); disco(x2, 8, 14, 9, '#6a6a76'); disco(x2, 7, 13, 8, '#8a8a96'); ret(x2, 3, 13, 10, 10, '#8a8a96'); disco(x2, 8, 17, 4, '#120e14'); ret(x2, 4, 17, 8, 7, '#120e14'); ret(x2, 6, 7, 3, 1, '#b4b4c0'); return { c: c2, ox: 0, oy: -8 }; }
        case 'saida': x.translate(0, 8); ret(x, 2, 1, 12, 14, '#2a2420'); for (let y = 2; y < 15; y += 3) ret(x, 3, y, 10, 2, '#a8703f'); ret(x, 7, 0, 2, 1, '#ffd23f'); break;
        case 'barraca': { const cor = [['#d84848', '#f4f0e8'], ['#3a6ab0', '#f4f0e8'], ['#3a9a4a', '#ffe8b0'], ['#e8a030', '#fff8e7']][v % 4];
          ret(x, 1, 10, 2, 14, '#6b4226'); ret(x, 13, 10, 2, 14, '#6b4226');
          for (let px = 0; px < 16; px += 4) { ret(x, px, 4, 2, 7, cor[0]); ret(x, px + 2, 4, 2, 7, cor[1]); }
          ret(x, 0, 11, 16, 1, cor[0]); ret(x, 0, 16, 16, 4, '#b98552'); ret(x, 0, 16, 16, 1, '#d4a06a'); break; }
        case 'lampiao': ret(x, 7, 6, 2, 18, '#3a3a46'); ret(x, 5, 1, 6, 6, '#3a3a46'); ret(x, 6, 2, 4, 4, '#ffe08a'); ret(x, 4, 0, 8, 1, '#3a3a46'); break;
        default: ret(x, 2, 10, 12, 12, '#ff00ff');
      }
      return { c, ox: 0, oy };
    });
  }

  // ---------- plantações (fase 0 a 4; 4 = pronta) ----------
  function planta(tipo, fase, morta) {
    return memo(`p${tipo}.${fase}.${morta ? 1 : 0}`, () => {
      const [c, x] = nova(16, 22), cu = AM.CULTURAS[tipo], verde = morta ? '#8a7050' : '#4a9a3c', claro = morta ? '#a08a60' : '#7cc35a';
      const base = 21;
      if (fase === 0) { P(x, 5, base - 3, '#6b4226'); P(x, 9, base - 4, '#6b4226'); P(x, 11, base - 2, '#6b4226'); return c; }
      if (fase === 1) { ret(x, 7, base - 5, 1, 4, verde); ret(x, 5, base - 6, 2, 1, claro); ret(x, 8, base - 7, 2, 1, claro); return c; }
      const alto = cu.forma === 'trigo' || cu.forma === 'comprida';
      const h = fase === 2 ? 7 : alto ? 15 : 10;
      ret(x, 7, base - h, 2, h, verde);
      for (let i = 0; i < (fase === 2 ? 2 : 4); i++) { const py = base - 3 - i * Math.floor(h / 4); ret(x, i % 2 ? 9 : 4, py, 3, 2, claro); ret(x, i % 2 ? 9 : 4, py + 1, 3, 1, verde); }
      if (fase === 4 && !morta) {
        const [a, b] = [cu.cor, cu.cor2];
        switch (cu.forma) {
          case 'raiz': ret(x, 5, base - 3, 6, 4, a); ret(x, 5, base - 3, 6, 1, b); break;
          case 'redonda': disco(x, 5, base - 7, 2, a); disco(x, 11, base - 5, 2, a); P(x, 4, base - 8, '#ffffff'); break;
          case 'morango': [[4, base - 6], [10, base - 8], [8, base - 3]].forEach(([px, py]) => { ret(x, px, py, 3, 3, a); P(x, px + 1, py + 1, b); }); break;
          case 'trigo': for (let i = 0; i < 3; i++) { ret(x, 4 + i * 3, base - 16, 2, 5, a); P(x, 4 + i * 3, base - 17, b); } break;
          case 'comprida': ret(x, 9, base - 12, 3, 7, a); ret(x, 10, base - 13, 1, 1, b); ret(x, 3, base - 9, 3, 6, a); break;
          case 'listrada': disco(x, 8, base - 4, 5, a); for (let px = 4; px < 13; px += 3) ret(x, px, base - 8, 1, 8, b); break;
          case 'abobora': disco(x, 8, base - 4, 5, a); ret(x, 6, base - 9, 1, 9, b); ret(x, 10, base - 9, 1, 9, b); ret(x, 8, base - 11, 1, 3, '#6b4226'); break;
          case 'folha': disco(x, 8, base - 6, 5, a); disco(x, 8, base - 7, 3, b); P(x, 6, base - 9, '#ffffff'); break;
          default: disco(x, 8, base - 6, 3, a);
        }
      }
      return c;
    });
  }

  return { nova, memo, chao, objeto, planta, P };
})();
