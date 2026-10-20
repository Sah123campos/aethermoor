// Seres do mapa: criaturas (com IA e chefes), animais e pets, moradores,
// projéteis, itens no chão, veículos e os clones do jutsu.
'use strict';

AM.criaturas = (() => {
  let proximoId = 1, tSpawn = 0;
  const ents = () => AM.ents;
  const novoId = () => proximoId++;
  const D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------- moradores da vila ----------
  function criarMoradores() {
    const { x: CX, y: CY } = AM.mapa.vila;
    const P = (tx, ty) => ({ x: tx * 16 + 8, y: ty * 16 + 12 });
    const npcs = [
      { nome: 'Iara', paleta: 'iara', loja: 'guilda', ...P(CX, CY - 7), fala: 'Bem-vindo à Guilda de Aventureiros!' },
      { nome: 'Bento', paleta: 'bento', loja: 'mercado', ...P(CX - 6, CY - 2), fala: 'Sementes fresquinhas da estação!' },
      { nome: 'Brasa', paleta: 'brasa', loja: 'ferreiro', ...P(CX + 12, CY - 1), fala: 'Precisa de aço? Veio ao lugar certo.' },
      { nome: 'Tião', paleta: 'tiao', loja: 'carpintaria', ...P(CX - 13, CY + 7), fala: 'Madeira boa e plantas de construção!' },
      { nome: 'Cida', paleta: 'cida', loja: 'estabulo', ...P(CX + 13, CY + 8), fala: 'Meus bichinhos procuram um lar.' },
    ].map(n => ({ classe: 'npc', id: novoId(), dir: 'baixo', fixo: true, casa: { x: n.x, y: n.y }, ...n }));
    const vagantes = ['morador1', 'morador2', 'morador3'].map((pal, i) => ({
      classe: 'npc', id: novoId(), nome: ['Lia', 'Caio', 'Nina'][i], paleta: pal, dir: 'baixo', ...P(CX - 3 + i * 3, CY + 3),
      casa: P(CX, CY), fala: ['Dizem que tem uma cripta no pântano...', 'O Doidobot chorou de novo hoje cedo.', 'Já registrou na Guilda? É de graça!'][i],
    }));
    ents().push(...npcs, ...vagantes);
    // gato da vila (domestica com peixe) e vacas do estábulo
    if (!AM.E.animais.some(a => a.tipo === 'gato')) ents().push({ classe: 'animal', id: novoId(), tipo: 'gato', selvagem: true, ...P(CX + 2, CY + 5), dir: 1 });
    for (let k = 0; k < 2; k++) ents().push({ classe: 'animal', id: novoId(), tipo: 'vaca', daVila: true, ...P(CX + 11 + k * 3, CY + 11), dir: 1, area: { x0: (CX + 10) * 16, x1: (CX + 16) * 16, y0: (CY + 10) * 16, y1: (CY + 13) * 16 } });
  }

  // ---------- montar a lista do mapa atual ----------
  function carregarMapa() {
    AM.ents = [];
    if (AM.mapa.id === 'mundo') {
      criarMoradores();
      AM.E.animais.forEach(a => { a.classe = 'animal'; a.id ||= novoId(); ents().push(a); });
    } else AM.E.animais.filter(a => a.pet && a.seguir).forEach(a => { a.x = AM.jog.x + 10; a.y = AM.jog.y; ents().push(a); });
    AM.E.veiculos.filter(v => v.mapa === AM.mapa.id).forEach(v => { v.classe = 'veiculo'; v.id ||= novoId(); ents().push(v); });
  }

  // ---------- consultas ----------
  function ocupado(tx, ty) {
    return ents().some(e => (e.classe === 'animal' || e.classe === 'npc' || e.classe === 'veiculo' || e.classe === 'mob') && Math.floor(e.x / 16) === tx && Math.floor((e.y - 4) / 16) === ty);
  }
  function maisPerto(x, y, raio) {
    let melhor = null, md = raio;
    for (const e of ents()) {
      if (!['npc', 'animal', 'veiculo'].includes(e.classe) && !(e.classe === 'mob' && AM.MOBS[e.tipo].domar)) continue;
      if (e.classe === 'mob' && !(AM.inv.selecionado() && AM.inv.selecionado().id === AM.MOBS[e.tipo].domar)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < md) { md = d; melhor = e; }
    }
    return melhor;
  }

  function interagirCom(e) {
    const j = AM.jog, s = AM.inv.selecionado();
    if (e.classe === 'npc') {
      e.dir = Math.abs(j.x - e.x) > Math.abs(j.y - e.y) ? (j.x < e.x ? 'esq' : 'dir') : (j.y < e.y ? 'cima' : 'baixo');
      if (e.loja === 'guilda') return AM.ui.abrir('guilda');
      if (e.loja) return AM.ui.abrir('loja', { loja: e.loja });
      AM.ui.aviso(`${e.nome}: ${e.fala}`);
      return;
    }
    if (e.classe === 'veiculo') return AM.ui.abrir('veiculo', { v: e });
    if (e.classe === 'mob') return domarLobo(e);
    if (e.classe === 'animal') {
      const def = AM.ANIMAIS[e.tipo];
      if (e.selvagem) {
        if (s && s.id === def.domar) {
          AM.inv.remover(s.id, 1);
          if (Math.random() < .5 + j.atrib.carisma * .08) { tornarPet(e); } else { AM.fx.coracao(e.x, e.y - 14); AM.ui.aviso(`O ${def.nome.toLowerCase()} gostou! Tente de novo.`); }
        } else AM.ui.aviso(`Um ${def.nome.toLowerCase()} sem dono. Talvez goste de ${AM.ITENS[def.domar].nome.toLowerCase()}.`);
        return;
      }
      if (e.daVila) { AM.ui.aviso('Uma vaca do estábulo da Dona Cida. Mu.'); return; }
      if (e.pronto && def.produto) {
        e.pronto = false; AM.inv.dar(def.produto, e.felicidade > 80 && Math.random() < .3 ? 2 : 1);
        AM.som('colher'); AM.sis.ganharXP(3, 'animal'); AM.ev.emit('produto', { id: def.produto });
        return;
      }
      if (def.pet) { e.seguir = !e.seguir; AM.ui.aviso(e.seguir ? `${e.nome} vai te seguir.` : `${e.nome} vai ficar aqui.`); AM.fx.coracao(e.x, e.y - 14); return; }
      if (!e.carinho) { e.carinho = true; e.felicidade = Math.min(100, (e.felicidade || 50) + 8); AM.fx.coracao(e.x, e.y - 14); AM.som('pop'); }
      else AM.ui.aviso(`${e.nome} está ${e.felicidade > 70 ? 'muito feliz' : e.felicidade > 40 ? 'tranquilo' : 'triste'}.${e.comeu ? '' : ' Ainda não comeu hoje.'}`);
    }
  }

  function tornarPet(e) {
    const def = AM.ANIMAIS[e.tipo];
    e.selvagem = false; e.pet = true; e.seguir = true; e.nome = e.tipo === 'gato' ? 'Bolinha' : 'Lobão'; e.felicidade = 80;
    AM.E.animais.push(e);
    AM.fx.coracao(e.x, e.y - 14); AM.som('nivel');
    AM.ui.aviso(`Você domesticou: ${def.nome}! Ele se chama ${e.nome}.`);
    AM.ev.emit('domou', { tipo: e.tipo }); AM.sis.ganharXP(20, 'domar');
  }
  function domarLobo(m) {
    const s = AM.inv.selecionado();
    if (!s || s.id !== 'carne_crua') return;
    AM.inv.remover('carne_crua', 1);
    m.domar = (m.domar || 0) + 1; m.calmo = 6;
    AM.fx.coracao(m.x, m.y - 16);
    if (m.domar >= Math.max(1, 3 - Math.floor(AM.jog.atrib.carisma / 3))) {
      AM.ents.splice(AM.ents.indexOf(m), 1);
      const lobo = { classe: 'animal', id: novoId(), tipo: 'lobo', x: m.x, y: m.y, dir: 1 };
      tornarPet(lobo); AM.ents.push(lobo);
    } else AM.ui.aviso('O lobo hesita... mais carne crua e ele confia em você.');
  }

  // ---------- ataque do jogador ----------
  const VET = { baixo: [0, 1], cima: [0, -1], esq: [-1, 0], dir: [1, 0] };
  function ataque(dano, alcance, corta) {
    const j = AM.jog, [vx, vy] = VET[j.dir];
    const cx = j.x + vx * 12, cy = j.y - 6 + vy * 12;
    let acertou = false;
    for (const e of [...ents()]) {
      if (e.classe !== 'mob') continue;
      if (Math.hypot(e.x - cx, e.y - 6 - cy) < alcance + (AM.MOBS[e.tipo].tam || 1) * 6) { ferirMob(e, dano, vx, vy); acertou = true; }
    }
    if (corta) {
      const tx = Math.floor(cx / 16), ty = Math.floor(cy / 16), ob = AM.OBJ[AM.m.ob(tx, ty)];
      if (ob && ob.chave === 'capim') AM.bater(tx, ty, 9);
    }
    if (acertou) AM.som('golpe');
  }
  function atirar(dano) {
    const j = AM.jog, ms = AM.input.mouse;
    let vx, vy;
    if (ms.dentro && performance.now() - ms.mexeu < 4000 && !AM.toqueAtivo) { vx = ms.mundoX - j.x; vy = ms.mundoY - (j.y - 8); }
    else [vx, vy] = VET[j.dir];
    const n = Math.hypot(vx, vy) || 1;
    ents().push({ classe: 'proj', id: novoId(), tipo: 'flecha', x: j.x, y: j.y - 8, vx: vx / n * 220, vy: vy / n * 220, dano, dono: 'jogador', vida: 1.4 });
  }

  function ferirMob(m, dano, kx = 0, ky = 0) {
    const d = AM.MOBS[m.tipo];
    const critico = Math.random() < AM.atrib.sorte() * .02;
    dano = Math.round(dano * (critico ? 2 : 1));
    m.vida -= dano; m.piscar = .2; m.calmo = 0;
    if (!d.chefe) { m.kx = kx * 140; m.ky = ky * 140; }
    AM.fx.texto(m.x, m.y - 18 * (d.tam || 1), (critico ? 'CRÍTICO ' : '') + dano, critico ? '#ffd23f' : '#ffffff');
    AM.fx.sangue(m.x, m.y - 6, d.cor);
    if (d.divide && m.vida < m.vidaMax * (m.divisoes ? .25 : .5) && (m.divisoes || 0) < 2) {
      m.divisoes = (m.divisoes || 0) + 1;
      for (let k = 0; k < 3; k++) spawnMob(d.divide, m.x + AM.u.aleat(-20, 20), m.y + AM.u.aleat(-12, 12));
    }
    if (m.vida <= 0) morrerMob(m);
  }

  function morrerMob(m) {
    const d = AM.MOBS[m.tipo], sorte = AM.atrib.sorte();
    const i = ents().indexOf(m); if (i >= 0) ents().splice(i, 1);
    AM.fx.fumaca(m.x, m.y - 6, 10);
    const ouro = Math.round(AM.u.inteiro(d.ouro[0], d.ouro[1]) * (1 + sorte * .05));
    if (ouro > 0) { AM.sis.ganharOuro(ouro); AM.fx.texto(m.x, m.y - 26, `+${ouro} ouro`, '#ffd23f'); AM.som('moeda'); }
    for (const [it, p, q] of d.loot) if (Math.random() < p + sorte * .03) soltarItem(it, q || 1, m.x, m.y);
    AM.sis.ganharXP(d.xp, 'combate');
    AM.ev.emit('matou', { tipo: m.tipo, chefe: !!d.chefe, masmorra: AM.mapa.masmorra });
    if (d.chefe) AM.masmorra.chefeDerrotado(m.tipo);
  }

  // ---------- jogador ferido ----------
  function ferirJogador(dano, ox, oy) {
    const j = AM.jog;
    if (j.invuln > 0 || AM.morto || j.montaria === 'balao') return;
    if (Math.random() < AM.atrib.esquiva()) { AM.fx.texto(j.x, j.y - 26, 'esquivou!', '#8ff0ff'); j.invuln = .3; return; }
    j.vida -= dano; j.invuln = .7;
    const n = Math.hypot(j.x - ox, j.y - oy) || 1;
    j.kx = (j.x - ox) / n * 160; j.ky = (j.y - oy) / n * 160;
    AM.fx.texto(j.x, j.y - 26, '-' + dano, '#ff5a5a'); AM.som('dano'); AM.render.tremer(2);
    if (j.vida <= 0) { j.vida = 0; AM.sis.morrer(); }
    else if (j.vida < j.vidaMax * .25) AM.bot.contexto('semVida');
  }

  // ---------- itens no chão ----------
  function soltarItem(id, qtd, x, y) {
    if (!AM.ITENS[id]) return;
    ents().push({ classe: 'drop', id: novoId(), item: id, qtd, x: x + AM.u.aleat(-4, 4), y: y + AM.u.aleat(-2, 4), vz: 60, z: 0, t: 0 });
  }

  // ---------- veículos ----------
  function colocarVeiculo(tipo, a) {
    if (AM.m.solido(a.x, a.y) || AM.mapa.id !== 'mundo') { AM.ui.aviso('Não dá para colocar aqui.'); return; }
    AM.inv.remover(tipo, 1);
    const v = { classe: 'veiculo', id: novoId(), tipo, x: a.x * 16 + 8, y: a.y * 16 + 12, mapa: AM.mapa.id, inv: tipo === 'carrinho' ? new Array(8).fill(null) : null };
    AM.E.veiculos.push(v); ents().push(v);
    AM.som('colocar'); AM.ui.aviso(`${AM.ITENS[tipo].nome} no chão. Aperte F perto para subir.`);
  }
  function montar(v) {
    const j = AM.jog;
    j.montaria = v.tipo; j.veiculo = v;
    j.x = v.x; j.y = v.y;
    ents().splice(ents().indexOf(v), 1);
    AM.som('pop');
    AM.bot.falarDe(v.tipo === 'balao' ? 'balao' : 'carrinho');
    AM.ev.emit('montou', { tipo: v.tipo });
  }
  function desmontar() {
    const j = AM.jog, v = j.veiculo;
    if (!v) { j.montaria = null; return; }
    if (j.montaria === 'balao' && AM.colide(j.x, j.y, 5)) { AM.ui.aviso('Não dá para pousar aqui. Procure um lugar livre.'); return; }
    v.x = j.x; v.y = j.y; v.mapa = AM.mapa.id;
    j.montaria = null; j.veiculo = null;
    ents().push(v);
    j.y += 10; if (AM.colide(j.x, j.y)) j.y -= 20;
    AM.som('pop');
  }

  // ---------- jutsu clone das sombras ----------
  let cdJutsu = 0;
  function jutsu() {
    if (!AM.jog.faixa) { AM.ui.aviso('Equipe uma faixa ninja para usar o jutsu (faça na bancada ou compre na Forja).'); return; }
    if (cdJutsu > 0) { AM.ui.aviso(`O chakra (ou o Wi-Fi) volta em ${Math.ceil(cdJutsu)}s.`); return; }
    cdJutsu = 20;
    for (const [dx, dy] of [[-18, 0], [18, 0], [0, 14]]) {
      ents().push({ classe: 'clone', id: novoId(), dx, dy, x: AM.jog.x + dx, y: AM.jog.y + dy, vida: 8 });
      AM.fx.fumaca(AM.jog.x + dx, AM.jog.y + dy - 8, 8);
    }
    AM.som('jutsu'); AM.bot.falarDe('jutsu'); AM.ev.emit('jutsu');
  }

  // ---------- criação de criaturas ----------
  function spawnMob(tipo, x, y) {
    const d = AM.MOBS[tipo], nivel = AM.mapa.nivel || 1, k = 1 + (nivel - 1) * .25;
    const m = { classe: 'mob', id: novoId(), tipo, x, y, vida: Math.round(d.vida * k), vidaMax: Math.round(d.vida * k), dano: Math.round(d.dano * k), dir: 1, t: Math.random() * 2, cdAtk: 0, piscar: 0, pulo: 0, kx: 0, ky: 0 };
    ents().push(m);
    return m;
  }
  function tentarSpawn() {
    const j = AM.jog, noite = AM.sis.ehNoite();
    const mobs = ents().filter(e => e.classe === 'mob').length;
    const limite = AM.mapa.id === 'mundo' ? (noite ? 9 : 4) : 0;
    if (mobs >= limite) return;
    const a = Math.random() * Math.PI * 2, dist = AM.u.aleat(13, 19) * 16;
    const x = j.x + Math.cos(a) * dist, y = j.y + Math.sin(a) * dist, tx = Math.floor(x / 16), ty = Math.floor(y / 16);
    if (!AM.m.dentro(tx, ty) || AM.m.solido(tx, ty) || AM.naVila(tx, ty) || AM.sis.naFazenda(tx, ty)) return;
    for (let yy = ty - 5; yy <= ty + 5; yy++) for (let xx = tx - 5; xx <= tx + 5; xx++) if (AM.OBJ[AM.m.ob(xx, yy)]?.luz) return;
    const bioma = AM.m.bioma(tx, ty), opcoes = (AM.MOBS_BIOMA[bioma] || []).filter(t => AM.MOBS[t].hora === 'qualquer' || noite);
    if (!opcoes.length) return;
    spawnMob(AM.u.escolha(opcoes), x, y);
  }

  // ---------- atualização ----------
  function atualizar(dt) {
    const j = AM.jog;
    cdJutsu = Math.max(0, cdJutsu - dt);
    if (AM.mapa.id === 'mundo' && (tSpawn -= dt) <= 0) { tSpawn = 2; tentarSpawn(); }
    const alvos = [j, ...ents().filter(e => e.classe === 'clone')];
    for (const e of [...ents()]) {
      switch (e.classe) {
        case 'mob': iaMob(e, dt, alvos); break;
        case 'animal': iaAnimal(e, dt); break;
        case 'npc': iaNpc(e, dt); break;
        case 'proj': moverProj(e, dt); break;
        case 'drop': moverDrop(e, dt); break;
        case 'clone':
          e.vida -= dt; e.x = j.x + e.dx; e.y = j.y + e.dy;
          if (e.vida <= 0) { AM.fx.fumaca(e.x, e.y - 8, 6); ents().splice(ents().indexOf(e), 1); }
          break;
      }
    }
  }

  function iaMob(m, dt, alvos) {
    const d = AM.MOBS[m.tipo], j = AM.jog;
    m.t += dt; m.piscar = Math.max(0, m.piscar - dt); m.cdAtk = Math.max(0, m.cdAtk - dt); m.calmo = Math.max(0, (m.calmo || 0) - dt);
    // empurrão
    if (m.kx || m.ky) { AM.mover(m, m.kx * dt, m.ky * dt, 4, d.ia === 'voa'); m.kx *= .85; m.ky *= .85; if (Math.abs(m.kx) + Math.abs(m.ky) < 5) m.kx = m.ky = 0; }
    // longe demais: some
    if (!d.chefe && D(m, j) > 34 * 16) { ents().splice(ents().indexOf(m), 1); return; }
    // criaturas da noite somem de dia (no mundo)
    if (AM.mapa.id === 'mundo' && d.hora === 'noite' && !AM.sis.ehNoite() && Math.random() < dt * .2) { AM.fx.fumaca(m.x, m.y - 6, 6); ents().splice(ents().indexOf(m), 1); return; }
    let alvo = alvos[0], md = D(m, alvo);
    for (const a of alvos) { const dd = D(m, a); if (dd < md) { md = dd; alvo = a; } }
    // o lobo de estimação ataca de volta
    const vel = d.vel * (d.chefe && m.vida < m.vidaMax * .4 ? 1.3 : 1);
    const ve = j.montaria === 'balao' || m.calmo > 0 ? 0 : (md < (d.chefe ? 14 : 8) * 16 ? 1 : 0);
    let dx = 0, dy = 0;
    if (ve) { dx = (alvo.x - m.x) / md; dy = (alvo.y - m.y) / md; }
    else { if (!m.vagar || m.t > m.vagar.ate) m.vagar = { dx: AM.u.aleat(-1, 1), dy: AM.u.aleat(-1, 1), ate: m.t + AM.u.aleat(1, 3) }; dx = m.vagar.dx * .4; dy = m.vagar.dy * .4; }
    if (dx) m.dir = dx < 0 ? -1 : 1;
    switch (d.ia) {
      case 'pula':
        m.cicloPulo = (m.cicloPulo || 0) + dt;
        if (m.cicloPulo > 1.1) { m.cicloPulo = 0; m.pulando = .45; }
        if (m.pulando > 0) { m.pulando -= dt; m.pulo = Math.sin((1 - m.pulando / .45) * Math.PI); AM.mover(m, dx * vel * 2.2 * dt, dy * vel * 2.2 * dt, 4); } else m.pulo = 0;
        break;
      case 'atira': {
        const longe = md > 4 * 16 ? 1 : md < 3 * 16 ? -1 : 0;
        AM.mover(m, dx * vel * longe * dt, dy * vel * longe * dt, 4);
        if (ve && m.cdAtk <= 0 && md < 8 * 16) {
          m.cdAtk = d.chefe ? 1.6 : 2.2;
          const angs = d.leque ? [-.5, -.25, 0, .25, .5] : [0];
          const base = Math.atan2(alvo.y - m.y, alvo.x - m.x);
          for (const a of angs) ents().push({ classe: 'proj', id: novoId(), tipo: 'osso', x: m.x, y: m.y - 10, vx: Math.cos(base + a) * 120, vy: Math.sin(base + a) * 120, dano: m.dano, dono: 'mob', vida: 2 });
          AM.som('arco');
        }
        break;
      }
      case 'investida':
        if (m.carga > 0) { m.carga -= dt; if (m.carga <= 0) { m.dash = .55; m.dashV = { x: dx, y: dy }; } }
        else if (m.dash > 0) { m.dash -= dt; AM.mover(m, m.dashV.x * vel * 4.5 * dt, m.dashV.y * vel * 4.5 * dt, 6); }
        else { AM.mover(m, dx * vel * dt, dy * vel * dt, 6); if (ve && m.cdAtk <= 0 && md < 7 * 16) { m.carga = .7; m.cdAtk = 3; } }
        break;
      case 'voa': m.x += (dx * vel + Math.sin(m.t * 5) * 20) * dt; m.y += (dy * vel + Math.cos(m.t * 4) * 14) * dt; break;
      default: AM.mover(m, dx * vel * dt, dy * vel * dt, 4);
    }
    if (d.invoca && ve && (m.tInvoca = (m.tInvoca || 0) + dt) > 9) {
      m.tInvoca = 0;
      for (let k = 0; k < 2; k++) spawnMob(d.invoca, m.x + AM.u.aleat(-30, 30), m.y + AM.u.aleat(-20, 20));
      AM.fx.fumaca(m.x, m.y - 10, 12);
    }
    // encostou: machuca
    const raio = 8 + (d.tam || 1) * 5;
    if (m.cdAtk <= 0 || d.ia !== 'atira') {
      if (Math.hypot(j.x - m.x, (j.y - 6) - (m.y - 6)) < raio && (m.atkToque || 0) <= 0 && (d.ia !== 'pula' || m.pulo < .5)) {
        ferirJogador(m.dano, m.x, m.y); m.atkToque = .9;
      }
    }
    m.atkToque = Math.max(0, (m.atkToque || 0) - dt);
  }

  function iaAnimal(a, dt) {
    const def = AM.ANIMAIS[a.tipo], j = AM.jog;
    a.t = (a.t || 0) + dt;
    let dx = 0, dy = 0, vel = def.vel;
    if (a.pet && a.seguir && !a.selvagem) {
      const dd = Math.hypot(j.x - a.x, j.y - a.y);
      if (dd > 22 * 16) { a.x = j.x - 12; a.y = j.y; }
      if (dd > 28) { dx = (j.x - a.x) / dd; dy = (j.y - a.y) / dd; vel = def.vel * (dd > 80 ? 1.6 : 1); }
      if (def.luta) {   // o lobo ataca criaturas próximas
        const alvo = ents().find(e => e.classe === 'mob' && Math.hypot(e.x - a.x, e.y - a.y) < 70);
        if (alvo) {
          const d2 = Math.hypot(alvo.x - a.x, alvo.y - a.y);
          dx = (alvo.x - a.x) / d2; dy = (alvo.y - a.y) / d2; vel = def.vel * 1.2;
          a.cdAtk = Math.max(0, (a.cdAtk || 0) - dt);
          if (d2 < 14 && a.cdAtk <= 0) { a.cdAtk = 1; ferirMob(alvo, 6 + AM.jog.nivel, dx, dy); }
        }
      }
    } else {
      if (!a.vagar || a.t > a.vagar.ate) a.vagar = { dx: AM.u.aleat(-1, 1), dy: AM.u.aleat(-1, 1), ate: a.t + AM.u.aleat(1.5, 4), parado: Math.random() < .45 };
      if (!a.vagar.parado) { dx = a.vagar.dx; dy = a.vagar.dy; }
      // fica dentro do abrigo ou da sua área
      const area = a.area || (a.casa != null && AM.construcao.area(a.casa));
      if (area) {
        if (a.x < area.x0 + 6) dx = Math.abs(dx); if (a.x > area.x1 - 6) dx = -Math.abs(dx);
        if (a.y < area.y0 + 10) dy = Math.abs(dy); if (a.y > area.y1 - 2) dy = -Math.abs(dy);
        vel *= .6;
      }
    }
    a.andando = !!(dx || dy);
    if (dx) a.dir = dx < 0 ? -1 : 1;
    const antes = { x: a.x, y: a.y };
    AM.mover(a, dx * vel * dt, dy * vel * dt, 4);
    if (a.vagar && a.x === antes.x && a.y === antes.y && a.andando) a.vagar.ate = 0;
  }

  function iaNpc(n, dt) {
    if (n.fixo) { if (Math.hypot(AM.jog.x - n.x, AM.jog.y - n.y) > 60) n.dir = 'baixo'; return; }
    n.t = (n.t || 0) + dt;
    if (!n.vagar || n.t > n.vagar.ate) n.vagar = { dx: AM.u.inteiro(-1, 1), dy: AM.u.inteiro(-1, 1), ate: n.t + AM.u.aleat(1, 3.5) };
    let { dx, dy } = n.vagar;
    if (Math.hypot(n.x - n.casa.x, n.y - n.casa.y) > 90) { dx = Math.sign(n.casa.x - n.x); dy = Math.sign(n.casa.y - n.y); }
    n.andando = !!(dx || dy);
    if (dx) n.dir = dx < 0 ? 'esq' : 'dir'; else if (dy) n.dir = dy < 0 ? 'cima' : 'baixo';
    AM.mover(n, dx * 22 * dt, dy * 22 * dt, 4);
  }

  function moverProj(p, dt) {
    p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    const tx = Math.floor(p.x / 16), ty = Math.floor((p.y + 6) / 16);
    const bate = AM.OBJ[AM.m.ob(tx, ty)]?.solido || !AM.m.dentro(tx, ty);
    let fim = p.vida <= 0 || bate;
    if (p.dono === 'jogador') {
      const m = ents().find(e => e.classe === 'mob' && Math.hypot(e.x - p.x, e.y - 8 - p.y) < 8 + (AM.MOBS[e.tipo].tam || 1) * 4);
      if (m) { ferirMob(m, p.dano, Math.sign(p.vx) * .5, Math.sign(p.vy) * .5); fim = true; }
    } else if (Math.hypot(AM.jog.x - p.x, AM.jog.y - 8 - p.y) < 8) { ferirJogador(p.dano, p.x, p.y); fim = true; }
    if (fim) ents().splice(ents().indexOf(p), 1);
  }

  function moverDrop(d, dt) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.vz -= 300 * dt; d.z = Math.max(0, d.z + d.vz * dt); if (d.z === 0) d.vz = 0; }
    const j = AM.jog, dist = Math.hypot(j.x - d.x, j.y - d.y);
    if (d.t > .5 && dist < 30) {
      d.x += (j.x - d.x) * Math.min(1, dt * 8); d.y += (j.y - d.y) * Math.min(1, dt * 8);
      if (dist < 8) {
        const sobra = AM.inv.adicionar(d.item, d.qtd);
        if (sobra < d.qtd) AM.som('pegar');
        if (sobra > 0) { d.qtd = sobra; d.t = -3; } else ents().splice(ents().indexOf(d), 1);
      }
    }
    if (d.t > 300) ents().splice(ents().indexOf(d), 1);
  }

  return { carregarMapa, ocupado, maisPerto, interagirCom, ataque, atirar, ferirMob, ferirJogador, soltarItem,
    colocarVeiculo, montar, desmontar, jutsu, spawnMob, atualizar, novoId };
})();
