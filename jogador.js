// O jogador: inventário, movimento com colisão, ferramentas (arar, regar,
// cortar, quebrar, pescar, atacar, plantar, colocar) e interações (F).
'use strict';

AM.som = n => { if (AM.opc.som && typeof Som !== 'undefined') Som.efeito(n); };

// ---------- inventário ----------
AM.INV_TAM = 32;
AM.inv = {
  get lista() { return AM.jog.inv; },
  contar(id) { return AM.jog.inv.reduce((s, it) => s + (it && it.id === id ? it.qtd : 0), 0); },
  tem(ing) { return Object.entries(ing).every(([id, q]) => AM.inv.contar(id) >= q); },
  // devolve quanto sobrou (0 = coube tudo)
  adicionar(id, qtd = 1, silencioso = false) {
    const def = AM.ITENS[id];
    if (!def || qtd <= 0) return qtd;
    const inv = AM.jog.inv, original = qtd;
    for (let i = 0; i < inv.length && qtd > 0; i++) {
      const s = inv[i];
      if (s && s.id === id && s.qtd < def.pilha) { const n = Math.min(qtd, def.pilha - s.qtd); s.qtd += n; qtd -= n; }
    }
    for (let i = 0; i < inv.length && qtd > 0; i++) {
      if (!inv[i]) {
        const n = Math.min(qtd, def.pilha);
        inv[i] = { id, qtd: n };
        if (def.cargaMax) inv[i].carga = def.cargaMax;
        qtd -= n;
      }
    }
    const ganhou = original - qtd;
    if (ganhou > 0) { AM.ev.emit('coletou', { id, qtd: ganhou }); if (!silencioso) AM.ui && AM.ui.pegou(id, ganhou); }
    if (qtd > 0 && !silencioso) AM.bot && AM.bot.contexto('invCheio');
    AM.ui && AM.ui.atualizarHotbar();
    return qtd;
  },
  remover(id, qtd = 1) {
    if (AM.inv.contar(id) < qtd) return false;
    const inv = AM.jog.inv;
    for (let i = inv.length - 1; i >= 0 && qtd > 0; i--) {
      const s = inv[i];
      if (s && s.id === id) { const n = Math.min(qtd, s.qtd); s.qtd -= n; qtd -= n; if (!s.qtd) inv[i] = null; }
    }
    AM.ui && AM.ui.atualizarHotbar();
    return true;
  },
  gastar(ing) { if (!AM.inv.tem(ing)) return false; Object.entries(ing).forEach(([id, q]) => AM.inv.remover(id, q)); return true; },
  selecionado() { return AM.jog.inv[AM.jog.sel]; },
  // ganha o item ou, se não couber, larga no chão
  dar(id, qtd = 1) { const sobra = AM.inv.adicionar(id, qtd); if (sobra > 0) AM.criaturas.soltarItem(id, sobra, AM.jog.x, AM.jog.y); },
};

// ---------- criação do jogador ----------
AM.novoJogador = function (nome, x, y) {
  const inv = new Array(AM.INV_TAM).fill(null);
  const iniciais = [['enxada'], ['regador'], ['machado'], ['picareta'], ['espada_madeira'], ['semente_nabo', 15], ['semente_batata', 6], ['frutinha', 5],
    ['madeira', 10], ['pao', 3]];
  iniciais.forEach(([id, q = 1], i) => { inv[i] = { id, qtd: q }; if (AM.ITENS[id].cargaMax) inv[i].carga = AM.ITENS[id].cargaMax; });
  return {
    nome: nome || 'Viajante', x: x * 16 + 8, y: y * 16 + 12, dir: 'baixo', quadro: 0, andando: false, tAnda: 0,
    vida: 100, vidaMax: 100, fome: 100, sede: 100, nivel: 1, xp: 0, pontos: 0,
    atrib: { forca: 0, velocidade: 0, sorte: 0, vitalidade: 0, agilidade: 0, carisma: 0 },
    ouro: 500, inv, sel: 0, faixa: false, montaria: null, cd: 0, invuln: 0, acao: null, pesca: null,
    checkpoint: { mapa: 'mundo', x: x * 16 + 8, y: y * 16 + 12 }, eco: 0, paleta: 'jogador',
  };
};

