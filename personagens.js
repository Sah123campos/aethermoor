// Personagens em pixel art: o jogador, a cabeça flutuante do Doidobot (e o
// raro "modo humano"), passarinhos, partículas e balõezinhos de ? e !.
'use strict';

// Expressões do Doidobot: valem para o retrato grande e para o sprite pequeno.
const EXPR = {
  normal:     { olhos: 'normal', boca: 'sorriso', extras: [], anim: 'flutua' },
  tonto:      { olhos: 'espiral', boca: 'onda', extras: ['estrelinhas'], anim: 'balanca' },
  susto:      { olhos: 'arregalado', boca: 'o', extras: ['suor'], anim: 'pula' },
  apaixonado: { olhos: 'coracao', boca: 'aberta', extras: ['blush', 'mao-oi', 'coracoes'], anim: 'treme' },
  confuso:    { olhos: 'confuso', boca: 'torta', extras: ['suor'], anim: 'inclina' },
  feliz:      { olhos: 'feliz', boca: 'aberta', extras: ['blush'], anim: 'flutua' },
  gargalhada: { olhos: 'apertado', boca: 'risada', extras: ['blush'], anim: 'treme' },
  chorando:   { olhos: 'choro', boca: 'onda', extras: ['blush', 'lagrimas'], anim: 'soluco' },
  nerd:       { olhos: 'nerd', boca: 'dentinhos', extras: ['oculos-grau', 'sardas', 'dedo'], anim: 'flutua' },
  animado:    { olhos: 'brilho', boca: 'aberta', extras: ['brilhos'], anim: 'pula' },
  serio:      { olhos: 'determinado', boca: 'reta', extras: ['reflexo'], anim: 'flutua' },
  piscadinha: { olhos: 'piscada', boca: 'sorriso', extras: ['blush'], anim: 'flutua' },
  saudade:    { olhos: 'feliz', boca: 'sorriso', extras: [], anim: 'flutua' },
  humano:     { humano: true, anim: 'flutua' },
};

// ---------- jogador ----------
const Jogador = (() => {
  const C = {
    cabelo: '#3b2416', pele: '#e0ac7e', peleS: '#c48b5c', tunica: '#3f6fb5', tunicaS: '#2d528a',
    cinto: '#6b4226', fivela: '#e0c060', calca: '#3c3f58', bota: '#4a2f1f', lenco: '#d94848', lencoS: '#a83232', olho: '#1d1d2b',
  };

  function cabeca(c, x, topo, ox, fechados) {
    ret(c, x - 4, topo + 1, 8, 7, C.pele); ret(c, x - 4, topo + 7, 8, 1, C.peleS);
    ret(c, x - 4, topo, 8, 2, C.cabelo); ret(c, x - 5, topo + 1, 1, 4, C.cabelo); ret(c, x + 4, topo + 1, 1, 4, C.cabelo);
    ret(c, x - 4, topo + 2, 2, 1, C.cabelo); ret(c, x + 1, topo + 2, 3, 1, C.cabelo); ret(c, x - 2, topo - 1, 3, 1, C.cabelo);
    if (fechados) { ret(c, x - 3 + ox, topo + 5, 2, 1, C.olho); ret(c, x + 1 + ox, topo + 5, 2, 1, C.olho); }
    else { ret(c, x - 2 + ox, topo + 4, 1, 2, C.olho); ret(c, x + 1 + ox, topo + 4, 1, 2, C.olho); }
  }

  function emPe(c, x, y, dir, fechados, passo, andando) {
    const ox = dir > 0 ? 1 : dir < 0 ? -1 : 0;
    const a = andando ? passo % 2 : -1;
    const b = andando && a === 1 ? -1 : 0;
    ret(c, x - 3, y - 5 - (a === 0 ? 1 : 0), 2, 4, C.calca); ret(c, x + 1, y - 5 - (a === 1 ? 1 : 0), 2, 4, C.calca);
    ret(c, x - 3 + Math.min(ox, 0), y - 1 - (a === 0 ? 1 : 0), 3, 1, C.bota); ret(c, x + 1 + Math.min(ox, 0), y - 1 - (a === 1 ? 1 : 0), 3, 1, C.bota);
    ret(c, x - 4, y - 12 + b, 8, 7, C.tunica); ret(c, x + 1, y - 12 + b, 3, 7, C.tunicaS);
    ret(c, x - 4, y - 7 + b, 8, 1, C.cinto); ret(c, x - 1, y - 7 + b, 2, 1, C.fivela);
    const braco = andando ? (a === 0 ? 1 : -1) : 0;
    ret(c, x - 5, y - 12 + b + braco, 1, 5, C.tunicaS); ret(c, x - 5, y - 7 + b + braco, 1, 1, C.pele);
    ret(c, x + 4, y - 12 + b - braco, 1, 5, C.tunicaS); ret(c, x + 4, y - 7 + b - braco, 1, 1, C.pele);
    ret(c, x - 4, y - 13 + b, 8, 2, C.lenco);
    ret(c, x + (ox >= 0 ? -6 : 5), y - 12 + b, 1, 3 + (andando ? a : 0), C.lencoS);
    cabeca(c, x, y - 21 + b, ox, fechados);
  }

  function sentado(c, x, y, fechados) {
    ret(c, x - 1, y - 3, 9, 3, C.calca); ret(c, x + 8, y - 5, 2, 5, C.bota);
    ret(c, x - 4, y - 10, 8, 7, C.tunica); ret(c, x + 1, y - 10, 3, 7, C.tunicaS);
    ret(c, x - 4, y - 4, 8, 1, C.cinto);
    ret(c, x - 6, y - 8, 2, 1, C.tunicaS); ret(c, x - 6, y - 7, 1, 5, C.tunicaS); ret(c, x - 6, y - 2, 1, 1, C.pele);
    ret(c, x - 4, y - 11, 8, 2, C.lenco); ret(c, x - 6, y - 10, 1, 3, C.lencoS);
    cabeca(c, x, y - 19, 1, fechados);
  }

  function desenhar(c, j, cena) {
    const x = Math.round(j.x - cena.camX), y = Math.round(j.y + cena.camY - j.pulo);
    if (x < -30 || x > W + 30) return;
    elipse(c, x, Math.round(CHAO + cena.camY), j.pose === 'deitado' ? 11 : 5, 1, 'rgba(20,30,20,.35)');
    if (j.pose === 'deitado') {
      // deitado de lado, de frente para a câmera: o sprite em pé girado 90°
      c.setTransform(0, -1, 1, 0, x + 10, y - 5);
      emPe(c, 0, 0, 0, j.fechados, 0, false);
      c.setTransform(1, 0, 0, 1, 0, 0);
    } else if (j.pose === 'sentado') sentado(c, x, y, j.fechados);
    else emPe(c, x, y, j.dir, j.fechados, j.passo, j.pose === 'andando');
  }

  return { desenhar };
})();

