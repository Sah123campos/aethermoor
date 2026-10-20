// Pixel art dos seres: pessoas (jogador e moradores), criaturas, chefes,
// animais e a cabecinha do Doidobot no mundo.
'use strict';

(() => {
  const { nova, memo, P } = AM.spr;

  AM.PALETAS = {
    jogador: { pele: '#e0ac7e', cabelo: '#3b2416', roupa: '#3f6fb5', roupaS: '#2d528a', calca: '#3c3f58', bota: '#4a2f1f', lenco: '#d94848', tipo: 'curto' },
    bento:   { pele: '#c68a5e', cabelo: '#2a1d14', roupa: '#4a8a4a', roupaS: '#366a36', calca: '#4a3a2a', bota: '#2a1d14', avental: '#f4f0e8', tipo: 'careca' },
    brasa:   { pele: '#f0c090', cabelo: '#d8402a', roupa: '#5a3a2a', roupaS: '#40281c', calca: '#3a2a20', bota: '#1e1410', avental: '#7a4e2c', tipo: 'longo' },
    tiao:    { pele: '#a8703f', cabelo: '#1a120c', roupa: '#b83a3a', roupaS: '#8a2a2a', calca: '#3a4a6a', bota: '#4a2f1f', tipo: 'chapeu' },
    cida:    { pele: '#e8b890', cabelo: '#c8c8d0', roupa: '#7a5aa8', roupaS: '#5a4080', calca: '#4a3a5a', bota: '#3a2a20', tipo: 'coque' },
    iara:    { pele: '#b8784a', cabelo: '#1a120c', roupa: '#5a2a8a', roupaS: '#401e64', calca: '#2a1e3a', bota: '#1e1410', detalhe: '#ffd23f', tipo: 'longo' },
    morador1:{ pele: '#d8a070', cabelo: '#6a3a1a', roupa: '#d8a030', roupaS: '#a87820', calca: '#3a3a4a', bota: '#3a2a20', tipo: 'curto' },
    morador2:{ pele: '#8a5a3a', cabelo: '#17110d', roupa: '#3a9aa8', roupaS: '#2a7a86', calca: '#5a4a3a', bota: '#2a1d14', tipo: 'cacheado' },
    morador3:{ pele: '#f2d0b0', cabelo: '#e8c25a', roupa: '#e86a8a', roupaS: '#c04a6a', calca: '#4a4a6a', bota: '#3a2a20', tipo: 'longo' },
  };

  // pessoa 16x24, pés em (8, 23). dir: baixo, cima, esq, dir. quadro 0-3 (andar)
  function pessoa(nomePaleta, dir, quadro, extras = {}) {
    const chave = `h${nomePaleta}.${dir}.${quadro}.${extras.faixa ? 1 : 0}`;
    return memo(chave, () => {
      const pl = AM.PALETAS[nomePaleta] || AM.PALETAS.jogador;
      const [c, x] = nova(16, 24);
      const espelho = dir === 'esq';
      if (espelho) { x.translate(16, 0); x.scale(-1, 1); }
      const lado = dir === 'esq' || dir === 'dir', costas = dir === 'cima';
      const passo = quadro % 2 === 1 ? (quadro === 1 ? 1 : -1) : 0;
      const bob = quadro % 2 === 1 ? -1 : 0;
      // pernas e botas
      if (lado) {
        ret(x, 6 + passo, 18, 2, 4, pl.calca); ret(x, 8 - passo, 18, 2, 4, pl.calca);
        ret(x, 6 + passo, 22, 3, 2, pl.bota); ret(x, 8 - passo, 22, 3, 2, pl.bota);
      } else {
        ret(x, 5, 18 - (passo > 0 ? 1 : 0), 2, 4, pl.calca); ret(x, 9, 18 - (passo < 0 ? 1 : 0), 2, 4, pl.calca);
        ret(x, 5, 22 - (passo > 0 ? 1 : 0), 2, 2, pl.bota); ret(x, 9, 22 - (passo < 0 ? 1 : 0), 2, 2, pl.bota);
      }
      // corpo
      const cx0 = lado ? 5 : 4, cw = lado ? 6 : 8;
      ret(x, cx0, 11 + bob, cw, 7, pl.roupa); ret(x, cx0 + cw - 2, 11 + bob, 2, 7, pl.roupaS);
      if (pl.avental && !costas) ret(x, cx0 + 1, 13 + bob, cw - 2, 5, pl.avental);
      if (pl.detalhe) ret(x, cx0, 16 + bob, cw, 1, pl.detalhe);
      ret(x, cx0, 17 + bob, cw, 1, '#5a3a1e');
      if (pl.lenco) { ret(x, cx0, 11 + bob, cw, 2, pl.lenco); if (costas) ret(x, 7, 13 + bob, 2, 3, pl.lenco); }
      // braços
      if (lado) { ret(x, 7 - passo, 12 + bob, 2, 5, pl.roupaS); ret(x, 7 - passo, 16 + bob, 2, 1, pl.pele); }
      else { ret(x, 3, 12 + bob - passo, 1, 5, pl.roupaS); ret(x, 3, 16 + bob - passo, 1, 1, pl.pele); ret(x, 12, 12 + bob + passo, 1, 5, pl.roupaS); ret(x, 12, 16 + bob + passo, 1, 1, pl.pele); }
      // cabeça
      const hx = lado ? 5 : 4;
      ret(x, hx, 3 + bob, lado ? 7 : 8, 8, pl.pele);
      ret(x, hx, 10 + bob, lado ? 7 : 8, 1, css(misturar(rgb(pl.pele), [0, 0, 0], .18)));
      const cab = pl.cabelo, t = pl.tipo;
      if (t !== 'careca') {
        ret(x, hx - (lado ? 0 : 1), 1 + bob, lado ? 8 : 10, 3, cab);
        if (costas) ret(x, hx, 3 + bob, 8, t === 'longo' ? 9 : 6, cab);
        else if (lado) { ret(x, hx, 3 + bob, 3, t === 'longo' ? 8 : 4, cab); ret(x, hx + 3, 3 + bob, 4, 1, cab); }
        else { ret(x, hx - 1, 3 + bob, 1, t === 'longo' ? 8 : 4, cab); ret(x, hx + 8, 3 + bob, 1, t === 'longo' ? 8 : 4, cab); ret(x, hx, 3 + bob, 3, 1, cab); ret(x, hx + 5, 3 + bob, 3, 1, cab); }
        if (t === 'cacheado') for (let i = 0; i < 5; i++) P(x, hx + i * 2 - (lado ? 0 : 1), 0 + bob, cab);
        if (t === 'coque') ret(x, hx + 2, 0 + bob - 1, 4, 2, cab);
      } else ret(x, hx, 3 + bob, lado ? 7 : 8, 1, css(misturar(rgb(pl.pele), [0, 0, 0], .12)));
      if (t === 'chapeu') { ret(x, hx - 2, 2 + bob, lado ? 11 : 12, 2, '#e8c25a'); ret(x, hx, -1 + bob + 1, lado ? 7 : 8, 3, '#d8b44a'); ret(x, hx, 2 + bob, lado ? 7 : 8, 1, '#b83a3a'); }
      if (extras.faixa) { ret(x, hx - (lado ? 0 : 1), 4 + bob, lado ? 8 : 10, 2, '#2a3a6a'); if (!costas) ret(x, lado ? hx + 3 : hx + 2, 4 + bob, 4, 2, '#c9d1dc'); if (costas || lado) ret(x, lado ? hx - 2 : 7, 5 + bob, 2, 4, '#2a3a6a'); }
      // olhos
      if (!costas) {
        const ol = '#1d1d2b';
        if (lado) ret(x, hx + 5, 6 + bob, 1, 2, ol);
        else { ret(x, hx + 2, 6 + bob, 1, 2, ol); ret(x, hx + 5, 6 + bob, 1, 2, ol); }
      }
      return c;
    });
  }

  // ---------- criaturas (desenhadas na hora) ----------
  function mob(x, m, t) {
    const d = AM.MOBS[m.tipo], cor = d.cor, base = rgb(cor);
    const escuro = css(misturar(base, [0, 0, 0], .35)), claro = css(misturar(base, [255, 255, 255], .35));
    const px = Math.round(m.x), py = Math.round(m.y);
    x.save();
    x.translate(px, py);
    if (d.tam) x.scale(d.tam, d.tam);
    if (m.dir < 0) x.scale(-1, 1);
    if (m.piscar > 0 && Math.floor(t / 60) % 2) x.globalAlpha = .4;
    switch (d.ia === 'voa' ? m.tipo : d.ia === 'pula' ? 'slime' : m.tipo) {
      case 'slime': {
        const fase = m.pulo || 0, sq = 1 + Math.sin(t / 160 + m.id) * .08 - fase * .1;
        const w = Math.round(7 * sq), h = Math.round(6 / sq);
        const y0 = -Math.round(fase * 6);
        elipse(x, 0, y0 - h, w, h, escuro); elipse(x, 0, y0 - h - 1, w - 1, h - 1, cor);
        ret(x, -w + 2, y0 - h * 2 + 2, 2, 2, claro);
        ret(x, -3, y0 - h - 2, 2, 2, '#1d1d2b'); ret(x, 2, y0 - h - 2, 2, 2, '#1d1d2b');
        if (d.chefe) { ret(x, -4, y0 - h * 2 - 3, 9, 2, '#ffd23f'); P(x, -4, y0 - h * 2 - 4, '#ffd23f'); P(x, 0, y0 - h * 2 - 5, '#ffd23f'); P(x, 4, y0 - h * 2 - 4, '#ffd23f'); P(x, 0, y0 - h * 2 - 3, '#e8354a'); }
        break;
      }
      case 'goblin': case 'esqueleto': case 'rei_esqueleto': {
        const osso = m.tipo !== 'goblin', passo = Math.floor(t / 150) % 2;
        const pele = osso ? cor : '#7ab04a', roupa = osso ? '#c8c2b0' : '#6a4a2a';
        ret(x, -3, -6 + passo, 2, 6 - passo, osso ? pele : '#4a3a2a'); ret(x, 1, -6 + (1 - passo), 2, 6 - (1 - passo), osso ? pele : '#4a3a2a');
        ret(x, -4, -12, 8, 7, roupa); if (osso) { ret(x, -3, -11, 6, 1, '#9a9488'); ret(x, -3, -9, 6, 1, '#9a9488'); }
        ret(x, -4, -19, 8, 7, pele); ret(x, -4, -13, 8, 1, escuro);
        if (!osso) { ret(x, -6, -18, 2, 2, pele); ret(x, 4, -18, 2, 2, pele); }
        ret(x, -2, -16, 1, 2, osso ? '#1d1d2b' : '#ffe066'); ret(x, 2, -16, 1, 2, osso ? '#1d1d2b' : '#ffe066');
        if (osso) ret(x, -1, -14, 3, 1, '#1d1d2b');
        ret(x, 4, -11, 1, 6, osso ? '#8a7a60' : '#c9d1dc'); // arma
        if (m.tipo === 'rei_esqueleto') { ret(x, -4, -22, 8, 3, '#ffd23f'); P(x, -4, -23, '#ffd23f'); P(x, 0, -23, '#ffd23f'); P(x, 3, -23, '#ffd23f'); P(x, -1, -21, '#b06aff'); ret(x, -5, -12, 1, 8, '#5a2a8a'); ret(x, 4, -12, 1, 8, '#5a2a8a'); }
        break;
      }
      case 'lobo_selvagem': case 'lobo_alfa': case 'lobo': {
        const passo = Math.floor(t / 110) % 2;
        ret(x, -7, -9, 12, 6, cor); ret(x, -7, -9, 12, 2, claro); ret(x, -7, -4, 12, 1, escuro);
        ret(x, 4, -12, 5, 5, cor); ret(x, 8, -10, 2, 2, escuro); ret(x, 5, -14, 2, 2, cor); P(x, 7, -11, '#1d1d2b');
        ret(x, -10, -10 - passo, 3, 2, cor);
        ret(x, -6, -3, 2, 3 - passo, escuro); ret(x, -2, -3, 2, 2 + passo, escuro); ret(x, 1, -3, 2, 3 - passo, escuro); ret(x, 4, -3, 2, 2 + passo, escuro);
        if (m.tipo === 'lobo') ret(x, 4, -8, 4, 1, '#d84848');
        if (m.tipo === 'lobo_alfa') { ret(x, -5, -11, 8, 2, '#ffffff'); P(x, 7, -11, '#5fd6f0'); }
        break;
      }
      case 'escorpiao': case 'escorpiao_rei': {
        const p = Math.floor(t / 140) % 2;
        elipse(x, 0, -4, 6, 3, cor); ret(x, -5, -6, 10, 1, claro);
        ret(x, 6, -6, 3, 2, cor); ret(x, 8, -8 + p, 2, 2, escuro);
        ret(x, -8, -6, 3, 2, cor); ret(x, -10, -10, 2, 5, cor); ret(x, -10, -12, 4, 2, cor); P(x, -6, -12, '#1d1d2b');
        for (let i = -4; i <= 4; i += 4) ret(x, i, -1 + (p && i === 0 ? 1 : 0), 1, 2, escuro);
        P(x, 3, -5, '#1d1d2b'); P(x, 5, -5, '#1d1d2b');
        break;
      }
      case 'morcego': {
        const asa = Math.floor(t / 90) % 2, y0 = -10 + Math.round(Math.sin(t / 200 + m.id) * 2);
        ret(x, -2, y0 - 2, 4, 4, cor); P(x, -1, y0 - 1, '#ff4d6d'); P(x, 1, y0 - 1, '#ff4d6d');
        if (asa) { ret(x, -7, y0 - 4, 5, 2, escuro); ret(x, 2, y0 - 4, 5, 2, escuro); } else { ret(x, -7, y0, 5, 2, escuro); ret(x, 2, y0, 5, 2, escuro); }
        break;
      }
      case 'fantasma': {
        x.globalAlpha *= .8;
        const y0 = -12 + Math.round(Math.sin(t / 300 + m.id) * 2);
        disco(x, 0, y0 - 2, 5, cor); ret(x, -5, y0 - 2, 11, 7, cor);
        for (let i = -5; i < 6; i += 3) ret(x, i, y0 + 5 + ((i + Math.floor(t / 150)) % 2), 2, 1, cor);
        ret(x, -2, y0 - 3, 1, 2, '#1d1d2b'); ret(x, 2, y0 - 3, 1, 2, '#1d1d2b'); ret(x, -1, y0, 2, 2, '#1d1d2b');
        break;
      }
      case 'golem': {
        const p = Math.floor(t / 200) % 2;
        ret(x, -6, -6 + p, 4, 6 - p, escuro); ret(x, 2, -6 + (1 - p), 4, 6 - (1 - p), escuro);
        ret(x, -7, -16, 14, 10, '#6a6a7a'); ret(x, -7, -16, 14, 2, '#8a8a9a');
        ret(x, -4, -14, 3, 6, cor); ret(x, 2, -13, 2, 5, cor); ret(x, -1, -15, 2, 3, claro);
        ret(x, -10, -14, 3, 8, '#6a6a7a'); ret(x, 7, -14, 3, 8, '#6a6a7a');
        ret(x, -4, -22, 8, 6, '#7a7a8a'); ret(x, -2, -20, 1, 1, cor); ret(x, 1, -20, 1, 1, cor);
        break;
      }
      default: disco(x, 0, -6, 5, cor);
    }
    x.restore();
  }

  // ---------- animais da fazenda e pets ----------
  function animal(x, a, t) {
    const px = Math.round(a.x), py = Math.round(a.y), passo = a.andando ? Math.floor(t / 160) % 2 : 0;
    x.save(); x.translate(px, py); if (a.dir < 0) x.scale(-1, 1);
    switch (a.tipo) {
      case 'galinha':
        elipse(x, 0, -4, 4, 3, '#f4f0e8'); ret(x, 2, -9, 3, 4, '#f4f0e8'); ret(x, 5, -8, 2, 1, '#f0a020'); ret(x, 3, -10, 2, 1, '#e8354a');
        P(x, 4, -8, '#1d1d2b'); ret(x, -4, -6, 2, 2, '#e0dcd0'); ret(x, -1, -1, 1, 1 + passo, '#f0a020'); ret(x, 1, -1, 1, 2 - passo, '#f0a020');
        break;
      case 'vaca':
        ret(x, -8, -11, 14, 7, '#f4f0e8'); ret(x, -5, -11, 4, 3, '#2a2a30'); ret(x, 1, -8, 3, 3, '#2a2a30');
        ret(x, 5, -14, 5, 6, '#f4f0e8'); ret(x, 8, -10, 3, 3, '#f0b8b0'); P(x, 7, -12, '#1d1d2b'); ret(x, 5, -15, 1, 2, '#c9c2b0'); ret(x, 9, -15, 1, 2, '#c9c2b0');
        ret(x, -7, -4, 2, 4 - passo, '#f4f0e8'); ret(x, -3, -4, 2, 3 + passo, '#f4f0e8'); ret(x, 1, -4, 2, 4 - passo, '#f4f0e8'); ret(x, 4, -4, 2, 3 + passo, '#f4f0e8');
        ret(x, -2, -5, 3, 2, '#f0b8b0'); ret(x, -9, -10, 1, 5, '#2a2a30');
        break;
      case 'ovelha':
        disco(x, -1, -8, 6, '#f8f6f0'); disco(x, -4, -9, 4, '#ffffff'); disco(x, 2, -10, 4, '#ffffff');
        ret(x, 5, -11, 4, 5, '#3a3a40'); P(x, 7, -10, '#ffffff');
        ret(x, -5, -3, 2, 3 - passo, '#3a3a40'); ret(x, -1, -3, 2, 2 + passo, '#3a3a40'); ret(x, 2, -3, 2, 3 - passo, '#3a3a40');
        break;
      case 'cavalo':
        ret(x, -8, -13, 14, 7, '#8a5a32'); ret(x, -8, -13, 14, 2, '#a8703f');
        ret(x, 5, -19, 4, 9, '#8a5a32'); ret(x, 7, -19, 5, 4, '#8a5a32'); P(x, 9, -18, '#1d1d2b'); ret(x, 4, -19, 2, 8, '#3a2416');
        ret(x, -10, -12, 2, 6, '#3a2416');
        ret(x, -7, -6, 2, 6 - passo, '#6b4226'); ret(x, -3, -6, 2, 5 + passo, '#6b4226'); ret(x, 1, -6, 2, 6 - passo, '#6b4226'); ret(x, 4, -6, 2, 5 + passo, '#6b4226');
        break;
      case 'gato':
        ret(x, -5, -6, 8, 4, '#e8964a'); ret(x, -4, -6, 2, 4, '#c87a3a'); ret(x, 0, -6, 2, 4, '#c87a3a');
        ret(x, 2, -10, 5, 5, '#e8964a'); P(x, 2, -11, '#e8964a'); P(x, 6, -11, '#e8964a'); P(x, 5, -8, '#3a8a3a');
        ret(x, -7, -9 - passo, 2, 4, '#e8964a'); ret(x, -4, -2, 1, 2, '#c87a3a'); ret(x, 1, -2, 1, 2, '#c87a3a');
        break;
      case 'lobo': mob(x, { tipo: 'lobo', x: 0, y: 0, dir: 1, id: a.id }, t); break;
    }
    if (a.triste) { ret(x, -1, -22, 2, 4, '#7cc7ff'); }
    x.restore();
  }

  // cabecinha do Doidobot flutuando no mundo
  function doidobot(x, cx, cy, t, humano) {
    cx = Math.round(cx); cy = Math.round(cy + Math.sin(t / 380) * 2);
    if (humano) {
      disco(x, cx, cy, 5, '#5a3420'); disco(x, cx, cy, 4, '#c0875a');
      for (const [dx, dy] of [[-3, -4], [0, -5], [3, -4], [-4, -2], [4, -2]]) disco(x, cx + dx, cy + dy, 1, '#17110d');
      P(x, cx - 2, cy, '#1d1d2b'); P(x, cx + 2, cy, '#1d1d2b');
      return;
    }
    ret(x, cx, cy - 9, 1, 3, '#5a5a6a'); ret(x, cx - 1, cy - 10, 3, 2, Math.floor(t / 600) % 2 ? '#ff4d6d' : '#b02a48');
    disco(x, cx, cy, 6, '#7a5600'); disco(x, cx, cy, 5, '#ffd23f'); ret(x, cx - 3, cy - 4, 2, 1, '#fff3a8');
    ret(x, cx + 6, cy - 1, 2, 3, '#a7adbd');
    ret(x, cx - 5, cy - 2, 4, 3, '#15151f'); ret(x, cx + 1, cy - 2, 4, 3, '#15151f'); ret(x, cx - 1, cy - 2, 2, 1, '#15151f');
    P(x, cx - 3, cy - 1, '#fffbe6'); P(x, cx + 3, cy - 1, '#fffbe6');
    ret(x, cx - 1, cy + 3, 3, 1, '#5a3a00');
  }

  Object.assign(AM.spr, { pessoa, mob, animal, doidobot });
})();