AM.atrib = {
  velocidade: () => 1 + AM.jog.atrib.velocidade * .03,
  dano: base => base + AM.jog.atrib.forca * 1.5,
  cooldown: () => Math.max(.18, .42 * (1 - AM.jog.atrib.agilidade * .05)),
  esquiva: () => Math.min(.3, AM.jog.atrib.agilidade * .02),
  sorte: () => Math.max(0, AM.jog.atrib.sorte - (AM.jog.eco > 0 ? 2 : 0)),
  vidaMax: () => 100 + AM.jog.atrib.vitalidade * 8,
  gasto: () => Math.max(.4, 1 - AM.jog.atrib.vitalidade * .03),
};

// ---------- colisão ----------
// caixa pequena nos pés: (x-r .. x+r, y-4 .. y+1)
AM.colide = function (x, y, r = 4) {
  const x0 = Math.floor((x - r) / 16), x1 = Math.floor((x + r) / 16), y0 = Math.floor((y - 4) / 16), y1 = Math.floor((y + 1) / 16);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (AM.m.solido(tx, ty)) return true;
  return false;
};
AM.mover = function (e, dx, dy, r = 4, voando = false) {
  if (voando) { e.x = limitar(e.x + dx, 8, AM.mapa.w * 16 - 8); e.y = limitar(e.y + dy, 8, AM.mapa.h * 16 - 4); return; }
  if (dx && !AM.colide(e.x + dx, e.y, r)) e.x += dx;
  if (dy && !AM.colide(e.x, e.y + dy, r)) e.y += dy;
};

// ---------- alvo (tile que o jogador vai afetar) ----------
const DIRS = { baixo: [0, 1], cima: [0, -1], esq: [-1, 0], dir: [1, 0] };
AM.alvo = function () {
  const j = AM.jog, tx = Math.floor(j.x / 16), ty = Math.floor((j.y - 4) / 16);
  const ms = AM.input.mouse;
  if (ms.dentro && performance.now() - ms.mexeu < 4000 && !AM.toqueAtivo) {
    const mx = Math.floor(ms.mundoX / 16), my = Math.floor(ms.mundoY / 16);
    if (Math.abs(mx - tx) <= 1 && Math.abs(my - ty) <= 1) return { x: mx, y: my, mouse: true };
  }
  const [dx, dy] = DIRS[j.dir];
  return { x: tx + dx, y: ty + dy, mouse: false };
};

