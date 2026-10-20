// Interface: tela (ampliação sem suavizar, zoom e tremor), laço do jogo,
// diálogo com efeito de máquina de escrever, opções (Modo Lerdo), recados e título.
'use strict';

const $ = s => document.querySelector(s);
const palco = $('#palco'), tela = $('#tela'), ctx = tela.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const g = buf.getContext('2d');
const frente = document.createElement('canvas'); frente.width = W; frente.height = H;
const f = frente.getContext('2d');

// ?demo: começa sozinho, sem som, falas avançam sozinhas · ?ate=S: adianta S segundos · ?pular: vai ao título
const params = new URLSearchParams(location.search);
const DEMO = params.has('demo');
const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- opções (lembradas neste navegador) ----------
const opcoes = { lerdo: false, auto: false, escala: 1 };
try { Object.assign(opcoes, JSON.parse(localStorage.getItem('aethermoor.opcoes') || '{}')); } catch (e) { /* sem armazenamento */ }
function salvarOpcoes() { try { localStorage.setItem('aethermoor.opcoes', JSON.stringify(opcoes)); } catch (e) { /* tudo bem */ } }

// ---------- estado ----------
let cena, jog, bot, passarinho, moitaSacode, t = 0, pausado = false, rodando = false, nomeJogador = 'Viajante';
const aCadaQuadro = new Set();

function estadoInicial() {
  cena = { dia: 0, camX: 0, camY: 260, zoom: 1, fx: W / 2, fy: H / 2, tremor: 0, escuro: 1, palpebra: 0, desfoque: 0,
    destaqueGuilda: 0, minutos: 330, relogio: false, passaros: false, zzz: false };
  jog = { x: 98, y: CHAO, pose: 'deitado', dir: 1, fechados: true, passo: 0, pulo: 0, andando: 0 };
  bot = { x: 262, y: 50, rot: 0, esc: 1, expr: 'normal', humano: false, visivel: false, atras: false, flutua: 0, glitch: false, estrela: 0, rastro: false };
  passarinho = { x: 150, y: 60, visivel: false, voando: true, pulando: false, dir: -1 };
  moitaSacode = { v: 0 };
  aCadaQuadro.clear();
  Particulas.limpar(); Baloes.limpar(); Passaros.limpar();
}
estadoInicial();

// ---------- efeitos de partícula ----------
const aleat = (a, b) => a + Math.random() * (b - a);
function poeira(x, y, n = 8) {
  for (let i = 0; i < n; i++) Particulas.soltar({ x: x + aleat(-8, 8), y, vx: aleat(-25, 25), vy: aleat(-25, -8), g: 50, vida: 550, cor: '#e6d6b0' });
}
function folhas(x, y, n = 14) {
  for (let i = 0; i < n; i++) Particulas.soltar({ tipo: 'folha', x: x + aleat(-10, 10), y: y + aleat(-8, 4), vx: aleat(-70, 70), vy: aleat(-80, -20), g: 90, atrito: .985, vida: 1400, tam: 2, cor: Math.random() < .5 ? '#46923f' : '#7cc35a' });
}
function brilhos(x, y, n = 8) {
  for (let i = 0; i < n; i++) Particulas.soltar({ tipo: 'brilho', x: x + aleat(-4, 4), y: y + aleat(-4, 4), vx: aleat(-50, 50), vy: aleat(-50, 30), atrito: .95, vida: 700, cor: Math.random() < .5 ? '#fff3a0' : '#ffd23f' });
}

// ---------- laço ----------
let acumZ = 0, acumPiar = 3000, acumFolha = 0, acumPasso = 0, acumEmocao = 0, ultimaHora = '';
const elHora = $('#hora');

