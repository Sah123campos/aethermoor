// O Doidobot no jogo: cabeça flutuante sempre na tela, balão de fala, dicas
// por contexto, conversa por texto, o raro "modo humano" e o tutorial.
'use strict';

AM.bot = (() => {
  let rosto, elBalao, elTexto, elFechar, tFala = 0, ultimas = {}, cdContexto = {}, tConversa = AM.u.aleat(150, 260);
  let humano = 0, pos = null;
  const IMPORTANTES = new Set(['levelUp', 'morte', 'chefe', 'balao', 'carrinho', 'jutsu', 'rezero', 'construiu', 'missaoFeita', 'domar', 'colheita', 'inverno', 'cristal', 'vendeu', 'masmorra', 'fimOutono']);

  function iniciar() {
    rosto = Rosto.criar(document.querySelector('#botCabeca'));
    elBalao = document.querySelector('#botBalao'); elTexto = elBalao.querySelector('.txt'); elFechar = elBalao.querySelector('button');
    elFechar.onclick = e => { e.stopPropagation(); calar(); };
    document.querySelector('#botCabeca').onclick = () => AM.ui.abrir('conversa');
  }

  function falar(texto, expr = 'normal', ms) {
    if (!rosto) return;
    rosto.expressao(expr);
    elTexto.textContent = texto;
    elBalao.hidden = false;
    elBalao.classList.remove('surge'); void elBalao.offsetWidth; elBalao.classList.add('surge');
    const lerdo = AM.opc.lerdo;
    tFala = ms || Math.max(4, texto.length * .07) * (lerdo ? 2.2 : 1);
    elFechar.hidden = !lerdo;
    if (lerdo) tFala = 9999;   // no Modo Lerdo você fecha quando terminar de ler
    if (AM.opc.som) Som.voz(expr);
    if (AM.opc.semPressa && lerdo) AM.jogo.pausaCurta(.6);
  }
  function calar() { elBalao.hidden = true; tFala = 0; if (!humano) rosto && rosto.expressao('normal'); }

  function escolher(chave) {
    const lista = AM.FALAS[chave];
    if (!lista) return null;
    let i = Math.floor(Math.random() * lista.length);
    if (lista.length > 1 && i === ultimas[chave]) i = (i + 1) % lista.length;
    ultimas[chave] = i;
    return lista[i];
  }
  function falarDe(chave, forcar = false) {
    const f = AM.opc.freqDoidobot;
    if (!forcar && f === 'chamado' && chave !== 'morte') return;
    if (!forcar && f === 'pouco' && !IMPORTANTES.has(chave)) return;
    const l = escolher(chave);
    if (l) falar(l[0], l[1]);
  }
  // dicas de situação: no máximo uma por minuto para cada assunto
  function contexto(chave) {
    if (AM.opc.freqDoidobot === 'chamado' || AM.opc.freqDoidobot === 'pouco') return;
    const agora = performance.now() / 1000;
    if (cdContexto[chave] && agora - cdContexto[chave] < 75) return;
    cdContexto[chave] = agora;
    falarDe(chave);
  }

  // H: dica do momento
  function chamar() {
    const j = AM.jog;
    if (AM.tutorial.ativo()) { const p = AM.tutorial.passo(); falar(p.texto, 'nerd'); return; }
    if (j.vida < j.vidaMax * .3) return falarDe('semVida', true);
    if (j.fome < 30) return falarDe('fome', true);
    if (j.sede < 30) return falarDe('sede', true);
    if (!AM.E.missoes.registrado) return falarDe('guilda', true);
    const secas = [...AM.mundo.plantas.values()].filter(p => !p.regada && !p.morta).length;
    if (secas) return falar(`Tem ${secas} planta${secas > 1 ? 's' : ''} sem água hoje! Regador nelas, meu consagrado.`, 'confuso');
    if (AM.sis.ehNoite()) return falarDe('noite', true);
    if (AM.tempo.estacao === 2 && AM.tempo.diaEstacao >= AM.DIAS_ESTACAO - 1) return falarDe('fimOutono', true);
    falarDe(Math.random() < .6 ? 'dicasGerais' : 'curiosidades', true);
  }

  // conversa por texto
  function conversar(txt) {
    const t = txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tem = (...p) => p.some(s => t.includes(s));
    if (tem('mais facil fazer o jogo', 'complexo', 'nao entende', 'nao entendeu', 'burro', 'lerdo demais', 'nao sabe')) return falarDe('meta', true);
    if (tem('humano')) return virarHumano();
    if (tem('dica', 'ajuda', 'o que eu faco', 'socorro')) return chamar();
    if (tem('naruto', 'jutsu', 'hokage', 'clone')) return falarDe('jutsu', true);
    if (tem('re:zero', 'rezero', 'subaru', 'morte', 'morrer')) return falarDe('rezero', true);
    if (tem('balao', 'simony', 'tob')) return falarDe('balao', true);
    if (tem('carro', 'carrinho', 'relampago', 'catchau')) return falarDe('carrinho', true);
    if (tem('guilda', 'missao', 'missoes', 'iara')) return falarDe('guilda', true);
    if (tem('inverno', 'neve', 'frio')) return falarDe('inverno', true);
    if (tem('emocionado', 'chora', 'choro')) return falar(AM.FALAS.curiosidades[9][0], 'chorando');
    if (tem('corinthians', 'timao', 'silvio')) return falar(AM.FALAS.curiosidades[4][0], 'piscadinha');
    if (tem('cellbit', 'rpg', 'paranormal')) return falar(AM.FALAS.curiosidades[0][0], 'nerd');
    if (tem('ouvido', 'surdo', 'escuta')) return falar(AM.FALAS.curiosidades[3][0], 'gargalhada');
    if (tem('ufscar', 'trabalho', 'quem e voce', 'quem voce', 'historia')) return falar(AM.FALAS.curiosidades[8][0], 'saudade');
    if (tem('injust', 'ajudar', 'bondade', 'amigo')) return falarDe('bondade', true);
    if (tem('piada', 'curiosidade', 'conta', 'fala algo')) return falarDe('curiosidades', true);
    if (tem('oi', 'ola', 'eae', 'e ai', 'salve', 'bom dia', 'boa noite', 'boa tarde')) return falarDe('oi', true);
    if (tem('obrigad', 'valeu', 'vlw')) return falar('De nada! Ajudar você é meu passatempo favorito. Depois do Brawl. Mentira, empata!', 'apaixonado');
    falarDe('naoEntendi', true);
  }

  // o raro momento em que ele tenta voltar a ser gente
  function virarHumano() {
    if (humano) return;
    falar(AM.FALAS.humano[0][0], 'animado');
    AM.som('glitch');
    setTimeout(() => { humano = 5; rosto.glitch(true); }, 900);
    setTimeout(() => { rosto.glitch(false); rosto.expressao('humano'); falar('Olha eu humano! Cabelinho cacheado, jaqueta de couro... bonitão, né?', 'humano'); }, 1300);
  }

  function atualizar(dt) {
    if (tFala > 0 && tFala < 9000 && (tFala -= dt) <= 0) calar();
    if (humano > 0 && (humano -= dt) <= 0) {
      humano = 0; AM.som('glitch'); rosto.glitch(true);
      setTimeout(() => { rosto.glitch(false); falar(AM.FALAS.humanoVolta[0][0], 'tonto'); }, 400);
    }
    // conversa espontânea de vez em quando (e, bem raramente, vira humano)
    const freq = { sempre: .5, normal: 1, pouco: 2.5, chamado: Infinity }[AM.opc.freqDoidobot] || 1;
    if ((tConversa -= dt) <= 0) {
      tConversa = AM.u.aleat(160, 300) * freq;
      if (!isFinite(tConversa) || AM.ui.aberto()) return;
      if (Math.random() < 1 / 14) virarHumano();
      else falarDe(AM.u.escolha(['curiosidades', 'curiosidades', 'bondade', 'dicasGerais']));
    }
  }

  // cabecinha seguindo você pelo mundo, e a seta do tutorial
  function desenharNoMundo(b, t, dt) {
    const j = AM.jog, alvo = { x: j.x + (j.dir === 'esq' ? 14 : -14), y: j.y - 34 };
    if (!pos) pos = { ...alvo };
    pos.x += (alvo.x - pos.x) * Math.min(1, dt * 3); pos.y += (alvo.y - pos.y) * Math.min(1, dt * 3);
    if (!AM.morto) AM.spr.doidobot(b, pos.x, pos.y - (j.montaria === 'balao' ? 30 : 0), t * 1000, humano > 0);
    const seta = AM.tutorial.ativo() && AM.tutorial.alvo();
    if (seta) {
      const pulo = Math.abs(Math.sin(t * 4)) * 4;
      glifo(b, 'seta', seta.x - 2, seta.y - 26 - pulo, '#3b2414', 1);
      glifo(b, 'seta', seta.x - 3, seta.y - 27 - pulo, '#ffd23f', 1);
    }
  }

  return { iniciar, falar, falarDe, contexto, chamar, conversar, virarHumano, atualizar, desenharNoMundo, calar, get humano() { return humano > 0; } };
})();