// ---------- Doidobot: cabeça flutuante ----------
const Doidobot = (() => {
  const tela = document.createElement('canvas');
  tela.width = tela.height = 40;
  const c = tela.getContext('2d');
  const B = '#fffbe6', L = '#15151f', M = '#5a3a00';
  const OLHOS = {
    normal: (x, y, pisca) => pisca ? ret(c, x - 1, y + 1, 3, 1, B) : ret(c, x, y, 2, 2, B),
    arregalado: (x, y) => { ret(c, x - 1, y - 1, 3, 3, B); ret(c, x, y, 1, 1, L); },
    coracao: (x, y) => { ret(c, x - 1, y - 1, 1, 1, '#ff4d8d'); ret(c, x + 1, y - 1, 1, 1, '#ff4d8d'); ret(c, x - 1, y, 3, 1, '#ff4d8d'); ret(c, x, y + 1, 1, 1, '#ff4d8d'); },
    espiral: (x, y, _, t) => { ret(c, x - 1, y - 1, 3, 1, B); ret(c, x + 1, y, 1, 2, B); ret(c, x - 1, y + 1, 2, 1, B); if (Math.floor(t / 150) % 2) ret(c, x, y, 1, 1, B); },
    feliz: (x, y) => { ret(c, x - 1, y + 1, 1, 1, B); ret(c, x, y, 1, 1, B); ret(c, x + 1, y + 1, 1, 1, B); },
    choro: (x, y) => { ret(c, x - 1, y, 3, 1, B); ret(c, x, y + 1, 1, 1, '#7cc7ff'); },
    apertado: (x, y, _, __, lado) => { ret(c, x + (lado < 0 ? -1 : 1), y - 1, 1, 1, B); ret(c, x, y, 1, 1, B); ret(c, x + (lado < 0 ? -1 : 1), y + 1, 1, 1, B); },
    brilho: (x, y) => { ret(c, x, y - 1, 1, 3, '#fff3a0'); ret(c, x - 1, y, 3, 1, '#fff3a0'); },
    determinado: (x, y, _, __, lado) => { ret(c, x - 1, y, 3, 2, B); ret(c, x + (lado < 0 ? -1 : 1), y, 1, 1, L); },
    piscada: (x, y, _, __, lado) => lado < 0 ? ret(c, x, y, 2, 2, B) : ret(c, x - 1, y + 1, 3, 1, B),
    confuso: (x, y, _, __, lado) => lado < 0 ? ret(c, x - 1, y - 1, 3, 3, B) : ret(c, x, y + 1, 1, 1, B),
  };
  const BOCAS = {
    sorriso: (x, y) => { ret(c, x - 2, y, 1, 1, M); ret(c, x - 1, y + 1, 3, 1, M); ret(c, x + 2, y, 1, 1, M); },
    aberta: (x, y) => { ret(c, x - 2, y, 5, 2, M); ret(c, x - 1, y + 2, 3, 1, M); ret(c, x - 1, y + 1, 3, 1, '#e86a8a'); },
    o: (x, y) => ret(c, x - 1, y, 2, 2, M),
    onda: (x, y, t) => { const s = Math.floor(t / 90) % 2; for (let i = -2; i <= 2; i++) ret(c, x + i, y + ((i + s) % 2 ? 1 : 0), 1, 1, M); },
    reta: (x, y) => ret(c, x - 2, y + 1, 4, 1, M),
    risada: (x, y) => { ret(c, x - 3, y - 1, 7, 3, M); ret(c, x - 2, y - 1, 5, 1, '#fff'); ret(c, x - 1, y + 2, 3, 1, M); },
    dentinhos: (x, y) => { BOCAS.sorriso(x, y); ret(c, x - 1, y + 2, 1, 1, '#fff'); ret(c, x + 1, y + 2, 1, 1, '#fff'); },
    torta: (x, y) => { ret(c, x - 2, y + 1, 2, 1, M); ret(c, x, y, 3, 1, M); },
  };

  function robo(e, t) {
    const x = 20, y = 21, ex = EXPR[e] || EXPR.normal;
    ret(c, x, y - 11, 1, 3, '#5a5a6a');
    ret(c, x - 1, y - 13, 3, 2, Math.floor(t / 600) % 2 ? '#ff4d6d' : '#b02a48');
    ret(c, x - 9, y - 1, 2, 4, '#c99a10');                       // orelha esquerda
    ret(c, x + 8, y - 2, 2, 5, '#a7adbd'); ret(c, x + 9, y, 1, 1, '#5d6270'); // o ferro no ouvido
    disco(c, x, y, 8, '#7a5600');
    disco(c, x, y, 7, '#e0aa1e');
    disco(c, x - 1, y - 1, 6, '#ffd23f');
    ret(c, x - 4, y - 5, 2, 1, '#fff3a8'); ret(c, x - 5, y - 4, 1, 2, '#fff3a8');
    if (ex.extras.includes('blush')) { ret(c, x - 6, y + 2, 2, 1, '#ff8fa8'); ret(c, x + 4, y + 2, 2, 1, '#ff8fa8'); }
    if (ex.olhos === 'nerd') {
      for (const ox of [-6, 1]) { ret(c, x + ox, y - 4, 5, 1, '#4a2c14'); ret(c, x + ox, y, 5, 1, '#4a2c14'); ret(c, x + ox, y - 3, 1, 3, '#4a2c14'); ret(c, x + ox + 4, y - 3, 1, 3, '#4a2c14'); ret(c, x + ox + 2, y - 2, 1, 1, L); }
      ret(c, x - 1, y - 3, 2, 1, '#4a2c14');
      for (const [dx, dy] of [[-5, 3], [-4, 2], [4, 3], [5, 2]]) ret(c, x + dx, y + dy, 1, 1, '#b5651d');
      ret(c, x + 11, y + 1, 3, 3, '#ffd23f'); ret(c, x + 12, y - 3, 1, 4, '#ffd23f'); // dedinho levantado
    } else {
      ret(c, x - 6, y - 3, 5, 4, L); ret(c, x + 1, y - 3, 5, 4, L); ret(c, x - 1, y - 2, 2, 1, L);
      ret(c, x - 7, y - 3, 1, 1, L); ret(c, x + 6, y - 3, 1, 1, L);
      const pisca = Math.floor(t / 100) % 38 === 0;
      const desenha = OLHOS[ex.olhos] || OLHOS.normal;
      desenha(x - 4, y - 2, pisca, t, -1);
      desenha(x + 3, y - 2, pisca, t, 1);
    }
    (BOCAS[ex.boca] || BOCAS.sorriso)(x, y + 3, t);
  }

  // "modo humano": cabelo cacheado, pele morena e gola de jaqueta de couro
  function humano() {
    const x = 20, y = 21;
    ret(c, x - 6, y + 8, 12, 2, '#141414'); ret(c, x - 6, y + 8, 2, 1, '#3a3a3a');
    ret(c, x - 2, y + 7, 4, 2, '#b07a4f');
    disco(c, x, y, 7, '#5a3420');
    disco(c, x, y, 6, '#c0875a');
    ret(c, x - 8, y - 1, 2, 3, '#b07a4f'); ret(c, x + 7, y - 1, 2, 3, '#b07a4f');
    for (const [dx, dy] of [[-5, -6], [-2, -8], [1, -8], [4, -7], [6, -5], [-6, -3], [6, -3], [-3, -6], [2, -6]]) disco(c, x + dx, y + dy, 2, '#17110d');
    for (const [dx, dy] of [[-2, -9], [3, -8], [-5, -7]]) ret(c, x + dx, y + dy, 1, 1, '#3a2a20');
    ret(c, x - 4, y - 1, 3, 1, '#17110d'); ret(c, x + 1, y - 1, 3, 1, '#17110d');
    ret(c, x - 3, y + 1, 2, 1, '#fff'); ret(c, x + 1, y + 1, 2, 1, '#fff');
    ret(c, x - 2, y + 1, 1, 1, '#2a1a10'); ret(c, x + 2, y + 1, 1, 1, '#2a1a10');
    ret(c, x - 1, y + 4, 3, 1, '#6b2f22'); ret(c, x + 2, y + 3, 1, 1, '#6b2f22');
  }

  function desenhar(f, bot, cena, t) {
    if (!bot.visivel) return;
    c.clearRect(0, 0, 40, 40);
    if (bot.humano) humano(); else robo(bot.expr, t);
    const bob = Math.sin(t / 380) * bot.flutua;
    const x = Math.round(bot.x - cena.camX), y = Math.round(bot.y + cena.camY + bob);
    // sombra no chão, menor quanto mais alto
    const alt = CHAO - bot.y;
    if (alt < 60) { f.globalAlpha = limitar(1 - alt / 60, 0, 1) * .35; elipse(f, x, Math.round(CHAO + cena.camY), 6, 1, '#142014'); f.globalAlpha = 1; }
    f.save();
    f.translate(x, y);
    if (bot.rot) f.rotate(bot.rot);
    if (bot.esc !== 1) f.scale(bot.esc, bot.esc);
    if (bot.glitch) f.translate(Math.round(Math.random() * 4 - 2), 0);
    f.drawImage(tela, -20, -21);
    f.restore();
    // estrelinhas girando quando está tonto
    if (!bot.humano && bot.expr === 'tonto') {
      for (let i = 0; i < 3; i++) {
        const a = t / 260 + i * 2.1;
        glifo(f, 'brilho', x + Math.cos(a) * 10 - 1, y - 12 + Math.sin(a) * 3, '#fff3a0');
      }
    }
  }

  return { desenhar };
})();