function atualizar(dt) {
  t += dt;
  avancarTempo(dt);
  aCadaQuadro.forEach(fn => fn(dt));
  Particulas.atualizar(dt); Baloes.atualizar(dt); Passaros.atualizar(dt);
  atualizarDialogo(dt);

  if (cena.zzz && (acumZ += dt) > 1000) {
    acumZ = 0;
    Particulas.soltar({ tipo: 'Z', x: jog.x - 14, y: CHAO - 16, vx: 5, vy: -9, vida: 2200, cor: '#eeeaff' });
  }
  if (cena.passaros && (acumPiar -= dt) < 0) { acumPiar = aleat(2500, 6000); Som.efeito('piar'); }
  if ((acumFolha += dt) > 1700) {
    acumFolha = 0;
    Particulas.soltar({ tipo: 'folha', x: Cenario.ARVORE_X + aleat(-34, 34), y: CHAO - 58, vx: aleat(-6, 10), vy: 9, vida: 5200, tam: 2, cor: '#7cc35a' });
  }
  if (bot.rastro) Particulas.soltar({ x: bot.x + aleat(-3, 3), y: bot.y + aleat(-3, 3), vx: aleat(-15, 15), vy: aleat(-15, 15), vida: 520, cor: Math.random() < .5 ? '#fff3a0' : '#ffd23f' });
  if (bot.visivel && !bot.humano && (acumEmocao += dt) > 140) {
    acumEmocao = 0;
    if (bot.expr === 'chorando') for (const lado of [-1, 1]) Particulas.soltar({ tipo: 'lagrima', x: bot.x + lado * 5, y: bot.y, vx: lado * aleat(15, 35), vy: aleat(-35, -15), g: 140, vida: 750 });
    if (bot.expr === 'apaixonado' && Math.random() < .3) Particulas.soltar({ tipo: 'coracao', x: bot.x + aleat(-8, 4), y: bot.y - 12, vy: -14, vida: 1300, cor: '#ff4d8d' });
  }
  if (jog.andando) {
    jog.x += jog.andando * dt / 1000;
    if ((acumPasso += dt) > 170) { acumPasso = 0; jog.passo++; if (jog.passo % 2) Som.efeito('passo'); }
  }
  if (cena.relogio) {
    cena.minutos += dt / 1000;
    const m = Math.floor(cena.minutos), hora = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    if (hora !== ultimaHora) elHora.textContent = ultimaHora = hora;
  }
}

let recorte = { sx: 0, sy: 0, sw: W, sh: H }, ultimoFiltro = '';
const elPreto = $('#preto'), elOlhos = $('#olhos');

function desenhar() {
  Cenario.fundo(g, cena, t);
  f.clearRect(0, 0, W, H);
  Passaros.desenhar(f, cena, t);
  Cenario.chao(f, cena, t);
  Jogador.desenhar(f, jog, cena);
  Passaros.pousado(f, passarinho, cena, t);
  if (bot.atras) Doidobot.desenhar(f, bot, cena, t);
  Cenario.moita(f, cena, t, moitaSacode.v);
  Cenario.copa(f, cena, t);
  if (!bot.atras) Doidobot.desenhar(f, bot, cena, t);
  Particulas.desenhar(f, cena);
  Baloes.desenhar(f, cena);
  Cenario.tonalizar(f, cena.dia);
  g.drawImage(frente, 0, 0);
  if (bot.estrela > 0) {   // a "estrela" estranha no céu, antes de cair
    const x = Math.round(bot.x - cena.camX), y = Math.round(bot.y + cena.camY), pisca = Math.floor(t / 120) % 2;
    g.globalAlpha = bot.estrela;
    glifo(g, 'brilho', x - 3, y - 3, pisca ? '#fff3a0' : '#ffffff', 2);
    ret(g, x, y - 6, 1, 13, 'rgba(255,243,160,.6)'); ret(g, x - 6, y, 13, 1, 'rgba(255,243,160,.6)');
    g.globalAlpha = 1;
  }

  const z = cena.zoom, sw = W / z, sh = H / z;
  const sx = limitar(cena.fx - sw / 2, 0, W - sw), sy = limitar(cena.fy - sh / 2, 0, H - sh);
  recorte = { sx, sy, sw, sh };
  let tx = 0, ty = 0;
  if (cena.tremor > 0 && !reduzMovimento) {
    const k = tela.width / W * cena.tremor;
    tx = aleat(-k, k); ty = aleat(-k, k);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, tela.width, tela.height);
  ctx.drawImage(buf, sx, sy, sw, sh, tx, ty, tela.width, tela.height);

  elPreto.style.opacity = cena.escuro.toFixed(3);
  elOlhos.style.setProperty('--p', cena.palpebra.toFixed(3));
  const filtro = cena.desfoque > .05 ? `blur(${cena.desfoque.toFixed(1)}px)` : '';
  if (filtro !== ultimoFiltro) tela.style.filter = ultimoFiltro = filtro;
}