// ---------- tutorial ----------
AM.tutorial = (() => {
  const perto = (filtro, raio = 26) => {
    const j = AM.jog, tx = Math.floor(j.x / 16), ty = Math.floor(j.y / 16);
    let melhor = null, md = Infinity;
    for (let y = ty - raio; y <= ty + raio; y++) for (let x = tx - raio; x <= tx + raio; x++) {
      if (!AM.m.dentro(x, y) || !filtro(x, y)) continue;
      const d = Math.hypot(x - tx, y - ty);
      if (d < md) { md = d; melhor = { x: x * 16 + 8, y: y * 16 + 14 }; }
    }
    return melhor;
  };
  const ent = filtro => { const e = AM.ents.find(filtro); return e && { x: e.x, y: e.y }; };
  const tecla = a => AM.input.nomeTecla(AM.input.tecla(a));
  const PASSOS = [
    { id: 'mover', texto: () => `Bem-vindo à sua fazenda! Ande com ${tecla('cima')}${tecla('esq')}${tecla('baixo')}${tecla('dir')} ou as setas (no celular, o direcional).`, ev: 'moveu' },
    { id: 'coletar', texto: () => 'Coleta: pegue o machado (3) e use (Espaço ou clique) virado para uma árvore até ela cair.', ev: 'quebrou', ok: d => ['arvore', 'pinheiro', 'tronco'].includes(d.obj), alvo: () => perto((x, y) => [AM.OB.ARVORE, AM.OB.PINHEIRO].includes(AM.m.ob(x, y))) },
    { id: 'plantar', texto: () => 'Plantio: com a enxada (1) are um quadradinho e plante a semente de nabo (6). Tem terra arada perto da cama!', ev: 'plantou', alvo: () => perto((x, y) => AM.m.ch(x, y) === AM.CH.ARADA && !AM.m.planta(x, y)) },
    { id: 'regar', texto: () => 'Agora o regador (2) na plantinha. Se esvaziar, encha no laguinho da fazenda.', ev: 'regou', alvo: () => perto((x, y) => !!AM.m.planta(x, y) && !AM.m.planta(x, y).regada) },
    { id: 'construir', texto: () => `Construção: abra o inventário (${tecla('inventario')}), aba Criar, faça paredes de madeira e coloque uma no chão. No ${tecla('construir')} tem as plantas prontas!`, ev: 'colocou' },
    { id: 'cozinhar', texto: () => 'Esquentar comida: chegue na fogueira e aperte F. Asse a batata que deixei no seu inventário!', ev: 'criou', ok: d => AM.ITENS[d.id].cat === 'comida', alvo: () => perto((x, y) => AM.m.ob(x, y) === AM.OB.FOGUEIRA) },
    { id: 'guilda', texto: () => 'A Guilda fica no centro da vila, a leste. Fale com a Iara (F) e se registre. É de graça!', ev: 'guilda_registro', alvo: () => ent(e => e.nome === 'Iara') },
    { id: 'domar', texto: () => 'Domesticação: pesque um peixe com a vara (no laguinho mesmo) e dê ao gatinho sem dono da vila, segurando o peixe e apertando F.', ev: 'domou', alvo: () => ent(e => e.classe === 'animal' && e.selvagem) },
    { id: 'combate', texto: () => 'Combate: pegue a espada (5) e derrote um slime. Eles aparecem nos campos fora da vila e da fazenda.', ev: 'matou', alvo: () => ent(e => e.classe === 'mob') },
  ];
  let ouvindo = false;
  const estado = () => AM.E.tutorial;
  const ativo = () => !!AM.E && !estado().feito && estado().passo < PASSOS.length;
  const passo = () => { const p = PASSOS[estado().passo]; return { ...p, texto: p.texto() }; };
  const alvo = () => { const p = PASSOS[estado().passo]; return p && p.alvo ? p.alvo() : null; };

  function iniciar() {
    if (!ouvindo) {
      ouvindo = true;
      AM.ev.on('*', (nome, dados) => {
        if (!ativo()) return;
        const p = PASSOS[estado().passo];
        if (nome === p.ev && (!p.ok || p.ok(dados))) avancar();
      });
    }
    if (ativo()) setTimeout(() => mostrar(), 800);
  }
  function mostrar() { if (!ativo()) return; AM.bot.falar(passo().texto, 'nerd', 14); AM.ui.atualizarTutorial(); }
  function avancar() {
    estado().passo++;
    AM.som('missao');
    if (estado().passo >= PASSOS.length) concluir();
    else { AM.ui.aviso('Tutorial: etapa concluída!'); setTimeout(mostrar, 1200); }
    AM.ui.atualizarTutorial();
  }
  function concluir() {
    estado().feito = true;
    AM.sis.ganharOuro(300); AM.inv.dar('faixa_ninja'); AM.sis.ganharXP(50, 'tutorial');
    AM.ui.aviso('Tutorial completo! Recompensa: 300 de ouro e uma faixa ninja.', 'ouro');
    AM.bot.falar('Você terminou o tutorial! 😭 Toma uma faixa ninja de presente: equipa ela e aperta J. Eu tô muito orgulhoso!', 'chorando');
    AM.ui.atualizarTutorial();
  }
  function pular() { estado().feito = true; AM.ui.atualizarTutorial(); AM.bot.falar('Tudo bem, meu consagrado! Se precisar, me chama no H. E dá pra refazer o tutorial nas opções.', 'feliz'); }
  function refazer() { estado().feito = false; estado().passo = 0; AM.ui.atualizarTutorial(); mostrar(); }

  return { iniciar, ativo, passo, alvo, pular, refazer, total: PASSOS.length };
})();
