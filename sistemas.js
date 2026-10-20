// Sistemas: relógio, estações e clima, fome e sede, plantações, animais,
// sono, morte, experiência e níveis, ouro, vendas e a virada do dia.
'use strict';

AM.sis = (() => {
  const SEG_POR_MIN = .6;    // segundos reais por minuto do jogo
  const FIM_DIA = 26 * 60;   // 2h da madrugada
  let acum = 0, horaAnterior = -1;

  const T = () => AM.tempo;
  const ehNoite = () => T().minuto >= 19 * 60 + 30 || T().minuto < 5 * 60;
  // 0 = dia claro, 1 = noite fechada
  function escuridao() {
    if (AM.mapa.id !== 'mundo') return .62;
    const m = T().minuto;
    if (m < 17 * 60) return 0;
    if (m < 20 * 60) return suave((m - 17 * 60) / 180) * .82;
    return .82;
  }
  const naEstufa = (x, y) => AM.m.ch(x, y) === AM.CH.P_ESTUFA;
  const naFazenda = (x, y) => { const f = AM.mapa.fazenda; return f && x >= f.x - 1 && y >= f.y - 1 && x <= f.x + f.w && y <= f.y + f.h; };

  // ---------- ouro, experiência e níveis ----------
  const xpPara = n => Math.round(40 * Math.pow(n, 1.6));
  function ganharXP(n, motivo) {
    const j = AM.jog;
    j.xp += n;
    while (j.xp >= xpPara(j.nivel)) {
      j.xp -= xpPara(j.nivel); j.nivel++; j.pontos += 3;
      j.vidaMax = AM.atrib.vidaMax(); j.vida = j.vidaMax;
      AM.som('nivel'); AM.fx.texto(j.x, j.y - 34, `NÍVEL ${j.nivel}!`, '#ffd23f'); AM.fx.brilhos(j.x, j.y - 12, 16);
      AM.ui.aviso(`Você subiu para o nível ${j.nivel}! +3 pontos de atributo (C).`, 'ouro');
      AM.bot.falarDe('levelUp'); AM.ev.emit('nivel', { nivel: j.nivel });
    }
  }
  function ganharOuro(n) {
    if (AM.rede && AM.rede.ouroColetivo()) AM.rede.ouro(n); else AM.jog.ouro += n;
  }
  function gastarOuro(n) {
    if (AM.rede && AM.rede.ouroColetivo()) return AM.rede.gastarOuro(n);
    if (AM.jog.ouro < n) return false;
    AM.jog.ouro -= n; return true;
  }
  const ouro = () => AM.rede && AM.rede.ouroColetivo() ? AM.rede.ouroTotal() : AM.jog.ouro;

  // ---------- colheita ----------
  function faseDe(p) {
    const cu = AM.CULTURAS[p.tipo];
    if (p.idade <= 0) return 0;
    if (p.idade >= cu.dias) return 4;
    return 1 + Math.min(2, Math.floor(p.idade / cu.dias * 3));
  }
  function colher(x, y) {
    const p = AM.m.planta(x, y);
    if (!p) return;
    if (p.morta) { AM.mapa.plantas.delete(AM.m.idx(x, y)); AM.inv.dar('fibra'); AM.som('mato'); return; }
    const cu = AM.CULTURAS[p.tipo];
    if (faseDe(p) < 4) {
      const falta = cu.dias - p.idade;
      AM.ui.aviso(`${cu.nome}: falta${falta > 1 ? 'm' : ''} ${falta} dia${falta > 1 ? 's' : ''}${p.regada ? '' : ' (e precisa de água hoje)'}.`);
      return;
    }
    let q = 1;
    if (Math.random() < .1 + AM.atrib.sorte() * .03) q++;
    AM.inv.dar(p.tipo, q);
    if (Math.random() < .05) AM.inv.dar('semente_' + p.tipo, 1);
    AM.som('colher'); AM.fx.brilhos(x * 16 + 8, y * 16 + 4, 6);
    ganharXP(Math.max(3, Math.round(cu.dias * 1.3)), 'colheita');
    if (cu.rebrota) p.idade = cu.dias - cu.rebrota; else AM.mapa.plantas.delete(AM.m.idx(x, y));
    AM.E.estat.colheitas = (AM.E.estat.colheitas || 0) + 1;
    if (AM.E.estat.colheitas === 1) AM.bot.falarDe('colheita');
    AM.ev.emit('colheu', { tipo: p.tipo, qtd: q });
    AM.rede && AM.rede.tile(x, y);
  }

  // ---------- relógio ----------
  function atualizar(dt) {
    const j = AM.jog;
    // fome e sede
    const gasto = AM.atrib.gasto() * dt;
    const correndo = j.correndo ? 1.6 : 1;
    j.fome = Math.max(0, j.fome - gasto * .085);
    j.sede = Math.max(0, j.sede - gasto * .12 * correndo);
    if (j.fome <= 0 || j.sede <= 0) { j.tFaminto = (j.tFaminto || 0) + dt; if (j.tFaminto > 3) { j.tFaminto = 0; j.vida -= 2; AM.fx.texto(j.x, j.y - 26, '-2', '#ff5a5a'); if (j.vida <= 0) { j.vida = 0; morrer(); } } }
    if (j.fome < 20 && !j.avisouFome) { j.avisouFome = true; AM.bot.contexto('fome'); } else if (j.fome > 40) j.avisouFome = false;
    if (j.sede < 20 && !j.avisouSede) { j.avisouSede = true; AM.bot.contexto('sede'); } else if (j.sede > 40) j.avisouSede = false;
    if (j.fome > 70 && j.sede > 70 && j.vida < j.vidaMax) j.vida = Math.min(j.vidaMax, j.vida + dt * .4);
    if (AM.rede && !AM.rede.anfitriao()) return;   // o relógio é do anfitrião
    // tempo do jogo
    acum += dt;
    while (acum >= SEG_POR_MIN) {
      acum -= SEG_POR_MIN; T().minuto++;
      const hora = Math.floor(T().minuto / 60);
      if (hora !== horaAnterior) { horaAnterior = hora; novaHora(hora); }
      if (T().minuto >= FIM_DIA) { desmaiar(); break; }
    }
  }

  function novaHora(hora) {
    if (hora === 20) AM.bot.contexto('noite');
    if (hora === 25) AM.bot.contexto('madrugada');
    if (hora >= 8 && hora <= 20) vendasDoBalcao();
    AM.rede && AM.rede.tempo();
  }

  // clientes da vila compram o que está no balcão da sua loja
  function vendasDoBalcao() {
    const mundo = AM.mundo;
    for (const [i, info] of mundo.info) {
      if (mundo.obj[i] !== AM.OB.BALCAO || !info.itens) continue;
      const cheios = info.itens.map((it, k) => it ? k : -1).filter(k => k >= 0);
      if (!cheios.length || Math.random() > .35 + AM.jog.atrib.carisma * .03) continue;
      const k = AM.u.escolha(cheios), it = info.itens[k];
      const valor = Math.round(AM.precoVenda(it.id, AM.jog.atrib.carisma) * 1.2);
      it.qtd--; if (!it.qtd) info.itens[k] = null;
      ganharOuro(valor);
      AM.E.estat.vendasLoja = (AM.E.estat.vendasLoja || 0) + 1;
      AM.ui.aviso(`Sua loja vendeu ${AM.ITENS[it.id].nome} por ${valor} de ouro!`, 'ouro');
      if (AM.E.estat.vendasLoja === 1) AM.bot.falarDe('vendeu');
      AM.ev.emit('vendeu', { id: it.id, ouro: valor });
    }
  }

  // ---------- virada do dia ----------
  function novoDia(dormiu) {
    const t = T(), j = AM.jog, mundo = AM.mundo;
    const relatorio = [];
    // caixas de vendas
    let vendido = 0;
    for (const [i, info] of mundo.info) {
      if (mundo.obj[i] !== AM.OB.CAIXA_VENDA || !info.itens) continue;
      info.itens.forEach(it => { if (it) { vendido += AM.precoVenda(it.id, j.atrib.carisma) * it.qtd; AM.ev.emit('vendeu', { id: it.id, qtd: it.qtd, caixa: true }); } });
      info.itens = [];
    }
    if (vendido) { ganharOuro(vendido); relatorio.push(`Caixa de vendas: +${vendido} de ouro`); }
    // avança a data
    t.dia++; t.diaEstacao++;
    let trocouEstacao = false;
    if (t.diaEstacao > AM.DIAS_ESTACAO) { t.diaEstacao = 1; t.estacao = (t.estacao + 1) % 4; if (t.estacao === 0) t.ano++; trocouEstacao = true; }
    t.minuto = 6 * 60; horaAnterior = 6;
    const est = t.estacao;
    t.clima = est === 3 ? (Math.random() < .4 ? 'neve' : 'sol') : (Math.random() < (est === 1 ? .12 : .22) ? 'chuva' : 'sol');
    // plantações
    for (const [i, p] of mundo.plantas) {
      const x = i % mundo.w, y = Math.floor(i / mundo.w), estufa = mundo.chao[i] === AM.CH.P_ESTUFA;
      const cu = AM.CULTURAS[p.tipo];
      if (!p.morta && p.regada) p.idade++;
      if (trocouEstacao && !estufa && !cu.estacoes.includes(est)) p.morta = true;
      p.regada = !estufa && t.clima === 'chuva';
      if (mundo.chao[i] === AM.CH.MOLHADA && !p.regada) mundo.chao[i] = AM.CH.ARADA;
      if (p.regada && mundo.chao[i] === AM.CH.ARADA) mundo.chao[i] = AM.CH.MOLHADA;
    }
    for (let i = 0; i < mundo.chao.length; i++) {
      if (t.clima === 'chuva' && mundo.chao[i] === AM.CH.ARADA) mundo.chao[i] = AM.CH.MOLHADA;
      else if (t.clima !== 'chuva' && mundo.chao[i] === AM.CH.MOLHADA && !mundo.plantas.has(i)) mundo.chao[i] = AM.CH.ARADA;
    }
    // mudas, arbustos e colmeias
    for (const [i, info] of mundo.info) {
      const ob = AM.OBJ[mundo.obj[i]];
      if (!ob) continue;
      if (ob.cresce && (info.dias = (info.dias || 0) + 1) >= 4) { mundo.obj[i] = AM.OB[ob.cresce.toUpperCase()]; mundo.info.delete(i); }
      else if (ob.chave === 'arbusto' && !info.fruta && est !== 3 && (info.dias = (info.dias || 0) + 1) >= 3) { info.fruta = true; info.dias = 0; }
      else if (ob.colmeia && est !== 3) info.dias = (info.dias || 0) + 1;
    }
    // animais
    let tristes = 0;
    for (const a of AM.E.animais) {
      const def = AM.ANIMAIS[a.tipo];
      a.carinho = false;
      if (def.pet) { a.felicidade = Math.min(100, (a.felicidade || 60) + 2); continue; }
      const casa = a.casa != null ? AM.construcao.porId(a.casa) : null;
      a.comeu = casa ? AM.construcao.alimentar(casa) : false;
      const quente = !casa ? false : est !== 3 || AM.construcao.aquecida(casa);
      a.felicidade = limitar((a.felicidade ?? 60) + (a.comeu ? 10 : -20) + (quente ? 0 : -25) + (casa ? 0 : -10), 0, 100);
      a.triste = a.felicidade < 30;
      if (a.triste) tristes++;
      if (a.comeu && a.felicidade >= 30 && def.produto) { a.diasProd = (a.diasProd || 0) + 1; if (a.diasProd >= def.cada) { a.diasProd = 0; a.pronto = true; } }
      if (casa) { const area = AM.construcao.area(a.casa); a.x = AM.u.aleat(area.x0 + 8, area.x1 - 8); a.y = AM.u.aleat(area.y0 + 14, area.y1 - 4); }
    }
    if (tristes) relatorio.push(`${tristes} animal(is) triste(s): falta comida, abrigo ou calor.`);
    // jogador
    if (dormiu) { j.vida = j.vidaMax; j.fome = Math.max(15, j.fome - 15); j.sede = Math.max(15, j.sede - 15); }
    if (j.eco > 0) j.eco--;
    AM.missoes.novoDia();
    AM.render && AM.render.sujarTudo();
    // falas da manhã
    if (trocouEstacao && est === 3) AM.bot.falarDe('inverno');
    else if (est === 2 && t.diaEstacao === AM.DIAS_ESTACAO) AM.bot.falarDe('fimOutono');
    else if (t.clima === 'chuva') AM.bot.contexto('chuva');
    if (trocouEstacao) relatorio.unshift(`Começou ${est === 1 ? 'o' : est === 3 ? 'o' : 'a'} ${AM.ESTACOES[est]}!`);
    if (tristes && est === 3) AM.bot.contexto('semAbrigo');
    AM.ev.emit('novoDia', { dia: t.dia, estacao: est });
    AM.rede && AM.rede.tempo(true);
    return relatorio;
  }

  function dormir(cama) {
    const j = AM.jog;
    j.checkpoint = { mapa: 'mundo', x: cama.x * 16 + 8, y: cama.y * 16 + 28 };
    const rel = novoDia(true);
    j.x = j.checkpoint.x; j.y = j.checkpoint.y; j.dir = 'baixo';
    AM.jogo.salvar(true);
    AM.ui.resumoDia(rel, true);
  }

  function desmaiar() {
    const j = AM.jog;
    const perda = Math.min(300, Math.round(ouro() * .1));
    gastarOuro(perda);
    if (AM.mapa.id !== 'mundo') AM.masmorra.sair(true);
    const rel = novoDia(false);
    j.x = j.checkpoint.x; j.y = j.checkpoint.y;
    j.vida = Math.round(j.vidaMax * .6);
    rel.unshift(`Você desmaiou de cansaço e perdeu ${perda} de ouro.`);
    AM.jogo.salvar(true);
    AM.ui.resumoDia(rel, false);
  }

  function morrer() {
    if (AM.morto) return;
    AM.morto = true;
    const j = AM.jog;
    AM.bot.falarDe('morte');
    AM.som('morte');
    setTimeout(() => {
      AM.morto = false;
      if (AM.inv.contar('retorno_morte') > 0 && AM.snapshotDia) {
        AM.jogo.carregar(AM.snapshotDia);
        AM.inv.remover('retorno_morte', 1);
        AM.jog.eco = 1;
        AM.ui.aviso('Retorno pela Morte! Você voltou ao começo do dia. Fica um eco: Sorte -2 hoje.', 'roxo');
        AM.bot.falarDe('rezero');
        return;
      }
      const perda = Math.min(300, Math.round(ouro() * .1));
      gastarOuro(perda);
      if (AM.mapa.id !== 'mundo') AM.masmorra.sair(true);
      j.x = j.checkpoint.x; j.y = j.checkpoint.y; j.vida = Math.round(j.vidaMax * .6);
      j.fome = Math.max(j.fome, 40); j.sede = Math.max(j.sede, 40);
      T().minuto = Math.min(T().minuto + 120, FIM_DIA - 60);
      AM.ui.aviso(`Você acordou no seu ponto de retorno e perdeu ${perda} de ouro.`);
    }, 1600);
  }

  return { atualizar, ehNoite, escuridao, naEstufa, naFazenda, ganharXP, ganharOuro, gastarOuro, ouro, xpPara, faseDe, colher, dormir, morrer, novoDia };
})();