// ---------- passarinhos ----------
const Passaros = (() => {
  const bando = [];
  function revoada(cena) {
    for (let i = 0; i < 5; i++) bando.push({ x: -10 - i * 9 + cena.camX, y: 40 - cena.camY * .6 + (i % 2) * 5 + i * 2, v: 26 + i * 2, f: i });
  }
  function atualizar(dt) {
    for (const p of bando) p.x += p.v * dt / 1000;
    while (bando.length && bando[0].x > 600) bando.shift();
  }
  function desenhar(f, cena, t) {
    for (const p of bando) {
      const x = Math.round(p.x - cena.camX), y = Math.round(p.y + cena.camY * .6), cima = Math.floor(t / 160 + p.f) % 2;
      if (cima) { ret(f, x - 1, y - 1, 1, 1, '#2b2b3a'); ret(f, x + 1, y - 1, 1, 1, '#2b2b3a'); ret(f, x, y, 1, 1, '#2b2b3a'); }
      else { ret(f, x - 1, y, 3, 1, '#2b2b3a'); ret(f, x, y + 1, 1, 1, '#2b2b3a'); }
    }
  }
  // o passarinho que pousa perto do jogador
  function pousado(f, p, cena, t) {
    if (!p.visivel) return;
    const x = Math.round(p.x - cena.camX), y = Math.round(p.y + cena.camY);
    if (p.voando) {
      const cima = Math.floor(t / 90) % 2;
      ret(f, x - 1, y - 1, 3, 2, '#8a5a32');
      ret(f, x - 3, y - (cima ? 3 : 0), 2, 1, '#6b4226'); ret(f, x + 2, y - (cima ? 3 : 0), 2, 1, '#6b4226');
      return;
    }
    const pulo = p.pulando ? Math.round(Math.abs(Math.sin(t / 90)) * 2) : 0;
    ret(f, x - 2, y - 4 - pulo, 4, 3, '#8a5a32'); ret(f, x - 1, y - 3 - pulo, 2, 2, '#f2d0a0');
    ret(f, x + (p.dir > 0 ? 1 : -2), y - 5 - pulo, 2, 2, '#8a5a32');
    ret(f, x + (p.dir > 0 ? 1 : -1), y - 5 - pulo, 1, 1, '#111');
    ret(f, x + (p.dir > 0 ? 3 : -3), y - 4 - pulo, 1, 1, '#f0a020');
    ret(f, x - (p.dir > 0 ? 3 : -2), y - 4 - pulo, 1, 2, '#6b4226');
    ret(f, x - 1, y - 1, 1, 1, '#f0a020'); ret(f, x + 1, y - 1, 1, 1, '#f0a020');
  }
  return { revoada, atualizar, desenhar, pousado, limpar: () => { bando.length = 0; } };
})();