// ---------- uso de itens e ferramentas (Espaço / clique esquerdo) ----------
AM.usar = function () {
  const j = AM.jog;
  if (j.cd > 0 || j.montaria === 'balao') return;
  if (j.pesca) { AM.puxarPeixe(); return; }
  const s = AM.inv.selecionado(), def = s && AM.ITENS[s.id], a = AM.alvo();
  const ch = AM.m.ch(a.x, a.y), obId = AM.m.ob(a.x, a.y), ob = AM.OBJ[obId];
  j.cd = .28;
  const golpe = (tipo) => { j.acao = { tipo, t: 0 }; };

  if (!def) { golpe('soco'); AM.criaturas.ataque(4, 18, false); if (ob && ob.ferr === 'mao') AM.bater(a.x, a.y, 1); return; }
  const f = def.ferr;
  if (def.cat === 'arma') {
    j.cd = AM.atrib.cooldown();
    if (def.distancia) {
      if (!AM.inv.remover('flecha', 1)) { AM.ui.aviso('Sem flechas! Faça na bancada ou compre na Forja.'); return; }
      golpe('arco'); AM.som('arco');
      AM.criaturas.atirar(AM.atrib.dano(def.dano));
    } else {
      golpe('espada'); AM.som('espada');
      AM.criaturas.ataque(AM.atrib.dano(def.dano), 22, true);
      if (ob && ob.ferr === 'mao') AM.bater(a.x, a.y, 1);
    }
    return;
  }
  if (f === 'enxada') {
    golpe('enxada');
    if (obId === AM.OB.MURCHA) { AM.m.setOb(a.x, a.y, 0); AM.mapa.plantas.delete(AM.m.idx(a.x, a.y)); }
    else if (!obId && AM.aravel(ch) && !AM.criaturas.ocupado(a.x, a.y)) { AM.m.setCh(a.x, a.y, AM.CH.ARADA); AM.som('enxada'); AM.ev.emit('arou'); AM.fx.terra(a.x, a.y); }
    else AM.som('erro');
    return;
  }
  if (f === 'regador') {
    golpe('regador');
    if (AM.ehAgua(ch) || obId === AM.OB.POCO) { s.carga = def.cargaMax; AM.som('agua'); AM.ui.aviso('Regador cheio!'); AM.ui.atualizarHotbar(); return; }
    if (!s.carga) { AM.bot.contexto('regadorVazio'); AM.som('erro'); return; }
    if (ch === AM.CH.ARADA || ch === AM.CH.MOLHADA || (AM.m.planta(a.x, a.y))) {
      s.carga--; AM.som('agua'); AM.fx.agua(a.x, a.y);
      if (ch === AM.CH.ARADA) AM.m.setCh(a.x, a.y, AM.CH.MOLHADA);
      const p = AM.m.planta(a.x, a.y); if (p) p.regada = true;
      AM.ev.emit('regou'); AM.ui.atualizarHotbar();
    }
    return;
  }
  if (f === 'machado' || f === 'picareta') {
    golpe(f);
    if (ob && ob.ferr === f && !ob.fixo) AM.bater(a.x, a.y, 1 + (Math.random() < AM.jog.atrib.forca * .05 ? 1 : 0));
    else if (ob && ob.ferr === 'mao') AM.bater(a.x, a.y, 1);
    else if (f === 'picareta' && (ch === AM.CH.ARADA || ch === AM.CH.MOLHADA) && !AM.m.planta(a.x, a.y)) AM.m.setCh(a.x, a.y, AM.CH.TERRA);
    else if (f === 'picareta' && [AM.CH.P_MADEIRA, AM.CH.P_PEDRA, AM.CH.P_ESTUFA, AM.CH.CAMINHO].includes(ch) && !obId && AM.mapa.id === 'mundo' && !AM.naVila(a.x, a.y)) {
      AM.m.setCh(a.x, a.y, AM.CH.TERRA); AM.inv.dar({ [AM.CH.P_MADEIRA]: 'piso_madeira', [AM.CH.P_PEDRA]: 'piso_pedra', [AM.CH.P_ESTUFA]: 'piso_estufa', [AM.CH.CAMINHO]: 'caminho' }[ch]);
    } else { AM.criaturas.ataque(3, 16, false); AM.som('erro'); }
    return;
  }
  if (f === 'vara') { golpe('vara'); AM.lancarVara(a); return; }
  if (f === 'cantil') {
    if (AM.ehAgua(ch) || obId === AM.OB.POCO) { s.carga = def.cargaMax; AM.som('agua'); AM.ui.aviso('Cantil cheio!'); AM.ui.atualizarHotbar(); return; }
    if (s.carga > 0) { s.carga--; AM.comer('agua', false); AM.ui.atualizarHotbar(); } else AM.ui.aviso('Cantil vazio. Encha num rio, lago ou poço.');
    return;
  }
  if (def.cat === 'semente') { AM.plantar(a, s, def); return; }
  if (def.obj) { AM.colocar(a, s, def); return; }
  if (def.piso != null) {
    if (obId || AM.ehAgua(ch) || AM.mapa.id !== 'mundo' || AM.naVila(a.x, a.y) || ch === def.piso) { AM.som('erro'); return; }
    AM.m.setCh(a.x, a.y, def.piso); AM.inv.remover(s.id, 1); AM.som('colocar');
    return;
  }
  if (def.veiculo) { AM.criaturas.colocarVeiculo(def.veiculo, a); return; }
  if (def.comida) { AM.comer(s.id); return; }
  if (def.cat === 'cosmetico') { j.faixa = !j.faixa; AM.ui.aviso(j.faixa ? 'Faixa ninja equipada! Aperte J para o jutsu.' : 'Faixa guardada.'); return; }
  golpe('soco'); AM.criaturas.ataque(4, 18, false);
};

