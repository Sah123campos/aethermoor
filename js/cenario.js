// Cenário de Aethermoor em camadas com paralaxe: céu, astros, nuvens, balão,
// serras, Guilda, floresta e, na frente, a campina com a árvore e a moita.
// Câmera: camY > 0 olha para cima; camX > 0 anda para a direita.
'use strict';

const Cenario = (() => {
  const r = sorteador(20261020);
  const ARVORE_X = 56, MOITA_X = 212, GUILDA_X = 268;

  const estrelas = Array.from({ length: 95 }, () => ({ x: r() * 340, y: r() * 175 - 45, f: r() * 6, grande: r() < .12 }));
  const nuvens = Array.from({ length: 6 }, (_, i) => ({ x: i * 72 + r() * 40, y: 18 + r() * 52, s: 4 + (r() * 4 | 0), v: 1.2 + r() * 2 }));

  // ruído suave: valores sorteados a cada "passo" colunas, interpolados
  function ruido(s, passo) {
    const v = Array.from({ length: Math.ceil(600 / passo) + 2 }, () => s());
    return x => { const i = Math.floor(x / passo), k = suave((x % passo) / passo); return lerp(v[i], v[i + 1], k); };
  }
  function serra(semente, alt, f1, f2) {
    const s = sorteador(semente), p1 = s() * 6, p2 = s() * 6, grande = ruido(s, 23), miudo = ruido(s, 6);
    return Array.from({ length: 560 }, (_, x) => Math.round(alt * (
      .5 * (1 - Math.abs(Math.sin(x * f1 + p1))) +
      .25 * (1 - Math.abs(Math.sin(x * f2 + p2))) +
      .19 * grande(x) + .06 * miudo(x))));
  }
  const serraLonge = serra(11, 54, .011, .029);
  const serraPerto = serra(23, 34, .017, .043);
  const morro = x => 7 + 4 * Math.sin(x * .021 + 1) + 3 * Math.sin(x * .057);

  const arvores = [];
  for (let x = 0; x < 560; x += 4 + (r() * 6 | 0))
    if (Math.abs(x - GUILDA_X) > 16) arvores.push({ x, pinheiro: r() < .55, h: 8 + (r() * 9 | 0) });

  // detalhes da campina (coordenadas do mundo; wy é a distância abaixo do chão)
  const tufos = Array.from({ length: 70 }, () => ({ x: r() * 470, y: 2 + r() * 28 }));
  const CORES_FLOR = ['#ff8fb8', '#f4f4ff', '#ffd84d', '#c9a0ff'];
  const flores = Array.from({ length: 46 }, () => ({ x: r() * 470, y: 3 + r() * 26, cor: CORES_FLOR[r() * 4 | 0] }));
  const pedras = [{ x: 150, y: 3, r: 3 }, { x: 288, y: 18, r: 2 }, { x: 176, y: 22, r: 2 }];
  const vagalumes = Array.from({ length: 9 }, (_, i) => ({ x: 20 + r() * 140, y: -10 - r() * 40, f: i }));

  // ---------- fundo ----------
  const corCeu = [];
  function ceu(g, dia, camY) {
    const topo = pelaHora(['#060a20', '#252c66', '#4b86d4'], dia);
    const meio = pelaHora(['#0f1538', '#7a4d8c', '#88bdf0'], dia);
    const baixo = pelaHora(['#1a2050', '#f0916a', '#ffe2ae'], dia);
    const horizonte = 106 + camY * .3;
    for (let y = 0; y < H; y += 2) {
      const k = Math.floor(limitar((horizonte - y) / 140, 0, 1) * 12) / 12;
      const c = k < .3 ? misturar(baixo, meio, k / .3) : misturar(meio, topo, (k - .3) / .7);
      corCeu[y] = corCeu[y + 1] = css(c);
      ret(g, 0, y, W, 2, corCeu[y]);
    }
  }

  function astros(g, cena, t) {
    const { dia, camX, camY } = cena;
    const noite = limitar(1 - dia * 1.8, 0, 1);
    if (noite > 0) {
      for (const e of estrelas) {
        const x = e.x - camX * .03, y = e.y + camY * .12;
        if (y < 0 || y >= H) continue;
        const brilho = Math.sin(t / 380 + e.f * 7) > .55 ? 1 : .55;
        g.globalAlpha = noite * brilho;
        ret(g, x, y, 1, 1, '#fff7d6');
        if (e.grande) { ret(g, x - 1, y, 3, 1, '#fff7d6'); ret(g, x, y - 1, 1, 3, '#fff7d6'); }
      }
      // lua crescente
      const lx = 58 - camX * .02, ly = Math.round(22 + camY * .12);
      g.globalAlpha = limitar(1 - dia * 1.5, 0, 1);
      disco(g, lx, ly, 6, '#f3eccd');
      if (ly - 2 >= 0 && ly - 2 < H) disco(g, lx + 3, ly - 2, 6, corCeu[ly - 2] || '#0f1538');
      g.globalAlpha = 1;
    }
    // sol nascendo atrás das serras
    const sx = 248 - camX * .06;
    const sy = lerp(128, 38, sai(limitar((dia - .2) / .8, 0, 1))) + camY * .28;
    g.globalAlpha = .07; disco(g, sx, sy, 28, '#ffcf7a');
    g.globalAlpha = .13; disco(g, sx, sy, 19, '#ffcf7a');
    g.globalAlpha = .25; disco(g, sx, sy, 13, '#ffd98f');
    g.globalAlpha = 1; disco(g, sx, sy, 8, '#fff3c4');
  }

  function nuvensEBalao(g, cena, t) {
    const { dia, camX, camY } = cena;
    const luz = css(pelaHora(['#2a3166', '#ffb49b', '#ffffff'], dia));
    const sombra = css(pelaHora(['#1b2150', '#b9738f', '#d3e3f3'], dia));
    for (const n of nuvens) {
      const x = ((n.x + t * n.v / 1000) % 430) - 55 - camX * .08, y = n.y + camY * .2;
      if (y < -20 || y > H + 10) continue;
      const bolhas = [[0, 0, n.s], [n.s * .9, 1, n.s * .8 | 0], [-n.s * .9, 2, n.s * .7 | 0], [n.s * .4, -n.s * .5, n.s * .75 | 0]];
      for (const [dx, dy, rr] of bolhas) disco(g, x + dx, y + dy + 1, rr, sombra);
      for (const [dx, dy, rr] of bolhas) disco(g, x + dx, y + dy, rr, luz);
    }
    // balão ao longe (uma piscadela para o Balão Mágico)
    const bx = Math.round(((30 + t / 1000 * 2.2) % 380) - 30 - camX * .1);
    const by = Math.round(54 + Math.sin(t / 900) * 2 + camY * .2);
    const escurece = (1 - dia) * .65, ceuTopo = pelaHora(['#060a20', '#252c66', '#4b86d4'], dia);
    const tinge = h => css(misturar(rgb(h), ceuTopo, escurece));
    for (let dy = -5; dy <= 5; dy++) {
      const w = Math.round(Math.sqrt(30 - dy * dy));
      for (let dx = -w; dx <= w; dx++) ret(g, bx + dx, by + dy, 1, 1, tinge(Math.floor((dx + 6) / 2) % 2 ? '#e2484f' : '#ffd23f'));
    }
    ret(g, bx - 2, by + 6, 1, 2, tinge('#7a4a24')); ret(g, bx + 2, by + 6, 1, 2, tinge('#7a4a24'));
    ret(g, bx - 2, by + 8, 5, 2, tinge('#7a4a24'));
  }

  function serras(g, cena) {
    const { dia, camX, camY } = cena;
    const camadas = [
      { h: serraLonge, base: 112 + camY * .32, dx: camX * .12, cor: ['#1a1f48', '#6d5288', '#8ea9d2'], borda: ['#262b5a', '#f2a98a', '#b9cfeb'], neve: ['#3a3f70', '#e6c4cf', '#f4f8ff'] },
      { h: serraPerto, base: 124 + camY * .42, dx: camX * .22, cor: ['#141836', '#4d3a66', '#6b8fb8'], borda: ['#1d2246', '#c98b84', '#8db0d4'] },
    ];
    for (const c of camadas) {
      const cor = css(pelaHora(c.cor, dia)), borda = css(pelaHora(c.borda, dia)), neve = c.neve && css(pelaHora(c.neve, dia));
      if (c.base - 60 > H) continue;
      for (let x = 0; x < W; x++) {
        const alt = c.h[Math.round(x + c.dx) % 560], topo = Math.round(c.base - alt);
        ret(g, x, topo, 1, H - topo, cor);
        ret(g, x, topo, 1, 1, borda);
        if (neve && alt > 40) ret(g, x, topo, 1, Math.min(4, alt - 39), neve);
      }
    }
  }

  function guilda(g, x, y, dia, t, destaque) {
    const parede = css(pelaHora(['#262842', '#857288', '#cfc3ae'], dia));
    const sombra = css(pelaHora(['#1c1d33', '#5f5068', '#a39886'], dia));
    const telhado = css(pelaHora(['#241b3f', '#5d3b80', '#7a3fa0'], dia));
    ret(g, x - 11, y - 11, 22, 11, parede); ret(g, x + 5, y - 11, 6, 11, sombra);
    for (let i = 0; i < 6; i++) ret(g, x - 12 + i, y - 12 - i, 24 - 2 * i, 1, telhado);
    ret(g, x - 3, y - 31, 7, 20, parede); ret(g, x + 2, y - 31, 2, 20, sombra);
    for (let i = 0; i < 9; i++) { const w = i >> 1; ret(g, x - 4 + w, y - 31 - i, 9 - 2 * w, 1, telhado); }
    const onda = Math.floor(t / 260) % 2;
    ret(g, x, y - 46, 1, 7, '#3b2a20');
    ret(g, x + 1, y - 46, 3, 2, '#ffd23f'); ret(g, x + 4, y - 46 + onda, 2, 2, '#ffd23f');
    const luz = css(misturar(rgb('#ffd36b'), rgb('#3a3550'), suave(limitar((dia - .6) / .4, 0, 1))));
    ret(g, x, y - 26, 1, 3, luz); ret(g, x, y - 19, 1, 3, luz); ret(g, x - 8, y - 8, 2, 2, luz); ret(g, x + 7, y - 8, 2, 2, luz);
    ret(g, x - 1, y - 5, 3, 5, '#2b1d14');
    if (destaque > 0) {
      const pulo = Math.round(Math.abs(Math.sin(t / 220)) * -4);
      g.globalAlpha = destaque;
      glifo(g, 'seta', x - 1, y - 57 + pulo, '#3b2414');
      glifo(g, 'seta', x - 2, y - 58 + pulo, '#ffd23f');
      g.globalAlpha = 1;
    }
  }

  function floresta(g, cena, t) {
    const { dia, camX, camY } = cena;
    const base = 136 + camY * .58, dx = camX * .35;
    if (base - 60 > H) return;
    const cor = css(pelaHora(['#0d1622', '#2b3f3c', '#3d6e4a'], dia));
    const copa = css(pelaHora(['#0a111b', '#22332f', '#2f5a3c'], dia));
    const luz = css(pelaHora(['#13202c', '#3d5243', '#4f8a55'], dia));
    for (let x = 0; x < W; x++) {
      const topo = Math.round(base - morro(x + dx));
      ret(g, x, topo, 1, H - topo, cor);
    }
    const gx = GUILDA_X - dx;
    guilda(g, Math.round(gx), Math.round(base - morro(GUILDA_X)), dia, t, cena.destaqueGuilda);
    for (const a of arvores) {
      const x = Math.round(a.x - dx);
      if (x < -8 || x > W + 8) continue;
      const chao = Math.round(base - morro(a.x)) + 2, topo = chao - a.h;
      if (a.pinheiro) {
        for (let i = 0; i < a.h; i++) { const w = 1 + Math.floor(i * .42); ret(g, x - w, topo + i, 2 * w + 1, 1, copa); }
        ret(g, x + 1, topo + 2, 1, a.h - 4, luz);
      } else {
        const rr = Math.round(a.h / 2.4);
        disco(g, x, chao - rr - 1, rr, copa);
        ret(g, x + 1, chao - 2 * rr, 2, 1, luz);
      }
    }
  }

  function fundo(g, cena, t) {
    ceu(g, cena.dia, cena.camY);
    astros(g, cena, t);
    nuvensEBalao(g, cena, t);
    serras(g, cena);
    floresta(g, cena, t);
  }

  // ---------- frente (cores de dia; a noite vem do tom aplicado por cima) ----------
  const hash = n => { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff); };

  function chao(f, cena, t) {
    const { camX, camY } = cena, y0 = Math.round(CHAO + camY);
    if (y0 >= H + 40) return;
    ret(f, 0, y0, W, 6, '#5aa548'); ret(f, 0, y0 + 6, W, 10, '#4f9842'); ret(f, 0, y0 + 16, W, H, '#45893b');
    for (let x = 0; x < W; x++) {
      const h = hash(Math.round(x + camX));
      if (h % 5 === 0) ret(f, x, y0 - 1, 1, 1, '#5aa548');
      if (h % 13 === 0) ret(f, x, y0 - 2, 1, 2, '#6fb954');
      if (h % 7 === 0) ret(f, x, y0 + 8 + h % 20, 1, 1, '#3d7633');
    }
    // trilha para a Guilda
    for (let x = 0; x < W; x++) {
      const wx = x + camX;
      if (wx < 118) continue;
      const py = y0 + 11 + Math.round(Math.sin(wx * .035) * 2), larg = wx < 130 ? 2 + ((wx - 118) >> 2) : 5;
      ret(f, x, py + (5 - larg), 1, larg, '#c9a46a');
      ret(f, x, py + (5 - larg), 1, 1, '#e0c08a');
      ret(f, x, py + 5, 1, 1, '#9c7a4a');
    }
    for (const p of pedras) {
      const x = p.x - camX, y = y0 + p.y;
      elipse(f, x, y, p.r + 1, p.r, '#7d8290'); ret(f, x - 1, y - p.r + 1, 2, 1, '#b9bdc8');
    }
    for (const fl of flores) {
      const x = Math.round(fl.x - camX), y = y0 + Math.round(fl.y);
      if (x < -2 || x > W + 2) continue;
      ret(f, x, y, 1, 2, '#3d7633');
      ret(f, x - 1, y - 1, 3, 1, fl.cor); ret(f, x, y - 2, 1, 3, fl.cor); ret(f, x, y - 1, 1, 1, '#ffe066');
    }
    for (const tf of tufos) {
      const x = Math.round(tf.x - camX), y = y0 + Math.round(tf.y);
      if (x < -3 || x > W + 3) continue;
      const s = Math.round(Math.sin(t / 650 + tf.x * .3) * .8);
      ret(f, x, y - 2, 1, 3, '#3d7633'); ret(f, x + 1 + s, y - 4, 1, 4, '#6fb954'); ret(f, x + 2, y - 2, 1, 3, '#4f9842');
    }
    // placa e cerca a caminho da Guilda
    const px = Math.round(300 - camX);
    ret(f, px, y0 - 14, 2, 15, '#6b4226');
    ret(f, px - 6, y0 - 15, 15, 6, '#a8673a'); ret(f, px + 9, y0 - 14, 1, 4, '#a8673a'); ret(f, px + 10, y0 - 13, 1, 2, '#a8673a');
    ret(f, px - 4, y0 - 13, 9, 1, '#5a3418'); ret(f, px - 4, y0 - 11, 6, 1, '#5a3418');
    for (let wx = 340; wx <= 460; wx += 9) {
      const x = Math.round(wx - camX);
      ret(f, x, y0 - 9, 2, 10, '#8a5a32'); ret(f, x, y0 - 9, 2, 1, '#b98552');
      if (wx < 460) { ret(f, x + 2, y0 - 7, 7, 1, '#a8673a'); ret(f, x + 2, y0 - 4, 7, 1, '#a8673a'); }
    }
    // tronco da árvore grande
    const ax = Math.round(ARVORE_X - camX);
    ret(f, ax - 5, y0 - 46, 10, 47, '#6b4226'); ret(f, ax + 2, y0 - 46, 3, 47, '#4a2c18');
    ret(f, ax - 9, y0 - 2, 5, 3, '#6b4226'); ret(f, ax + 4, y0 - 2, 6, 3, '#4a2c18');
    ret(f, ax - 2, y0 - 30, 1, 6, '#4a2c18'); ret(f, ax - 3, y0 - 16, 1, 5, '#4a2c18');
    // vaga-lumes da madrugada
    const noite = limitar(1 - cena.dia * 1.6, 0, 1);
    if (noite > 0) {
      f.globalAlpha = noite;
      for (const v of vagalumes) {
        if (Math.sin(t / 300 + v.f * 3) < -.4) continue;
        const x = v.x - camX + Math.sin(t / 900 + v.f) * 6, y = y0 + v.y + Math.cos(t / 1100 + v.f * 2) * 4;
        ret(f, x, y, 1, 1, '#eaff8a');
      }
      f.globalAlpha = 1;
    }
  }

  function copa(f, cena, t) {
    const x = Math.round(ARVORE_X - cena.camX + Math.sin(t / 1500)), y = Math.round(CHAO + cena.camY - 64);
    const bolhas = [[-28, 10, 15], [27, 12, 15], [0, 2, 24], [-15, -12, 17], [16, -10, 18], [-34, 0, 11], [35, 0, 11], [0, 16, 18]];
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx, y + dy + 2, rr, '#2e6a35');
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx - 1, y + dy - 1, rr - 3, '#46923f');
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx + 3, y + dy - rr * .45, Math.max(2, rr * .35 | 0), '#7cc35a');
  }

  function moita(f, cena, t, sacudida) {
    const s = Math.round(Math.sin(t / 30) * sacudida);
    const x = Math.round(MOITA_X - cena.camX) + s, y = Math.round(CHAO + cena.camY);
    const bolhas = [[-8, -6, 7], [3, -9, 9], [12, -5, 7], [0, -3, 8]];
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx, y + dy + 1, rr, '#2f6b33');
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx - 1, y + dy - 1, rr - 2, '#3f8a3a');
    for (const [dx, dy, rr] of bolhas) disco(f, x + dx + 1, y + dy - rr * .5, Math.max(1, rr * .3 | 0), '#6cbf55');
    for (const [dx, dy] of [[-9, -8], [4, -13], [13, -6], [-2, -4], [8, -2]]) ret(f, x + dx, y + dy, 2, 2, '#e0455a');
  }

  // noite azulada e aurora alaranjada sobre a frente (personagens incluídos)
  function tonalizar(f, dia) {
    f.globalCompositeOperation = 'source-atop';
    const noite = limitar(1 - dia * 1.15, 0, 1);
    if (noite > 0) { f.fillStyle = css(rgb('#121a58'), noite * .62); f.fillRect(0, 0, W, H); }
    const aurora = Math.sin(limitar(dia, 0, 1) * Math.PI) * .14;
    if (aurora > .005) { f.fillStyle = css(rgb('#ff8a4a'), aurora); f.fillRect(0, 0, W, H); }
    f.globalCompositeOperation = 'source-over';
  }

  return { fundo, chao, copa, moita, tonalizar, ARVORE_X, MOITA_X, GUILDA_X };
})();