// ---------- partículas ----------
const Particulas = (() => {
  let lista = [];
  function soltar(p) {
    lista.push(Object.assign({ vx: 0, vy: 0, g: 0, vida: 1000, idade: 0, tam: 1, cor: '#fff', tipo: 'px', atrito: 1 }, p));
  }
  function atualizar(dt) {
    const s = dt / 1000;
    for (const p of lista) {
      p.idade += dt; p.vy += p.g * s; p.vx *= p.atrito; p.x += p.vx * s; p.y += p.vy * s;
      if (p.tipo === 'folha') p.x += Math.sin(p.idade / 200) * .3;
    }
    lista = lista.filter(p => p.idade < p.vida);
  }
  function desenhar(f, cena) {
    for (const p of lista) {
      const x = Math.round(p.x - cena.camX), y = Math.round(p.y + cena.camY), k = p.idade / p.vida;
      f.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
      if (p.tipo === 'px' || p.tipo === 'folha') ret(f, x, y, p.tam, p.tipo === 'folha' ? 1 : p.tam, p.cor);
      else if (p.tipo === 'lagrima') { ret(f, x, y, 1, 2, '#7cc7ff'); ret(f, x, y, 1, 1, '#d6f0ff'); }
      else glifo(f, p.tipo, x, y, p.cor);
    }
    f.globalAlpha = 1;
  }
  return { soltar, atualizar, desenhar, limpar: () => { lista = []; } };
})();