// em sala com construções privadas, só o dono mexe dentro da construção dele
AM.podeMexer = function (x, y) {
  if (!AM.rede.conectado() || AM.E.partida.construcoesCompartilhadas !== false || AM.mapa.id !== 'mundo') return true;
  const c = AM.E.construcoes.find(k => x >= k.x && x < k.x + k.w && y >= k.y && y < k.y + k.h);
  if (!c || c.dono === AM.jog.nome) return true;
  AM.ui.aviso(`Essa construção é do(a) ${c.dono} (construções privadas).`);
  return false;
};

AM.naVila = (x, y) => AM.mapa.id === 'mundo' && Math.hypot(x - AM.mapa.vila.x, y - AM.mapa.vila.y) < 17;

// golpe num objeto (árvore, pedra, móvel...)
AM.bater = function (x, y, forca) {
  const id = AM.m.ob(x, y), ob = AM.OBJ[id];
  if (!ob || ob.fixo || !AM.podeMexer(x, y)) return;
  const info = AM.m.info(x, y) || {};
  const dano = (info.dano || 0) + forca;
  AM.som(ob.ferr === 'picareta' ? 'picareta' : ob.ferr === 'machado' ? 'machado' : 'mato');
  AM.fx.lascas(x, y, ob.ferr === 'picareta' ? '#9a9aa6' : ob.alto ? '#6b4226' : '#5aa548');
  if (dano < ob.vida) { AM.m.setInfo(x, y, Object.assign(info, { dano, tremer: .25 })); return; }
  // quebrou: itens, xp e o que fica no lugar
  if (ob.bau && info.itens && info.itens.some(Boolean)) { AM.ui.aviso('Esvazie o baú antes de desmontar.'); AM.m.setInfo(x, y, Object.assign(info, { dano: 0 })); return; }
  const sorte = AM.atrib.sorte();
  for (const [it, a, b] of ob.drop || []) {
    let q = AM.u.inteiro(a, b);
    if (q > 0 && Math.random() < sorte * .04) q++;
    if (q > 0) AM.criaturas.soltarItem(it, q, x * 16 + 8, y * 16 + 10);
  }
  if (ob.ferr === 'machado' && ob.alto) AM.sis.ganharXP(3, 'coleta');
  if (ob.ferr === 'picareta') AM.sis.ganharXP(ob.vida >= 4 ? 4 : 2, 'coleta');
  AM.ev.emit('quebrou', { obj: ob.chave });
  if (info.itens && info.itens.length) info.itens.forEach(it => it && AM.criaturas.soltarItem(it.id, it.qtd, x * 16 + 8, y * 16 + 10));
  AM.m.setOb(x, y, ob.toco ? AM.OB.TOCO : 0, null);
  if (AM.mapa.construcoes) AM.construcao.verificarRuina(x, y);
};

// ---------- plantar e colocar ----------
AM.plantar = function (a, s, def) {
  const ch = AM.m.ch(a.x, a.y);
  if (def.muda) {
    if (AM.m.ob(a.x, a.y) || ![AM.CH.GRAMA, AM.CH.MATA, AM.CH.TERRA].includes(ch)) { AM.som('erro'); return; }
    AM.m.setOb(a.x, a.y, AM.OB[def.muda.toUpperCase()], { dias: 0 }); AM.inv.remover(s.id, 1); AM.som('plantar');
    return;
  }
  const planta = ch === AM.CH.ARADA || ch === AM.CH.MOLHADA || ch === AM.CH.P_ESTUFA;
  if (!planta || AM.m.planta(a.x, a.y) || AM.m.ob(a.x, a.y)) {
    AM.ui.aviso(planta ? 'Já tem algo plantado aqui.' : 'Are a terra com a enxada antes de plantar.');
    AM.som('erro'); return;
  }
  const cu = AM.CULTURAS[def.cultura], estufa = AM.sis.naEstufa(a.x, a.y);
  if (!estufa && !cu.estacoes.includes(AM.tempo.estacao)) {
    AM.ui.aviso(`${cu.nome} não cresce na estação ${AM.ESTACOES[AM.tempo.estacao].toLowerCase()} ao ar livre. Tente numa estufa.`);
    AM.som('erro'); return;
  }
  AM.mapa.plantas.set(AM.m.idx(a.x, a.y), { tipo: def.cultura, idade: 0, regada: ch === AM.CH.MOLHADA, dono: AM.jog.nome });
  AM.inv.remover(s.id, 1); AM.som('plantar'); AM.ev.emit('plantou', { tipo: def.cultura });
  AM.rede && AM.rede.tile(a.x, a.y);
};

