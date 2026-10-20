// Masmorras: salas ligadas por corredores, criaturas do tema, tesouros,
// minérios (na mina) e um chefe na sala mais distante.
'use strict';

AM.masmorra = (() => {
  function gerar(def) {
    const W = 64, H = 64, N = W * H, r = sorteador(AM.E.semente + AM.tempo.dia * 17 + def.id.length * 101);
    const mapa = { id: 'masmorra:' + def.id, masmorra: def.id, nivel: def.nivel, w: W, h: H, chao: new Uint8Array(N), obj: new Uint8Array(N).fill(AM.OB.ROCHA), info: new Map(), plantas: new Map(), cores: def };
    const I = (x, y) => y * W + x;
    const salas = [];
    for (let t = 0; t < 400 && salas.length < 11; t++) {
      const w = 6 + Math.floor(r() * 6), h = 5 + Math.floor(r() * 5), x = 2 + Math.floor(r() * (W - w - 4)), y = 2 + Math.floor(r() * (H - h - 4));
      if (salas.some(s => x < s.x + s.w + 2 && x + w + 2 > s.x && y < s.y + s.h + 2 && y + h + 2 > s.y)) continue;
      salas.push({ x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) });
    }
    const cavar = (x, y) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) { mapa.obj[I(x, y)] = 0; mapa.chao[I(x, y)] = AM.CH.P_MASMORRA; } };
    salas.forEach(s => { for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) cavar(x, y); });
    // liga em sequência (ordenadas por distância da primeira)
    const ini = salas[0];
    salas.sort((a, b) => Math.hypot(a.cx - ini.cx, a.cy - ini.cy) - Math.hypot(b.cx - ini.cx, b.cy - ini.cy));
    for (let k = 1; k < salas.length; k++) {
      const a = salas[k - 1], b = salas[k];
      for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++) { cavar(x, a.cy); cavar(x, a.cy + 1); }
      for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++) { cavar(b.cx, y); cavar(b.cx + 1, y); }
    }
    const entrada = salas[0], chefe = salas[salas.length - 1];
    mapa.obj[I(entrada.cx, entrada.cy)] = AM.OB.SAIDA;
    mapa.entrada = { x: entrada.cx, y: entrada.cy + 1 };
    mapa.salaChefe = chefe;
    // tochas nas paredes, tesouros e minérios
    salas.forEach((s, k) => {
      for (const [x, y] of [[s.x, s.y], [s.x + s.w - 1, s.y + s.h - 1]]) if (!mapa.obj[I(x, y)]) mapa.obj[I(x, y)] = AM.OB.TOCHA;
      if (k > 0 && k < salas.length - 1 && r() < .45) { const x = s.x + 1 + Math.floor(r() * (s.w - 2)), y = s.y + 1; if (!mapa.obj[I(x, y)]) { mapa.obj[I(x, y)] = AM.OB.TESOURO; mapa.info.set(I(x, y), {}); } }
      if (def.minerios || r() < .4) for (let n = 0; n < (def.minerios ? 5 : 2); n++) {
        const x = s.x + 1 + Math.floor(r() * (s.w - 2)), y = s.y + 1 + Math.floor(r() * (s.h - 2));
        if (!mapa.obj[I(x, y)] && Math.hypot(x - entrada.cx, y - entrada.cy) > 3) { const q = r(); mapa.obj[I(x, y)] = q < .5 ? AM.OB.PEDRA : q < .8 ? AM.OB.FERRO : q < .93 ? AM.OB.OURO : AM.OB.CRISTAL; }
      }
    });
    mapa.obj[I(chefe.cx, chefe.y)] = AM.OB.TESOURO; mapa.info.set(I(chefe.cx, chefe.y), { chefe: true });
    return mapa;
  }

  function entrar(id) {
    const def = AM.MASMORRAS.find(d => d.id === id);
    if (!def) return;
    const j = AM.jog;
    AM.E.voltaMundo = { x: j.x, y: j.y + 18 };
    if (j.montaria) AM.criaturas.desmontar();
    const mapa = gerar(def);
    AM.masmorraCores = def;
    AM.mapa = mapa;
    j.x = mapa.entrada.x * 16 + 8; j.y = mapa.entrada.y * 16 + 14;
    AM.criaturas.carregarMapa();
    // criaturas em cada sala (menos na primeira) e o chefe
    const r = sorteador(Date.now() % 100000);
    const salas = [];
    for (let y = 0; y < mapa.h; y++) for (let x = 0; x < mapa.w; x++) if (mapa.chao[y * mapa.w + x] && !mapa.obj[y * mapa.w + x] && Math.hypot(x - mapa.entrada.x, y - mapa.entrada.y) > 10 && r() < .018) salas.push({ x, y });
    salas.forEach(p => AM.criaturas.spawnMob(AM.u.escolha(def.mobs), p.x * 16 + 8, p.y * 16 + 12));
    const derrotado = (AM.E.chefes || {})[id];
    const sc = mapa.salaChefe;
    if (!derrotado || AM.tempo.dia - derrotado >= 7) AM.criaturas.spawnMob(def.chefe, sc.cx * 16 + 8, (sc.cy + 1) * 16 + 12).chefeDe = id;
    AM.render.sujarTudo();
    AM.som('porta');
    AM.ui.aviso(`${def.nome} · nível ${def.nivel}`, 'roxo');
    if (!AM.E.estat['viu_' + id]) { AM.E.estat['viu_' + id] = true; AM.sis.ganharXP(30, 'exploracao'); AM.bot.falarDe('masmorra'); }
    AM.ev.emit('entrou_masmorra', { id });
    AM.som && Som.trilha && AM.opc.musica && Som.trilha('masmorra');
  }

  function sair(silencioso) {
    if (AM.mapa.id === 'mundo') return;
    AM.mapa = AM.mundo;
    AM.masmorraCores = null;
    const v = AM.E.voltaMundo || AM.mundo.spawn;
    AM.jog.x = v.x; AM.jog.y = v.y;
    AM.criaturas.carregarMapa();
    AM.render.sujarTudo();
    if (!silencioso) { AM.som('porta'); AM.ui.aviso('De volta à superfície.'); }
    AM.jogo.trilhaDoMomento();
  }

  function abrirTesouro(x, y) {
    const info = AM.m.info(x, y) || {}, def = AM.MASMORRAS.find(d => d.id === AM.mapa.masmorra);
    if (info.chefe && AM.ents.some(e => e.classe === 'mob' && AM.MOBS[e.tipo].chefe)) { AM.ui.aviso('O baú está selado enquanto o chefe estiver de pé!'); return; }
    const n = def.nivel, sorte = AM.atrib.sorte();
    const ouro = Math.round(AM.u.inteiro(20, 60) * n * (info.chefe ? 4 : 1) * (1 + sorte * .05));
    AM.sis.ganharOuro(ouro);
    AM.fx.texto(x * 16 + 8, y * 16 - 8, `+${ouro} ouro`, '#ffd23f');
    const premios = [['pocao', .5], ['barra_ferro', .5], ['cristal', .25 + n * .05], ['barra_ouro', .2 + n * .05], ['flecha', .6], ['tecido', .15], ['faixa_ninja', .05], ['semente_melancia', .2]];
    for (const [it, p] of premios) if (Math.random() < p + sorte * .02) AM.criaturas.soltarItem(it, it === 'flecha' ? 8 : 1, x * 16 + 8, y * 16 + 20);
    AM.m.setOb(x, y, 0, null);
    AM.som('moeda'); AM.fx.brilhos(x * 16 + 8, y * 16 + 6, 14);
    AM.ev.emit('tesouro');
  }

  function chefeDerrotado(tipo) {
    const id = AM.mapa.masmorra;
    (AM.E.chefes ||= {})[id] = AM.tempo.dia;
    AM.bot.falarDe('chefe');
    AM.ui.aviso(`${AM.MOBS[tipo].nome} derrotado! O baú do chefe foi liberado.`, 'ouro');
    if (tipo === 'rei_esqueleto') setTimeout(() => AM.bot.falarDe('cristal'), 4000);
  }

  return { entrar, sair, abrirTesouro, chefeDerrotado };
})();
