// Motor: resolução em pixels, cores, tempo do roteiro (esperas e animações) e
// funções para desenhar pixel art.
'use strict';

const W = 320, H = 180;   // resolução interna, ampliada sem suavizar
const CHAO = 148;         // linha do chão quando a câmera está no chão

// números aleatórios repetíveis (o mesmo cenário sempre)
function sorteador(semente) {
  return function () {
    semente |= 0; semente = semente + 0x6D2B79F5 | 0;
    let t = Math.imul(semente ^ semente >>> 15, 1 | semente);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const suave = t => t * t * (3 - 2 * t);
const entraSai = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const sai = t => 1 - Math.pow(1 - t, 3);
const entra = t => t * t * t;
const linear = t => t;

// cores: '#rrggbb' -> [r, g, b]
const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const misturar = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
// cor ao longo do amanhecer: paradas para dia = 0 (noite), .5 (aurora) e 1 (manhã)
function pelaHora(paradas, dia) {
  const c = paradas.map(p => typeof p === 'string' ? rgb(p) : p);
  return dia < .5 ? misturar(c[0], c[1], dia / .5) : misturar(c[1], c[2], (dia - .5) / .5);
}

// ---------- tempo do roteiro ----------
// Tudo anda pelo relógio do jogo (pausa junto com o menu e respeita a velocidade).
// Pular ou recomeçar descarta o que está pendente: o roteiro antigo fica parado
// para sempre na promessa que nunca se cumpre.
let pendentes = [];

function esperar(ms) {
  return new Promise(res => pendentes.push({ resta: ms, res }));
}

function animar(obj, prop, para, ms, curva = entraSai) {
  for (const p of pendentes) if (p.obj === obj && p.prop === prop) p.feito = true;
  return new Promise(res => pendentes.push({ obj, prop, de: obj[prop], para, ms: Math.max(1, ms), t: 0, curva, res }));
}

function avancarTempo(dt) {
  const prontos = [];
  for (const p of pendentes) {
    if (p.feito) { prontos.push(p); continue; }
    if (p.obj) {
      p.t += dt;
      const k = Math.min(1, p.t / p.ms);
      p.obj[p.prop] = p.de + (p.para - p.de) * p.curva(k);
      if (k >= 1) prontos.push(p);
    } else if ((p.resta -= dt) <= 0) prontos.push(p);
  }
  if (prontos.length) {
    pendentes = pendentes.filter(p => !prontos.includes(p));
    prontos.forEach(p => p.res());
  }
}

function descartarPendentes() { pendentes = []; }

// ---------- pixel art ----------
function ret(c, x, y, w, h, cor) {
  c.fillStyle = cor;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}

function disco(c, cx, cy, r, cor) {
  c.fillStyle = cor;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.round(Math.sqrt(r * r - dy * dy + r * .6));
    c.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

function elipse(c, cx, cy, rx, ry, cor) {
  c.fillStyle = cor;
  cx = Math.round(cx); cy = Math.round(cy);
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.round(rx * Math.sqrt(1 - (dy * dy) / (ry * ry + .5)));
    c.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

// desenhos pequenos: cada string é uma linha, '#' é pixel pintado
const GLIFOS = {
  '?': ['###', '..#', '.##', '...', '.#.'],
  '!': ['#', '#', '#', '.', '#'],
  'Z': ['####', '..#.', '.#..', '####'],
  'nota': ['..##', '..#.', '..#.', '###.', '##..'],
  'coracao': ['##.##', '#####', '.###.', '..#..'],
  'brilho': ['.#.', '###', '.#.'],
  'seta': ['#####', '.###.', '..#..'],
  '...': ['#.#.#'],
};

function glifo(c, nome, x, y, cor, esc = 1) {
  const linhas = GLIFOS[nome];
  c.fillStyle = cor;
  for (let j = 0; j < linhas.length; j++)
    for (let i = 0; i < linhas[j].length; i++)
      if (linhas[j][i] === '#') c.fillRect(Math.round(x) + i * esc, Math.round(y) + j * esc, esc, esc);
}