AM.colocar = function (a, s, def) {
  if (!AM.podeMexer(a.x, a.y)) return;
  const ch = AM.m.ch(a.x, a.y);
  if (AM.m.ob(a.x, a.y) || AM.ehAgua(ch) || AM.m.planta(a.x, a.y) || AM.criaturas.ocupado(a.x, a.y) || AM.naVila(a.x, a.y) || AM.mapa.id !== 'mundo') {
    AM.ui.aviso(AM.naVila(a.x, a.y) ? 'Não dá para construir dentro da vila.' : 'Não dá para colocar aqui.'); AM.som('erro'); return;
  }
  const tx = Math.floor(AM.jog.x / 16), ty = Math.floor((AM.jog.y - 4) / 16);
  if (AM.OBJ[def.obj].solido && a.x === tx && a.y === ty) { AM.som('erro'); return; }
  const info = def.obj === AM.OB.BAU || def.obj === AM.OB.CAIXA_VENDA || def.obj === AM.OB.BALCAO ? { itens: [] } : def.obj === AM.OB.COLMEIA ? { dias: 0 } : undefined;
  AM.m.setOb(a.x, a.y, def.obj, info);
  AM.inv.remover(s.id, 1); AM.som('colocar');
  AM.ev.emit('colocou', { obj: def.id });
};

// ---------- comer e beber ----------
AM.comer = function (id, gastar = true) {
  const def = AM.ITENS[id], c = def && def.comida;
  if (!c) return false;
  const j = AM.jog;
  if (j.fome >= 99 && c.fome > 0 && !c.sede && !c.vida) { AM.ui.aviso('Você está de barriga cheia.'); return false; }
  if (gastar && !AM.inv.remover(id, 1)) return false;
  j.fome = limitar(j.fome + c.fome, 0, 100);
  j.sede = limitar(j.sede + c.sede, 0, 100);
  j.vida = limitar(j.vida + c.vida, 0, j.vidaMax);
  AM.som(def.cat === 'bebida' || id === 'agua' ? 'beber' : 'comer');
  AM.fx.texto(j.x, j.y - 26, c.vida > 0 ? `+${c.vida} vida` : c.sede > c.fome ? `+${c.sede} sede` : `+${c.fome} fome`, '#7cf07c');
  AM.ev.emit(def.cat === 'bebida' || id === 'agua' ? 'bebeu' : 'comeu', { id });
  return true;
};

// ---------- pesca ----------
AM.lancarVara = function (a) {
  if (!AM.ehAgua(AM.m.ch(a.x, a.y))) { AM.ui.aviso('Fique virado para a água para pescar.'); return; }
  AM.jog.pesca = { x: a.x * 16 + 8, y: a.y * 16 + 8, espera: AM.u.aleat(1.5, 4.5), mordeu: 0 };
  AM.som('agua');
};
AM.puxarPeixe = function () {
  const p = AM.jog.pesca;
  AM.jog.pesca = null;
  if (p.mordeu > 0) {
    const dourado = Math.random() < .05 + AM.atrib.sorte() * .025;
    AM.inv.dar(dourado ? 'peixe_dourado' : 'peixe');
    AM.sis.ganharXP(dourado ? 12 : 5, 'pesca');
    AM.som('colher'); AM.ev.emit('pescou', { dourado });
    if (dourado) AM.ui.aviso('Um peixe dourado! A Sorte está do seu lado.');
  } else AM.ui.aviso(p.espera > 0 ? 'Puxou cedo demais.' : 'O peixe escapou!');
};
AM.atualizarPesca = function (dt) {
  const p = AM.jog.pesca;
  if (!p) return;
  if (p.mordeu > 0) { p.mordeu -= dt; if (p.mordeu <= 0) { AM.jog.pesca = null; AM.ui.aviso('O peixe escapou! Aperte usar quando aparecer o "!".'); } return; }
  p.espera -= dt;
  if (p.espera <= 0) { p.mordeu = .8 + AM.jog.atrib.agilidade * .05; AM.som('pop'); AM.fx.texto(AM.jog.x, AM.jog.y - 30, '!', '#ffd23f'); }
  if (AM.jog.andando) AM.jog.pesca = null;
};

