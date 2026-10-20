// O Doidobot no jogo: cabeça flutuante sempre na tela, balão de fala, dicas
// por contexto, conversa por texto, o raro "modo humano" e o tutorial.
'use strict';

// cérebro de IA (opcional): o servidor do jogo guarda a chave e responde por ele
AM.ia = (() => {
  let ativo = false, provedor = '';
  function base() {
    if (location.protocol.startsWith('http')) return '';
    try { return (localStorage.getItem('aethermoor.servidor') || 'ws://localhost:8080/ws').replace(/^ws/, 'http').replace(/\/ws$/, ''); }
    catch (e) { return 'http://localhost:8080'; }
  }
  async function verificar() {
    try {
      const r = await fetch(base() + '/api/doidobot', { signal: AbortSignal.timeout(2500) });
      const s = await r.json();
      ativo = !!s.ativo; provedor = s.provedor || '';
    } catch (e) { ativo = false; }
    return ativo;
  }
  async function perguntar(corpo) {
    const r = await fetch(base() + '/api/doidobot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(130000) });
    return r.json();
  }
  return { verificar, perguntar, get ativo() { return ativo; }, get provedor() { return provedor; } };
})();

AM.bot = (() => {
  let rosto, elBalao, elTexto, elFechar, tFala = 0, ultimas = {}, cdContexto = {}, tConversa = AM.u.aleat(150, 260);
  let humano = 0, pos = null, esperando = false;
  const eventos = [];
  const IMPORTANTES = new Set(['levelUp', 'morte', 'chefe', 'balao', 'carrinho', 'jutsu', 'rezero', 'construiu', 'missaoFeita', 'domar', 'colheita', 'inverno', 'cristal', 'vendeu', 'masmorra', 'fimOutono', 'generoso', 'escudo']);

  function iniciar() {
    rosto = Rosto.criar(document.querySelector('#botCabeca'));
    elBalao = document.querySelector('#botBalao'); elTexto = elBalao.querySelector('.txt'); elFechar = elBalao.querySelector('button');
    elFechar.onclick = e => { e.stopPropagation(); calar(); };
    document.querySelector('#botCabeca').onclick = () => AM.ui.abrir('conversa');
    AM.ia.verificar();
  }

  function falar(texto, expr = 'normal', ms) {
    if (!rosto) return;
    rosto.expressao(humano > 0 && expr !== 'tonto' ? 'humano' : expr);
    elTexto.textContent = texto;
    elBalao.hidden = false;
    elBalao.classList.remove('surge'); void elBalao.offsetWidth; elBalao.classList.add('surge');
    const lerdo = AM.opc.lerdo;
    tFala = ms || Math.max(4, texto.length * .07) * (lerdo ? 2.2 : 1);
    elFechar.hidden = !lerdo;
    if (lerdo) tFala = 9999;   // no Modo Lerdo você fecha quando terminar de ler
    if (AM.opc.som) for (let k = 0; k < Math.min(8, texto.length / 6); k++) setTimeout(() => Som.voz(expr), k * 70);
    if (AM.opc.semPressa && lerdo) AM.jogo.pausaCurta(.6);
  }
  function calar() { elBalao.hidden = true; tFala = 0; if (!humano && rosto) rosto.expressao('normal'); }

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
  // dicas de situação: no máximo uma a cada 75 s para cada assunto
  function contexto(chave) {
    if (AM.opc.freqDoidobot === 'chamado' || AM.opc.freqDoidobot === 'pouco') return;
    const agora = performance.now() / 1000;
    if (cdContexto[chave] && agora - cdContexto[chave] < 75) return;
    cdContexto[chave] = agora;
    falarDe(chave);
  }

  // ---------- foco no objetivo: o que fazer hoje ----------
  function estadoFazenda() {
    let secas = 0, prontas = 0, mortas = 0;
    for (const p of AM.mundo.plantas.values()) {
      if (p.morta) mortas++;
      else if (AM.sis.faseDe(p) >= 4) prontas++;
      else if (!p.regada) secas++;
    }
    return { secas, prontas, mortas };
  }
  function objetivoDoDia() {
    const j = AM.jog, f = estadoFazenda(), itens = [];
    if (f.prontas) itens.push(`colher ${f.prontas} planta${f.prontas > 1 ? 's' : ''} pronta${f.prontas > 1 ? 's' : ''}`);
    if (f.secas) itens.push(`regar ${f.secas} plantinha${f.secas > 1 ? 's' : ''}`);
    if (j.fome < 40 || j.sede < 40) itens.push(j.fome < j.sede ? 'comer algo cozido' : 'beber água');
    const fome = AM.E.animais.filter(a => !AM.ANIMAIS[a.tipo].pet && a.casa != null);
    if (fome.length) itens.push('pôr feno no cocho dos bichinhos');
    if (!AM.E.missoes.registrado) itens.push('se registrar na Guilda');
    else {
      const m = AM.E.missoes.ativas.find(x => AM.missoes.progresso(x) < x.n) || AM.E.missoes.ativas[0];
      if (m) itens.push(`avançar a missão "${m.titulo}"`);
      else itens.push('pegar uma missão no quadro da Guilda');
    }
    if (AM.tempo.estacao === 2 && AM.tempo.diaEstacao >= AM.DIAS_ESTACAO - 1) itens.push('preparar estufa e abrigo pro inverno');
    if (j.pontos) itens.push(`distribuir ${j.pontos} pontos de atributo (C)`);
    if (!itens.length) itens.push('explorar uma masmorra nova', 'fazer uma amizade na vila');
    const top = itens.slice(0, 3);
    return `Foco de hoje: ${top.map((t, k) => `${k + 1}) ${t}`).join(', ')}. Bora!`;
  }

  // H: dica do momento
  function chamar() {
    const j = AM.jog;
    if (AM.tutorial.ativo()) { falar(AM.tutorial.passo().texto, 'nerd'); return; }
    if (j.vida < j.vidaMax * .3) return falarDe('semVida', true);
    if (j.fome < 25) return falarDe('fome', true);
    if (j.sede < 25) return falarDe('sede', true);
    if (Math.random() < .65) return falar(objetivoDoDia(), 'nerd');
    if (AM.sis.ehNoite()) return falarDe('noite', true);
    falarDe(AM.u.escolha(['dicasGerais', 'dicasGerais', 'animador', 'estranhos']), true);
  }

  // ---------- conversa (IA quando o servidor tem, senão o jeito clássico) ----------
  const historico = () => (AM.E.conversaBot ||= []);
  const memoria = () => (AM.E.memoriaBot ||= []);
  function registrar(papel, texto) {
    const h = historico(); h.push({ papel, texto });
    if (h.length > 30) h.splice(0, h.length - 30);
    if (AM.ui.aberto() === 'conversa') AM.paineis.redesenhar();
  }
  function contextoJogo() {
    const j = AM.jog, t = AM.tempo, f = estadoFazenda();
    const lugar = AM.mapa.id !== 'mundo' ? `masmorra ${AM.MASMORRAS.find(m => m.id === AM.mapa.masmorra).nome}`
      : AM.naVila(Math.floor(j.x / 16), Math.floor(j.y / 16)) ? 'vila' : AM.sis.naFazenda(Math.floor(j.x / 16), Math.floor(j.y / 16)) ? 'fazenda' : AM.NOME_BIOMA[AM.m.bioma(Math.floor(j.x / 16), Math.floor(j.y / 16))];
    return {
      jogador: { nome: j.nome, nivel: j.nivel, vida: `${Math.round(j.vida)}/${j.vidaMax}`, fome: Math.round(j.fome), sede: Math.round(j.sede), ouro: AM.sis.ouro(), pontosParaDistribuir: j.pontos },
      tempo: { estacao: AM.ESTACOES[t.estacao], dia: t.diaEstacao, ano: t.ano, hora: AM.u.hora(t.minuto), clima: t.clima },
      lugar, segurando: AM.inv.selecionado() ? AM.ITENS[AM.inv.selecionado().id].nome : 'nada',
      fazenda: f, animais: AM.E.animais.map(a => a.nome || AM.ANIMAIS[a.tipo].nome).slice(0, 8),
      guilda: AM.E.missoes.registrado ? AM.E.missoes.ativas.map(m => `${m.titulo} (${AM.missoes.progresso(m)}/${m.n})`) : 'não registrado',
      tutorial: AM.tutorial.ativo() ? AM.tutorial.passo().texto : 'concluído',
      chefesDerrotados: Object.keys(AM.E.chefes || {}),
      aconteceuAgora: eventos.slice(-6),
      amigosNaSala: AM.rede.conectado() ? AM.rede.outros().map(o => o.nome) : [],
    };
  }
  async function conversar(txt) {
    txt = String(txt || '').trim();
    if (!txt) return;
    registrar('jogador', txt);
    if (esperando) return;
    if (AM.ia.ativo) {
      esperando = true;
      const p = escolher('pensando'); falar(p[0], p[1], 130);
      try {
        const r = await AM.ia.perguntar({ mensagem: txt, historico: historico().slice(-13, -1), memoria: memoria(), contexto: contextoJogo() });
        esperando = false;
        if (r && r.texto) {
          falar(r.texto, r.expressao || 'normal');
          registrar('doidobot', r.texto);
          if (r.lembrar && !memoria().includes(r.lembrar)) { memoria().push(r.lembrar); if (memoria().length > 15) memoria().shift(); }
          return;
        }
      } catch (e) { esperando = false; }
    }
    const resp = respostaClassica(txt);
    falar(resp[0], resp[1]);
    registrar('doidobot', resp[0]);
  }
  // respostas por palavra-chave (sem IA)
  function respostaClassica(txt) {
    const t = txt.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tem = (...p) => p.some(s => t.includes(s));
    const de = k => escolher(k) || ['...', 'normal'];
    const cur = i => AM.FALAS.curiosidades[i];
    if (tem('mais facil fazer o jogo', 'complexo', 'nao entende', 'nao entendeu', 'burro', 'lerdo demais', 'nao sabe')) return de('meta');
    if (tem('humano')) { setTimeout(virarHumano, 100); return ['Bora tentar!', 'animado']; }
    if (tem('dica', 'ajuda', 'o que eu faco', 'socorro', 'objetivo', 'foco')) return [objetivoDoDia(), 'nerd'];
    if (tem('triste', 'sozinh', 'deprimid', 'mal hoje', 'chorar', 'ansios')) return ['Ei, tô aqui com você. De verdade. Quer me contar o que aconteceu? E se pesar muito, conversa com alguém de confiança, tá? Você importa.', 'serio'];
    if (tem('tdah', 'distrai', 'foco')) return de('tdah');
    if (tem('naruto', 'jutsu', 'hokage', 'clone')) return de('jutsu');
    if (tem('re:zero', 'rezero', 'subaru', 'morte', 'morrer')) return de('rezero');
    if (tem('balao', 'simony', 'tob')) return de('balao');
    if (tem('carro', 'carrinho', 'relampago', 'catchau')) return de('carrinho');
    if (tem('guilda', 'missao', 'missoes', 'iara')) return de('guilda');
    if (tem('inverno', 'neve', 'frio')) return de('inverno');
    if (tem('leal', 'fiel', 'me deixa', 'vai embora', 'fica aqui')) return de('lealdade');
    if (tem('sincero', 'verdade', 'mente')) return de('sincero');
    if (tem('emocionado', 'chora', 'choro')) return cur(9);
    if (tem('corinthians', 'timao', 'silvio')) return cur(4);
    if (tem('cellbit', 'rpg', 'paranormal')) return cur(0);
    if (tem('ouvido', 'surdo', 'escuta')) return cur(3);
    if (tem('ufscar', 'trabalho', 'quem e voce', 'quem voce', 'historia')) return cur(8);
    if (tem('injust', 'ajudar', 'bondade', 'amigo', 'desconhecid')) return de(Math.random() < .5 ? 'bondade' : 'estranhos');
    if (tem('piada', 'curiosidade', 'conta', 'fala algo')) return de(Math.random() < .3 ? 'ingenuo' : 'curiosidades');
    if (tem('oi', 'ola', 'eae', 'e ai', 'salve', 'bom dia', 'boa noite', 'boa tarde')) return de('oi');
    if (tem('obrigad', 'valeu', 'vlw')) return ['De nada! Ajudar você é meu passatempo favorito. Depois do Brawl. Mentira, empata!', 'apaixonado'];
    return de('naoEntendi');
  }

  function comentarNpc(nome) { const l = AM.FALAS_NPC[nome]; if (l) setTimeout(() => falar(l, 'feliz'), 400); }

  // o raro momento em que ele tenta voltar a ser gente
  function virarHumano() {
    if (humano) return;
    falar(AM.FALAS.humano[0][0], 'animado');
    AM.som('glitch');
    setTimeout(() => { humano = 5; rosto.glitch(true); }, 900);
    setTimeout(() => { rosto.glitch(false); rosto.expressao('humano'); falar('Olha eu humano! Cabelinho cacheado, jaqueta de couro... bonitão, né?', 'humano'); }, 1300);
  }

  // ---------- quando as coisas acontecem ----------
  const DESCREVE = {
    nivel: d => `subiu para o nível ${d.nivel}`, matou: d => AM.MOBS[d.tipo].chefe ? `derrotou o chefe ${AM.MOBS[d.tipo].nome}` : null,
    colheu: d => `colheu ${AM.CULTURAS[d.tipo].nome.toLowerCase()}`, construiu: d => `construiu ${AM.PLANTAS[d.planta].nome.toLowerCase()}`,
    domou: d => `domesticou um ${d.tipo}`, missao_feita: d => `concluiu a missão "${d.m.titulo}"`, entrou_masmorra: d => `entrou na masmorra ${d.id}`,
    presente: d => `deu ${AM.ITENS[d.id].nome.toLowerCase()} de presente para ${d.nome}`, pescou: d => d.dourado ? 'pescou um peixe dourado' : null,
    guilda_registro: () => 'se registrou na Guilda', novoDia: d => `começou o dia ${AM.tempo.diaEstacao} de ${AM.ESTACOES[d.estacao]}`,
  };
  AM.ev.on('*', (nome, d) => {
    const f = DESCREVE[nome];
    const txt = f && f(d);
    if (txt) { eventos.push(`${AM.u.hora(AM.tempo.minuto)}: ${txt}`); if (eventos.length > 10) eventos.shift(); }
    if (nome === 'novoDia') setTimeout(() => { if (!['chamado', 'pouco'].includes(AM.opc.freqDoidobot) && !AM.tutorial.ativo()) falar(objetivoDoDia(), 'animado', 9); }, 2500);
  });
  AM.ev.on('morreu', () => { eventos.push(`${AM.u.hora(AM.tempo.minuto)}: desmaiou em combate`); });

  function atualizar(dt) {
    if (tFala > 0 && tFala < 9000 && (tFala -= dt) <= 0) calar();
    if (humano > 0 && (humano -= dt) <= 0) {
      humano = 0; AM.som('glitch'); rosto.glitch(true);
      setTimeout(() => { rosto.glitch(false); falar(AM.FALAS.humanoVolta[0][0], 'tonto'); }, 400);
    }
    const j = AM.jog, dia = AM.tempo.dia, est = AM.E.estat;
    // generoso: em apuro, ele ajuda (uma vez por dia)
    if (j.fome < 12 && est.paoDoBot !== dia && !j.inv.some(it => it && AM.ITENS[it.id].comida && AM.ITENS[it.id].comida.fome > 0)) {
      est.paoDoBot = dia; AM.inv.dar('pao'); falarDe('generoso', true);
    }
    // leal até demais: entra na frente quando a vida está no fim
    if (!AM.morto && j.vida > 0 && j.vida < j.vidaMax * .15 && est.escudoDoBot !== dia && AM.ents.some(e => e.classe === 'mob')) {
      est.escudoDoBot = dia; j.invuln = 2.5; AM.fx.brilhos(j.x, j.y - 14, 18); falarDe('escudo', true);
    }
    // conversa espontânea de vez em quando (e, bem raramente, vira humano)
    const freq = { sempre: .5, normal: 1, pouco: 2.5, chamado: Infinity }[AM.opc.freqDoidobot] || 1;
    if ((tConversa -= dt) <= 0) {
      tConversa = AM.u.aleat(160, 300) * freq;
      if (!isFinite(tConversa) || AM.ui.aberto()) return;
      if (Math.random() < 1 / 14) virarHumano();
      else falarDe(AM.u.escolha(['curiosidades', 'curiosidades', 'tdah', 'lealdade', 'ingenuo', 'animador', 'estranhos', 'bondade', 'dicasGerais']));
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

  return { iniciar, falar, falarDe, contexto, chamar, conversar, virarHumano, atualizar, desenharNoMundo, calar, comentarNpc, objetivoDoDia, historico,
    get humano() { return humano > 0; }, get esperando() { return esperando; } };
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
