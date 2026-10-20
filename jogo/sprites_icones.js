// Ícones 16x16 dos itens (inventário, lojas, receitas), feitos por código.
'use strict';

(() => {
  const { nova, memo, P } = AM.spr;
  const urls = new Map();

  const PINTORES = {
    semente(x, cor) { ret(x, 3, 2, 10, 12, '#e8d8b0'); ret(x, 3, 2, 10, 2, '#c9b080'); ret(x, 5, 6, 6, 6, cor); ret(x, 6, 7, 2, 2, '#ffffff'); ret(x, 3, 13, 10, 1, '#a89060'); },
    fruta(x, forma, a, b) {
      switch (forma) {
        case 'raiz': disco(x, 8, 9, 5, a); ret(x, 3, 6, 10, 3, b); ret(x, 7, 1, 2, 4, '#4a9a3c'); ret(x, 5, 2, 2, 2, '#7cc35a'); ret(x, 8, 14, 1, 2, '#c8b8a8'); break;
        case 'redonda': disco(x, 8, 9, 6, a); ret(x, 4, 5, 2, 2, '#ffffff'); ret(x, 7, 2, 3, 2, b); break;
        case 'morango': for (let y = 4; y < 15; y++) { const w = Math.max(1, 6 - Math.floor((y - 4) * .55)); ret(x, 8 - w, y, w * 2, 1, a); } [[6, 7], [10, 8], [8, 11], [6, 10]].forEach(([px, py]) => P(x, px, py, b)); ret(x, 5, 3, 6, 2, '#4a9a3c'); break;
        case 'trigo': for (let i = 0; i < 3; i++) { ret(x, 4 + i * 3, 2, 2, 7, a); ret(x, 5 + i * 3, 9, 1, 6, b); } ret(x, 4, 10, 8, 1, '#8a5a32'); break;
        case 'comprida': ret(x, 5, 3, 6, 11, a); ret(x, 6, 2, 4, 1, a); ret(x, 5, 3, 2, 11, css(misturar(rgb(a), [255, 255, 255], .25))); ret(x, 7, 0, 2, 3, b); break;
        case 'listrada': disco(x, 8, 9, 6, a); for (let px = 4; px < 13; px += 3) ret(x, px, 3, 1, 12, b); break;
        case 'abobora': disco(x, 8, 9, 6, a); ret(x, 6, 3, 1, 12, b); ret(x, 10, 3, 1, 12, b); ret(x, 7, 1, 2, 3, '#6b4226'); break;
        case 'folha': disco(x, 8, 9, 6, a); disco(x, 8, 8, 4, b); ret(x, 7, 4, 2, 10, '#c8e8b0'); break;
        case 'cacho': [[6, 6], [10, 6], [8, 9], [5, 10], [11, 10], [8, 13]].forEach(([px, py]) => disco(x, px, py, 2, a)); ret(x, 7, 1, 2, 4, b); break;
        default: disco(x, 8, 8, 5, a);
      }
    },
    prato(x, cor) { elipse(x, 8, 11, 7, 3, '#e8e8f0'); elipse(x, 8, 10, 6, 2, '#ffffff'); elipse(x, 8, 8, 4, 3, cor); ret(x, 6, 6, 2, 1, '#ffffff'); ret(x, 10, 2, 1, 3, 'rgba(255,255,255,.7)'); ret(x, 6, 1, 1, 3, 'rgba(255,255,255,.6)'); },
    pao(x) { elipse(x, 8, 9, 6, 4, '#c98a3a'); elipse(x, 8, 8, 5, 3, '#e0a84a'); ret(x, 5, 7, 1, 2, '#a86a2a'); ret(x, 8, 6, 1, 2, '#a86a2a'); ret(x, 11, 7, 1, 2, '#a86a2a'); },
    torta(x, cor) { ret(x, 2, 8, 12, 5, '#d8a050'); ret(x, 3, 6, 10, 3, cor); ret(x, 2, 12, 12, 2, '#b07a30'); ret(x, 4, 6, 2, 1, '#ffffff'); },
    sopa(x, cor) { elipse(x, 8, 10, 7, 4, '#8a5a32'); elipse(x, 8, 8, 6, 2, cor); ret(x, 6, 2, 1, 4, 'rgba(255,255,255,.6)'); ret(x, 10, 3, 1, 3, 'rgba(255,255,255,.6)'); },
    cogumelo(x) { ret(x, 7, 8, 3, 6, '#f4ead8'); disco(x, 8, 7, 5, '#d8343a'); ret(x, 3, 7, 11, 1, '#d8343a'); P(x, 6, 4, '#ffffff'); P(x, 10, 6, '#ffffff'); P(x, 8, 3, '#ffffff'); },
    peixe(x, cor) { elipse(x, 7, 8, 5, 3, cor); ret(x, 12, 6, 3, 5, cor); P(x, 4, 7, '#1d1d2b'); ret(x, 5, 9, 5, 1, css(misturar(rgb(cor), [255, 255, 255], .4))); },
    carne(x) { elipse(x, 8, 9, 6, 4, '#c8404a'); elipse(x, 8, 9, 4, 2, '#e8707a'); ret(x, 12, 6, 3, 2, '#f4f0e8'); },
    ovo(x) { elipse(x, 8, 9, 4, 5, '#f4f0e8'); ret(x, 6, 6, 1, 2, '#ffffff'); },
    garrafa(x, cor) { ret(x, 6, 1, 4, 2, '#8a5a32'); ret(x, 6, 3, 4, 3, '#c8e0f0'); ret(x, 4, 6, 8, 9, '#c8e0f0'); ret(x, 5, 8, 6, 6, cor); ret(x, 5, 7, 1, 6, '#ffffff'); },
    pote(x, cor) { ret(x, 3, 3, 10, 2, '#8a5a32'); ret(x, 3, 5, 10, 10, '#f0e8d0'); ret(x, 4, 7, 8, 7, cor); ret(x, 5, 8, 1, 4, '#ffe8a0'); },
    madeira(x) { ret(x, 2, 6, 12, 6, '#8a5a32'); ret(x, 2, 6, 12, 2, '#a8703f'); disco(x, 13, 9, 3, '#c9a070'); P(x, 13, 9, '#8a5a32'); ret(x, 3, 3, 10, 3, '#9a6a3e'); },
    pedra(x) { disco(x, 8, 9, 5, '#7a7a86'); disco(x, 7, 8, 4, '#a0a0ac'); ret(x, 5, 6, 2, 1, '#d0d0d8'); },
    fibra(x) { for (let i = 0; i < 5; i++) ret(x, 3 + i * 2, 2 + (i % 2), 1, 12, i % 2 ? '#7ab04a' : '#5a9a3c'); ret(x, 3, 9, 10, 2, '#c9a070'); },
    feno(x) { ret(x, 2, 6, 12, 8, '#e0b84a'); ret(x, 2, 6, 12, 2, '#f0d070'); for (let px = 3; px < 14; px += 3) ret(x, px, 8, 1, 5, '#b8902a'); ret(x, 2, 10, 12, 1, '#8a5a32'); },
    flor(x) { ret(x, 7, 8, 2, 7, '#3d7633'); [[8, 3], [5, 6], [11, 6], [6, 9], [10, 9]].forEach(([px, py]) => disco(x, px, py, 2, '#ff8fb8')); disco(x, 8, 6, 2, '#ffe066'); },
    minerio(x, cor) { disco(x, 8, 9, 6, '#6a6a76'); disco(x, 7, 8, 5, '#8a8a96'); [[5, 6], [9, 9], [7, 11], [10, 5]].forEach(([px, py]) => ret(x, px, py, 2, 2, cor)); },
    barra(x, cor) { const b = rgb(cor); ret(x, 2, 7, 12, 6, css(misturar(b, [0, 0, 0], .25))); ret(x, 3, 5, 10, 3, cor); ret(x, 4, 5, 6, 1, css(misturar(b, [255, 255, 255], .5))); },
    cristal(x, cor) { const b = rgb(cor); [[5, 4, 3, 10], [8, 1, 3, 13], [11, 6, 2, 8]].forEach(([px, py, w, h]) => { ret(x, px, py, w, h, cor); ret(x, px, py, 1, h, css(misturar(b, [255, 255, 255], .6))); }); ret(x, 4, 13, 9, 2, '#6a6a7a'); },
    carvao(x) { disco(x, 8, 9, 5, '#2a2a30'); disco(x, 7, 8, 3, '#3a3a44'); P(x, 6, 6, '#5a5a66'); },
    couro(x) { ret(x, 3, 3, 10, 10, '#a0603a'); ret(x, 2, 5, 12, 6, '#a0603a'); ret(x, 4, 4, 8, 1, '#c07a4a'); P(x, 3, 3, '#c9a070'); },
    la(x) { disco(x, 6, 9, 4, '#f8f6f0'); disco(x, 10, 8, 4, '#ffffff'); disco(x, 8, 6, 3, '#ffffff'); },
    tecido(x) { ret(x, 2, 4, 12, 9, '#c8a8e0'); for (let px = 2; px < 14; px += 3) ret(x, px, 4, 1, 9, '#a888c8'); ret(x, 2, 11, 12, 2, '#a888c8'); },
    osso(x) { ret(x, 4, 7, 8, 2, '#f0ead8'); disco(x, 3, 6, 2, '#f0ead8'); disco(x, 3, 10, 2, '#f0ead8'); disco(x, 13, 6, 2, '#f0ead8'); disco(x, 13, 10, 2, '#f0ead8'); },
    gosma(x) { elipse(x, 8, 10, 6, 4, '#5ac05a'); elipse(x, 8, 9, 4, 3, '#8ae08a'); P(x, 6, 7, '#ffffff'); },
    enxada(x) { for (let i = 0; i < 10; i++) ret(x, 3 + i, 13 - i, 2, 2, '#8a5a32'); ret(x, 10, 2, 5, 3, '#9aa0b0'); ret(x, 13, 5, 2, 2, '#9aa0b0'); },
    regador(x) { ret(x, 3, 6, 8, 8, '#5a8ac8'); ret(x, 3, 6, 8, 2, '#7aaae0'); ret(x, 11, 8, 4, 2, '#5a8ac8'); ret(x, 14, 6, 2, 2, '#5a8ac8'); ret(x, 5, 3, 4, 3, '#3a6aa8'); },
    machado(x) { for (let i = 0; i < 11; i++) ret(x, 3 + i, 14 - i, 2, 2, '#8a5a32'); ret(x, 9, 2, 5, 6, '#c9d1dc'); ret(x, 9, 2, 1, 6, '#ffffff'); },
    picareta(x) { for (let i = 0; i < 10; i++) ret(x, 5 + i * .6, 14 - i, 2, 2, '#8a5a32'); ret(x, 2, 3, 12, 2, '#9aa0b0'); ret(x, 1, 5, 2, 2, '#9aa0b0'); ret(x, 13, 5, 2, 2, '#9aa0b0'); },
    vara(x) { for (let i = 0; i < 12; i++) P(x, 2 + i, 14 - i, '#8a5a32'); ret(x, 13, 2, 1, 9, '#e8e8f0'); ret(x, 12, 11, 3, 2, '#e8354a'); },
    cantil(x) { elipse(x, 8, 9, 5, 5, '#8a5a32'); elipse(x, 8, 9, 3, 3, '#a8703f'); ret(x, 7, 2, 2, 3, '#5a3a1e'); ret(x, 3, 4, 10, 1, '#5a3a1e'); },
    espada(x, cor) { for (let i = 0; i < 9; i++) ret(x, 5 + i, 10 - i, 2, 2, cor); P(x, 14, 1, '#ffffff'); ret(x, 3, 10, 5, 2, '#6b4226'); ret(x, 2, 12, 3, 3, '#8a5a32'); ret(x, 5, 8, 2, 5, '#ffd23f'); },
    arco(x) { for (let i = 0; i < 12; i++) { const px = 4 + Math.round(Math.sin(i / 11 * Math.PI) * 6); P(x, px, 2 + i, '#8a5a32'); P(x, px + 1, 2 + i, '#a8703f'); } ret(x, 4, 2, 1, 12, '#e8e8f0'); },
    flecha(x) { for (let i = 0; i < 10; i++) P(x, 3 + i, 12 - i, '#8a5a32'); ret(x, 12, 2, 2, 2, '#9aa0b0'); ret(x, 2, 12, 2, 2, '#f4f0e8'); P(x, 4, 13, '#e8354a'); },
    piso(x, cor) { const b = rgb(cor); ret(x, 1, 3, 14, 10, cor); ret(x, 1, 3, 14, 1, css(misturar(b, [255, 255, 255], .3))); ret(x, 1, 8, 14, 1, css(misturar(b, [0, 0, 0], .25))); ret(x, 7, 3, 1, 5, css(misturar(b, [0, 0, 0], .25))); ret(x, 1, 13, 14, 1, css(misturar(b, [0, 0, 0], .4))); },
    carrinho(x) { ret(x, 2, 5, 12, 6, '#a8703f'); ret(x, 2, 5, 12, 2, '#c99560'); disco(x, 4, 12, 2, '#3a3a46'); disco(x, 12, 12, 2, '#3a3a46'); ret(x, 13, 3, 2, 3, '#6b4226'); ret(x, 5, 7, 6, 2, '#d84848'); },
    balao(x) { for (let dy = -6; dy <= 6; dy++) { const w = Math.round(Math.sqrt(40 - dy * dy)); for (let dx = -w; dx <= w; dx++) P(x, 8 + dx, 6 + dy, Math.floor((dx + 7) / 2) % 2 ? '#e2484f' : '#ffd23f'); } ret(x, 6, 13, 4, 3, '#8a5a32'); },
    faixa(x) { ret(x, 1, 6, 14, 4, '#2a3a6a'); ret(x, 4, 5, 8, 6, '#c9d1dc'); ret(x, 5, 6, 6, 1, '#ffffff'); ret(x, 7, 7, 2, 2, '#5a6a7a'); ret(x, 13, 9, 2, 5, '#2a3a6a'); },
    ampulheta(x) { ret(x, 3, 1, 10, 2, '#b06aff'); ret(x, 3, 13, 10, 2, '#b06aff'); for (let i = 0; i < 5; i++) { ret(x, 4 + i, 3 + i, 8 - i * 2, 1, '#e8f0ff'); ret(x, 4 + i, 12 - i, 8 - i * 2, 1, '#e8f0ff'); } ret(x, 6, 10, 4, 2, '#ffd23f'); P(x, 8, 7, '#ffd23f'); },
    obj(x, id) {
      const s = AM.spr.objeto(AM.OB[id.toUpperCase()]);
      if (!s) return;
      const h = s.c.height, w = s.c.width, k = Math.min(1, 16 / Math.max(w, h - (h > 24 ? 0 : 6)));
      x.imageSmoothingEnabled = false;
      const dw = Math.round(w * k), dh = Math.round(h * k);
      x.drawImage(s.c, Math.round((16 - dw) / 2), 16 - dh, dw, dh);
    },
    animal(x, tipo) {
      x.save(); x.translate(8, 15);
      if (['vaca', 'cavalo'].includes(tipo)) x.scale(.8, .8);
      AM.spr.animal(x, { tipo, x: 0, y: 0, dir: 1, id: 1 }, 0);
      x.restore();
    },
  };

  function icone(id) {
    return memo('i' + id, () => {
      const [c, x] = nova(16, 16);
      if (id.startsWith('animal:')) { PINTORES.animal(x, id.slice(7)); return c; }
      const it = AM.ITENS[id];
      const ic = (it && it.ic) || ['pedra'];
      (PINTORES[ic[0]] || PINTORES.pedra)(x, ...ic.slice(1));
      return c;
    });
  }
  function iconeURL(id) {
    if (!urls.has(id)) urls.set(id, icone(id).toDataURL());
    return urls.get(id);
  }

  Object.assign(AM.spr, { icone, iconeURL });
})();