// ---------- interação (F / clique direito) ----------
AM.interagir = function () {
  const j = AM.jog;
  if (j.pesca) { AM.puxarPeixe(); return; }
  if (j.montaria) { AM.criaturas.desmontar(); return; }
  // pessoas, animais e veículos por perto têm prioridade
  const e = AM.criaturas.maisPerto(j.x, j.y, 22);
  if (e) { AM.criaturas.interagirCom(e); return; }
  const a = AM.alvo(), id = AM.m.ob(a.x, a.y), ob = AM.OBJ[id], info = AM.m.info(a.x, a.y);
  const p = AM.m.planta(a.x, a.y);
  if (p) { AM.sis.colher(a.x, a.y); return; }
  if (ob && id) {
    if (ob.bau) return AM.ui.abrir('bau', { x: a.x, y: a.y, titulo: 'Baú' });
    if (ob.venda) return AM.ui.abrir('bau', { x: a.x, y: a.y, titulo: 'Caixa de vendas', venda: true });
    if (ob.balcao) return AM.ui.abrir('bau', { x: a.x, y: a.y, titulo: 'Balcão da sua loja', balcao: true });
    if (ob.cama) return AM.ui.abrir('dormir', { x: a.x, y: a.y });
    if (ob.estacao) return AM.ui.abrir('criar', { estacao: ob.estacao });
    if (ob.quadro) return AM.ui.abrir('quadro');
    if (ob.cocho) {
      const feno = (info && info.feno) || 0;
      if (feno >= 10) { AM.ui.aviso('O cocho está cheio (10 porções).'); return; }
      const poe = Math.min(10 - feno, AM.inv.contar('feno'));
      if (poe > 0) { AM.inv.remover('feno', poe); AM.m.setInfo(a.x, a.y, { feno: feno + poe }); AM.som('colocar'); AM.ui.aviso(`Cocho com ${feno + poe} porções de feno. Cada animal come uma por dia.`); }
      else AM.ui.aviso(`O cocho tem ${feno} porções. Precisa de feno: corte capim ou compre no mercado ou no estábulo.`);
      return;
    }
    if (ob.colmeia) {
      if (info && info.dias >= 3) { AM.m.setInfo(a.x, a.y, { dias: 0 }); AM.inv.dar('mel'); AM.som('colher'); AM.sis.ganharXP(4, 'coleta'); }
      else AM.ui.aviso(AM.tempo.estacao === 3 ? 'As abelhas estão hibernando no inverno.' : 'As abelhas ainda estão fazendo mel.');
      return;
    }
    if (ob.chave === 'arbusto') {
      if (info && info.fruta && AM.tempo.estacao !== 3) { AM.m.setInfo(a.x, a.y, { fruta: false, dias: 0 }); AM.inv.dar('frutinha', AM.u.inteiro(2, 3)); AM.som('colher'); }
      else AM.ui.aviso('Ainda não tem frutinhas.');
      return;
    }
    if (ob.entrada) return AM.masmorra.entrar(info.masmorra);
    if (ob.saida) return AM.masmorra.sair();
    if (ob.tesouro) return AM.masmorra.abrirTesouro(a.x, a.y);
    if (ob.agua) { AM.comer('agua', false); return; }
    if (id === AM.OB.PLACA) { AM.ui.aviso((info && info.texto) || 'Uma placa.'); return; }
    if (id === AM.OB.BARRACA) { AM.ui.abrir('loja', { loja: 'mercado' }); return; }
    if (ob.ferr === 'mao') { AM.bater(a.x, a.y, 9); return; }
  }
  if (AM.ehAgua(AM.m.ch(a.x, a.y))) { AM.comer('agua', false); return; }
  // comer o que estiver na mão
  const s = AM.inv.selecionado();
  if (s && AM.ITENS[s.id].comida) AM.comer(s.id);
};