// ---------- balõezinhos (? ! ...) sobre a cabeça ----------
const Baloes = (() => {
  let lista = [];
  function mostrar(alvo, simbolo, ms = 1200, altura = 30) { lista.push({ alvo, simbolo, resta: ms, altura, idade: 0 }); }
  function atualizar(dt) { for (const b of lista) { b.resta -= dt; b.idade += dt; } lista = lista.filter(b => b.resta > 0); }
  function desenhar(f, cena) {
    for (const b of lista) {
      const larg = b.simbolo === '...' ? 9 : 7;
      const pop = b.idade < 120 ? -2 : 0;
      const x = Math.round(b.alvo.x - cena.camX - larg / 2), y = Math.round(b.alvo.y + cena.camY - b.altura + pop);
      ret(f, x - 1, y - 1, larg + 2, 9, '#3b2414'); ret(f, x, y, larg, 7, '#fffaf0');
      ret(f, x + 2, y + 7, 3, 1, '#3b2414'); ret(f, x + 3, y + 7, 1, 1, '#fffaf0'); ret(f, x + 3, y + 8, 1, 1, '#3b2414');
      const cor = b.simbolo === '!' ? '#d43a2f' : '#3b2414';
      if (b.simbolo === '...') glifo(f, '...', x + 2, y + 3, cor);
      else if (b.simbolo === 'coracao') glifo(f, 'coracao', x + 1, y + 1, '#ff4d8d');
      else glifo(f, b.simbolo, x + (b.simbolo === '!' ? 3 : 2), y + 1, cor);
    }
  }
  return { mostrar, atualizar, desenhar, limpar: () => { lista = []; } };
})();
