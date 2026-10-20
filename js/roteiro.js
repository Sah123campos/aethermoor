// Roteiro da abertura: a madrugada vira manhã, você acorda debaixo da árvore e
// o Doidobot cai do céu direto numa moita.
'use strict';

const NO_CHAO = -36;   // câmera um pouco abaixada para o diálogo não cobrir ninguém

function focar(x, y, zoom, ms, curva = entraSai) {
  return Promise.all([animar(cena, 'fx', x, ms, curva), animar(cena, 'fy', y, ms, curva), animar(cena, 'zoom', zoom, ms, curva)]);
}

async function pular(alvo, altura = 3) {
  await animar(alvo, 'pulo', altura, 120, sai);
  await animar(alvo, 'pulo', 0, 160, entra);
}

// queda maluca do Doidobot, com loopings, até a moita
async function queda() {
  const ini = { x: bot.x, y: bot.y }, fim = { x: Cenario.MOITA_X + 2, y: CHAO - 8 }, k = { v: 0 };
  const passo = () => {
    const v = k.v, amp = 24 * (1 - v), a = v * Math.PI * 5;
    bot.x = lerp(ini.x, fim.x, v) + Math.sin(a) * amp;
    bot.y = lerp(ini.y, fim.y, entra(v)) + (1 - Math.cos(a)) * amp * .45;
    bot.rot = v * 16;
  };
  aCadaQuadro.add(passo);
  await animar(k, 'v', 1, 2300, linear);
  aCadaQuadro.delete(passo);
}

async function transformar(paraHumano) {
  elTexto.textContent = '✦ bzzzt... bzzzzzt ✦'; elSeta.hidden = true;
  Som.efeito('glitch'); retrato.glitch(true); bot.glitch = true;
  brilhos(bot.x, bot.y, 12);
  await esperar(900);
  bot.humano = paraHumano;
  retrato.expressao(paraHumano ? 'humano' : 'tonto');
  if (!paraHumano) bot.expr = 'tonto';
  Som.efeito(paraHumano ? 'brilho' : 'glitch');
  await esperar(350);
  retrato.glitch(false); bot.glitch = false;
}

function seguirJogador() {
  const segue = dt => {
    bot.x += (jog.x + 15 - bot.x) * Math.min(1, dt / 260);
    bot.y += (CHAO - 30 - bot.y) * Math.min(1, dt / 260);
  };
  aCadaQuadro.add(segue);
}