let ultimo = performance.now();
function quadro(agora) {
  if (typeof AM !== 'undefined' && AM.emJogo) return;   // o jogo assumiu a tela
  let dt = Math.min(50, agora - ultimo);
  ultimo = agora;
  if (!pausado) atualizar(dt * (opcoes.lerdo ? .8 : 1));
  desenhar();
  requestAnimationFrame(quadro);
}

function ajustarTela() {
  const r = palco.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  tela.width = Math.max(W, Math.round(r.width * d)); tela.height = Math.max(H, Math.round(r.height * d));
}
new ResizeObserver(ajustarTela).observe(palco);
ajustarTela();

// posição do mundo -> porcentagem do palco (para textos HTML como o "POF!")
function naTela(wx, wy) {
  const x = wx - cena.camX, y = wy + cena.camY;
  return { left: (x - recorte.sx) / recorte.sw * 100 + '%', top: (y - recorte.sy) / recorte.sh * 100 + '%' };
}
function onomatopeia(texto, wx, wy) {
  const el = document.createElement('div');
  el.className = 'pof'; el.textContent = texto;
  Object.assign(el.style, naTela(wx, wy));
  $('#efeitos').appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

// ---------- textos sobre o palco ----------
const elPensamento = $('#pensamento'), elLegenda = $('#legenda');
async function pensar(texto, ms) {
  elPensamento.textContent = texto; elPensamento.style.opacity = 1;
  await esperar(ms);
  elPensamento.style.opacity = 0;
  await esperar(500);
}
function legenda(texto) { elLegenda.textContent = texto; elLegenda.style.opacity = texto ? 1 : 0; }

// ---------- diálogo ----------
const caixa = $('#dialogo'), elTexto = $('#texto'), elNome = $('#nome'), elSeta = $('#seta');
const formNome = $('#formNome'), campoNome = $('#campoNome');
const retrato = Rosto.criar($('#retrato'));
const dlg = { ativo: false, chars: [], mostrados: 0, acum: 0, pausa: 0, pronto: false, res: null, expr: 'normal', quem: 'bot', esperaAuto: 0, pedeNome: false };

function dizer(quem, texto, expr = 'normal') {
  return new Promise(res => {
    Object.assign(dlg, { ativo: true, chars: Array.from(texto), mostrados: 0, acum: 0, pausa: 0, pronto: false, res, expr, quem, pedeNome: false });
    caixa.hidden = false;
    caixa.classList.toggle('eu', quem === 'eu');
    elNome.textContent = quem === 'eu' ? (nomeJogador === 'Viajante' ? 'Você' : nomeJogador) : 'Doidobot';
    if (quem === 'bot') { retrato.expressao(expr); if (expr !== 'humano') bot.expr = expr; }
    elTexto.textContent = ''; elSeta.hidden = true; formNome.hidden = true;
  });
}

function perguntarNome(texto) {
  const p = dizer('bot', texto, 'normal');
  dlg.pedeNome = true; campoNome.value = '';
  return p.then(() => nomeJogador);
}

function fecharDialogo() { caixa.hidden = true; dlg.ativo = false; }

const avancaSozinho = () => (opcoes.auto || DEMO) && !opcoes.lerdo;

function atualizarDialogo(dt) {
  if (!dlg.ativo) return;
  if (dlg.pronto) {
    const sozinho = dlg.pedeNome ? DEMO : avancaSozinho();   // o nome nunca é enviado sem você
    if (sozinho && (dlg.esperaAuto -= dt) <= 0) {
      if (dlg.pedeNome) { campoNome.value = params.get('nome') || ''; enviarNome(); } else avancar();
    }
    return;
  }
  if (dlg.pausa > 0) { dlg.pausa -= dt; return; }
  dlg.acum += dt * (opcoes.lerdo ? 20 : 42) / 1000;
  while (dlg.acum >= 1 && dlg.mostrados < dlg.chars.length) {
    dlg.acum -= 1;
    const ch = dlg.chars[dlg.mostrados++];
    if (dlg.quem === 'bot' && dlg.mostrados % 2 === 0 && /\S/.test(ch)) Som.voz(bot.humano ? 'humano' : dlg.expr);
    if ('.!?…'.includes(ch)) { dlg.pausa = opcoes.lerdo ? 260 : 170; break; }
    if (ch === ',') { dlg.pausa = 90; break; }
  }
  elTexto.textContent = dlg.chars.slice(0, dlg.mostrados).join('');
  if (dlg.mostrados >= dlg.chars.length) terminarDigitacao();
}

function terminarDigitacao() {
  dlg.mostrados = dlg.chars.length;
  elTexto.textContent = dlg.chars.join('');
  dlg.pronto = true;
  dlg.esperaAuto = dlg.pedeNome ? 900 : Math.max(1500, dlg.chars.length * 48);
  if (dlg.pedeNome) { formNome.hidden = false; if (!DEMO) campoNome.focus({ preventScroll: true }); }
  else elSeta.hidden = false;
}

function avancar() {
  if (!dlg.ativo || dlg.pedeNome && dlg.pronto) return;
  if (!dlg.pronto) { terminarDigitacao(); return; }
  dlg.ativo = false; elSeta.hidden = true;
  const res = dlg.res; dlg.res = null;
  if (res) res();
}

function enviarNome() {
  nomeJogador = campoNome.value.trim().replace(/\s+/g, ' ').slice(0, 14) || 'Viajante';
  formNome.hidden = true; dlg.pedeNome = false; dlg.ativo = false;
  const res = dlg.res; dlg.res = null;
  if (res) res();
}
formNome.addEventListener('submit', e => { e.preventDefault(); enviarNome(); });

palco.addEventListener('click', e => { if (!pausado && !e.target.closest('button')) avancar(); });
caixa.addEventListener('click', e => { if (!pausado && !e.target.closest('form')) avancar(); });
addEventListener('keydown', e => {
  if (e.target === campoNome) return;
  if (e.key === 'Escape' && rodando) { alternarOpcoes(); return; }
  if ((e.key === ' ' || e.key === 'Enter') && rodando && !pausado && !e.target.closest('button')) { e.preventDefault(); avancar(); }
});

// ---------- opções ----------
const elConfig = $('#config');
const marcar = (b, v) => { b.setAttribute('aria-pressed', String(v)); b.textContent = v ? 'Sim' : 'Não'; };
function pintarOpcoes() {
  marcar($('#optLerdo'), opcoes.lerdo);
  marcar($('#optAuto'), opcoes.auto && !opcoes.lerdo);
  $('#optAuto').disabled = opcoes.lerdo;
  document.documentElement.style.setProperty('--escala', opcoes.escala);
}
function alternarOpcoes(abrir = elConfig.hidden) {
  elConfig.hidden = !abrir;
  pausado = abrir;   // "sem pressa": o mundo para enquanto o menu está aberto
  if (abrir) $('#optFechar').focus();
}
$('#optLerdo').onclick = () => {
  opcoes.lerdo = !opcoes.lerdo; salvarOpcoes(); pintarOpcoes();
  recado(opcoes.lerdo
    ? 'Relaxa, eu também sou meio lerdo às vezes! Já passei três horas debugando um código que só tava faltando um ponto e vírgula... 🤓'
    : 'Devagar e sempre, meu consagrado! Voltamos ao ritmo normal.', opcoes.lerdo ? 'nerd' : 'feliz');
};
$('#optAuto').onclick = () => { opcoes.auto = !opcoes.auto; salvarOpcoes(); pintarOpcoes(); };
$('#optMenor').onclick = () => { opcoes.escala = Math.max(.85, +(opcoes.escala - .15).toFixed(2)); salvarOpcoes(); pintarOpcoes(); };
$('#optMaior').onclick = () => { opcoes.escala = Math.min(1.45, +(opcoes.escala + .15).toFixed(2)); salvarOpcoes(); pintarOpcoes(); };
$('#optFechar').onclick = () => alternarOpcoes(false);
$('#optRever').onclick = () => { alternarOpcoes(false); comecar(); };
$('#btnConfig').onclick = () => alternarOpcoes();
$('#btnPular').onclick = () => final();
$('#btnSom').onclick = () => {
  Som.alternar(!Som.ligado);
  $('#btnSom').setAttribute('aria-pressed', String(Som.ligado));
  $('#btnSom').textContent = Som.ligado ? 'Som' : 'Mudo';
};
pintarOpcoes();

// ---------- recado rápido do Doidobot ----------
const elRecado = $('#recado'), miniRecado = Rosto.criar(elRecado.querySelector('.mini'));
let tempoRecado;
function recado(texto, expr = 'feliz', ms = 4500) {
  miniRecado.expressao(expr);
  elRecado.querySelector('span').textContent = texto;
  elRecado.hidden = false;
  elRecado.style.animation = 'none'; void elRecado.offsetWidth; elRecado.style.animation = '';
  clearTimeout(tempoRecado);
  tempoRecado = setTimeout(() => { elRecado.hidden = true; }, ms);
}

// ---------- título ----------
const miniTitulo = Rosto.criar($('#miniBot'));
let cliquesNoBot = 0;
const REACOES = [
  ['Ei! Cócegas não! 😂', 'gargalhada'],
  ['Me clicou?! Já te considero meu melhor amigo pra sempre!', 'apaixonado'],
  ['Eu torço pro Corinthians, já o Silvio Santos... Vote Doido para presidente!', 'piscadinha'],
  ['Amo jogar Brawl no tempo livre. E no tempo não livre também!', 'animado'],
  ['Antes eu queria ser Hokage. Agora só quero voltar no tempo quando o código dá erro, igualzinho o Subaru! 😂', 'nerd'],
  ['Meu herói favorito era o Homem de Ferro, mas ultimamente é o Homem-Aranha. Eu me apego muito fácil!', 'feliz'],
];
$('#miniBot').addEventListener('click', () => {
  cliquesNoBot++;
  // bem de vez em quando ele tenta virar humano (e não aguenta muito)
  if (cliquesNoBot > 2 && Math.random() < 1 / 7) {
    Som.efeito('glitch'); miniTitulo.glitch(true);
    setTimeout(() => { miniTitulo.glitch(false); miniTitulo.expressao('humano'); recado('Vou virar humano! ... Consegui! Olha esse cabelo!', 'humano'); }, 500);
    setTimeout(() => { Som.efeito('glitch'); miniTitulo.glitch(true); }, 2600);
    setTimeout(() => { miniTitulo.glitch(false); miniTitulo.expressao('tonto'); recado('Bzzzt! Não aguento muito tempo. Voltei a ser cabeça de robô!', 'tonto'); }, 3100);
    return;
  }
  const [frase, expr] = REACOES[(cliquesNoBot - 1) % REACOES.length];
  miniTitulo.expressao(expr); Som.efeito('boing'); recado(frase, expr);
});
$('#btnComecar').onclick = () => { $('#titulo').hidden = true; $('#barra').hidden = true; AM.jogo.telaPartida(nomeJogador); };
$('#btnRever').onclick = () => comecar();

function mostrarTitulo() {
  $('#titulo h1').innerHTML = [...'AETHERMOOR'].map((l, i) => `<span style="animation-delay:${(i * .07).toFixed(2)}s">${l}</span>`).join('');
  $('#titulo').hidden = false;
  miniTitulo.expressao('feliz');
}

// ---------- começo ----------
function comecar() {
  descartarPendentes();
  estadoInicial();
  fecharDialogo();
  ['#titulo', '#rolo', '#hud', '#recado'].forEach(s => { $(s).hidden = true; });
  $('#barra').hidden = false; $('#btnPular').hidden = false;
  elConfig.hidden = true; pausado = false; rodando = true; nomeJogador = 'Viajante';
  legenda(''); elPensamento.style.opacity = 0;
  retrato.expressao('normal');
  roteiro().catch(e => console.error(e));
}

$('#btnAcordar').onclick = () => {
  Som.iniciar();
  $('#inicio').hidden = true;
  comecar();
};

async function adiantar(segundos) {   // para testes: roda o tempo depressa
  const canal = new MessageChannel(), proximo = () => new Promise(r => { canal.port1.onmessage = r; canal.port2.postMessage(0); });
  while (t < segundos * 1000) { atualizar(33); await proximo(); }
}

// liga tudo depois que todos os scripts (inclusive o roteiro) carregaram
addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(quadro);
  if (DEMO || params.has('pular')) {
    $('#inicio').hidden = true;
    comecar();
    if (params.has('pular')) final();
    else if (params.get('ate')) { pausado = true; adiantar(Number(params.get('ate'))).then(() => { pausado = params.has('parar'); }); }
  }
});