async function roteiro() {
  // 1. madrugada, olhando o céu
  Som.trilha('noite');
  cena.zzz = true;
  animar(cena, 'escuro', 0, 2400, linear);
  await esperar(1300);
  legenda('Em algum lugar de Aethermoor...');
  await esperar(2800);

  // 2. amanhece enquanto a câmera desce até a campina
  animar(cena, 'dia', .8, 11500, linear);
  const descida = animar(cena, 'camY', 0, 10500, entraSai);
  await esperar(2600);
  legenda('');
  Som.trilha('amanhecer');
  await esperar(1600);
  cena.passaros = true;
  Passaros.revoada(cena);
  await descida;
  cena.relogio = true;
  $('#hud').hidden = false;

  // 3. de perto: você dormindo debaixo da árvore
  await focar(jog.x - 4, CHAO - 12, 2.3, 2600);
  passarinho.visivel = true; passarinho.voando = true;
  animar(passarinho, 'x', jog.x + 16, 1900, sai);
  await animar(passarinho, 'y', CHAO, 1900, entraSai);
  passarinho.voando = false;
  await esperar(500);
  passarinho.pulando = true; Som.efeito('piar');
  Baloes.mostrar(passarinho, 'nota', 900, 15);
  await esperar(1000);
  passarinho.pulando = false;
  await esperar(500);
  Som.efeito('piar');
  await esperar(700);

  // 4. olhos fechados... que barulho é esse?
  cena.zzz = false;
  await animar(cena, 'palpebra', 1, 800);
  await pensar('...', 1500);
  await pensar('Que barulho é esse...?', 2000);
  await pensar('Passarinhos...?', 1800);

  // 5. abre os olhos devagar, tudo embaçado
  cena.desfoque = 6;
  await animar(cena, 'palpebra', .66, 900);
  await animar(cena, 'palpebra', 1, 260);
  await esperar(350);
  animar(cena, 'desfoque', 2.5, 900);
  await animar(cena, 'palpebra', .3, 900);
  await animar(cena, 'palpebra', 1, 200);
  jog.fechados = false;
  animar(cena, 'desfoque', 0, 1300);
  await animar(cena, 'palpebra', 0, 1000, sai);

  // 6. levanta e olha em volta
  await esperar(500);
  passarinho.voando = true; Som.efeito('piar');
  animar(passarinho, 'x', 330, 2600, entra); animar(passarinho, 'y', 10, 2600, entra);
  jog.pose = 'sentado'; Som.efeito('pano'); poeira(jog.x, CHAO);
  focar(jog.x, CHAO - 14, 1.7, 1500);
  await esperar(1000);
  Baloes.mostrar(jog, '?', 1500, 28);
  await esperar(1700);
  jog.pose = 'em-pe'; Som.efeito('pano'); poeira(jog.x, CHAO, 5);
  await pular(jog);
  passarinho.visivel = false;
  await esperar(500);
  jog.dir = -1; await esperar(700);
  jog.dir = 1; await esperar(700);
  jog.dir = 0; await esperar(300);
  await Promise.all([focar(160, 90, 1, 1500), animar(cena, 'camY', NO_CHAO, 1500)]);
  await dizer('eu', 'Onde... onde eu tô?');
  fecharDialogo();

  // 7. uma estrela esquisita no céu... caindo
  bot.estrela = 0;
  animar(bot, 'estrela', 1, 600);
  Som.efeito('brilho');
  await esperar(900);
  jog.dir = 1;
  Baloes.mostrar(jog, '!', 1300, 30);
  await esperar(1100);
  bot.estrela = 0; bot.visivel = true; bot.expr = 'susto'; bot.rastro = true;
  Som.efeito('assobio');
  await queda();
  bot.rastro = false; bot.atras = true; bot.rot = 0; bot.visivel = false;
  Som.efeito('impacto'); Som.trilha('nada');
  cena.tremor = 3; animar(cena, 'tremor', 0, 600, sai);
  moitaSacode.v = 3; animar(moitaSacode, 'v', 0, 900, sai);
  folhas(Cenario.MOITA_X, CHAO - 10, 20);
  onomatopeia('POF!', Cenario.MOITA_X, CHAO - 30);
  await esperar(1500);
  Baloes.mostrar(jog, '...', 1300, 30);
  await esperar(900);
  moitaSacode.v = 1.5; animar(moitaSacode, 'v', 0, 500); Som.efeito('folhas');
  await esperar(900);
  moitaSacode.v = 2; animar(moitaSacode, 'v', 0, 600); Som.efeito('folhas');
  await esperar(700);

  // 8. sai da moita: é o Doidobot!
  Object.assign(bot, { visivel: true, atras: false, expr: 'tonto', x: Cenario.MOITA_X, y: CHAO - 6 });
  Som.efeito('boing'); folhas(Cenario.MOITA_X, CHAO - 10, 10);
  await animar(bot, 'y', CHAO - 28, 500, sai);
  bot.flutua = 1.5;
  Som.trilha('doido');
  await dizer('bot', 'Ai, ai, ai... quem foi que colocou uma moita no meio do céu?!', 'tonto');
  fecharDialogo();
  bot.expr = 'normal';
  for (const r of [.35, -.35, .2, 0]) await animar(bot, 'rot', r, 110);
  await esperar(250);
  Baloes.mostrar(bot, '!', 1000, 21); Som.efeito('pop');
  await dizer('bot', 'PERAÍ. Um humano?! Acordado?! Um humano DE VERDADE?!', 'susto');
  fecharDialogo();

  // 9. vem dando cambalhotas
  bot.expr = 'apaixonado';
  animar(bot, 'x', jog.x + 20, 1100); animar(bot, 'y', CHAO - 30, 1100);
  await animar(bot, 'rot', Math.PI * 4, 1100);
  bot.rot = 0; jog.dir = 1;
  Som.efeito('boing'); brilhos(bot.x, bot.y, 10);
  await dizer('bot', 'Oi! Oi! OI! Eu sou o Doidobot, seu assistente oficial! Você nem me deu oi ainda e eu já te considero meu melhor amigo pra sempre! ❤️', 'apaixonado');
  await dizer('eu', 'Oi...?');
  animar(bot, 'rot', -.4, 300);
  await dizer('bot', 'Hã? Falou alguma coisa? Fala aqui do lado esquerdo, que o ouvido direito é só enfeite! 👂', 'confuso');
  animar(bot, 'rot', 0, 300);
  await dizer('bot', 'Sério! Por um tempo eu achei que o mundo tava ficando baixinho... aí descobri que o surdo era eu. Só de um lado, mas o outro escuta por dois!', 'gargalhada');
  await dizer('bot', 'Antes já me achavam robô porque eu tinha um ferro no ouvido e não escutava de um lado... agora sou um robô por completo! 🤖😂', 'feliz');

  // 10. o raro modo humano
  await dizer('bot', 'Pois é, eu já fui humano. Dev fullstack, suporte na UFSCar... aí fui caçar um bug gigante e o bug me caçou de volta. Virei cabeça de robô!', 'saudade');
  await dizer('bot', 'Peraí, segura essa... vou virar humano!', 'animado');
  await transformar(true);
  await dizer('bot', 'Ó eu aí! Cabelinho cacheado, jaqueta de couro... bonitão, né?', 'humano');
  await transformar(false);
  await dizer('bot', 'Bzzzt! Não... aguento... muito tempo! Bateria de humanidade em 3%. Voltei!', 'tonto');

  // 11. seu nome (e as lágrimas)
  await perguntarNome('Mas e aí, qual é o seu nome, meu consagrado?');
  Som.efeito('lagrima');
  await dizer('bot', `${nomeJogador}... que nome lindo! 😭 Pronto, já chorei. Eu me apego fácil, mas é com carinho!`, 'chorando');
  await dizer('bot', 'Me chamaram de emocionado? Eu? Imagina! Só chorei três vezes hoje: com o nascer do sol, com um passarinho e agora com você acordando! 😭❤️', 'chorando');
  Som.efeito('brilho');
  await dizer('bot', 'Na verdade, tecnicamente... ☝️🤓 aqui é Aethermoor. Tem quatro estações, e no inverno a plantação ao ar livre congela. Então: estufa, meu consagrado!', 'nerd');

  // 12. a Guilda, a regra de ouro e o checkpoint
  animar(cena, 'destaqueGuilda', 1, 400);
  await dizer('bot', 'Tá vendo aquela torre lá longe? É a Guilda de Aventureiros! O registro é de graça e o quadro de missões vive lotado.', 'animado');
  animar(cena, 'destaqueGuilda', 0, 400);
  await dizer('bot', 'Ah, e uma regra minha: aqui ninguém fica pra trás. Viu alguém sendo injustiçado? A gente para tudo e ajuda. Sempre.', 'serio');
  await dizer('bot', 'E relaxa: se der ruim, tem checkpoint. Só não vai virar o Subaru e morrer mil vezes, hein! 😂', 'piscadinha');
  await dizer('bot', 'Bora? Eu vou junto! Tô flutuando de emoção... e literalmente também!', 'apaixonado');
  fecharDialogo();

  // 13. primeira missão no rolo e pé na estrada
  $('#rolo').hidden = false; Som.efeito('missao');
  bot.expr = 'feliz';
  await animar(bot, 'rot', Math.PI * 6, 1300);
  bot.rot = 0;
  jog.dir = 1; jog.pose = 'andando'; jog.andando = 26;
  seguirJogador();
  animar(cena, 'camX', 110, 6500);
  await esperar(4800);

  // 14. a câmera sobe para o céu e aparece o título
  animar(cena, 'dia', 1, 3200);
  await animar(cena, 'camY', 120, 3600);
  final();
}

// fim (também é para onde o botão Pular leva)
function final() {
  descartarPendentes();
  fecharDialogo();
  aCadaQuadro.clear();
  Object.assign(cena, { dia: 1, camX: 110, camY: 120, zoom: 1, fx: W / 2, fy: H / 2, escuro: 0, palpebra: 0, desfoque: 0, tremor: 0,
    destaqueGuilda: 0, zzz: false, passaros: true, relogio: false });
  Object.assign(jog, { x: 420, pose: 'em-pe', andando: 0 });
  Object.assign(bot, { visivel: false, humano: false, rastro: false, estrela: 0 });
  legenda(''); elPensamento.style.opacity = 0;
  ['#hud', '#rolo', '#btnPular'].forEach(s => { $(s).hidden = true; });
  rodando = false;
  mostrarTitulo();
  Som.trilha('titulo');
}
