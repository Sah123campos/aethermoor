// Mapa: geração do mundo aberto (biomas, rios, estradas, vila, fazenda e
// entradas das masmorras) e as operações de leitura e escrita nos tiles.
'use strict';

AM.BIOMAS = ['planicie', 'floresta', 'pantano', 'deserto', 'tundra', 'montanha', 'agua', 'vila'];
AM.NOME_BIOMA = { planicie: 'Planície', floresta: 'Floresta', pantano: 'Pântano', deserto: 'Deserto', tundra: 'Tundra', montanha: 'Montanhas', agua: 'Água', vila: 'Vila de Aethermoor' };
AM.MUNDO_W = 192; AM.MUNDO_H = 192;

// ---------- operações no mapa atual (AM.mapa) ----------
AM.m = {
  idx: (x, y) => y * AM.mapa.w + x,
  dentro: (x, y) => x >= 0 && y >= 0 && x < AM.mapa.w && y < AM.mapa.h,
  ch(x, y) { return AM.m.dentro(x, y) ? AM.mapa.chao[y * AM.mapa.w + x] : AM.CH.FUNDA; },
  ob(x, y) { return AM.m.dentro(x, y) ? AM.mapa.obj[y * AM.mapa.w + x] : 0; },
  info(x, y) { return AM.mapa.info.get(y * AM.mapa.w + x); },
  setInfo(x, y, v) { const i = y * AM.mapa.w + x; if (v == null) AM.mapa.info.delete(i); else AM.mapa.info.set(i, v); AM.rede && AM.rede.tile(x, y); },
  planta(x, y) { return AM.mapa.plantas.get(y * AM.mapa.w + x); },
  setCh(x, y, v) {
    if (!AM.m.dentro(x, y)) return;
    AM.mapa.chao[y * AM.mapa.w + x] = v;
    AM.render && AM.render.sujar(x, y);
    AM.rede && AM.rede.tile(x, y);
  },
  setOb(x, y, v, info) {
    if (!AM.m.dentro(x, y)) return;
    const i = y * AM.mapa.w + x;
    AM.mapa.obj[i] = v;
    if (info !== undefined) AM.m.setInfo(x, y, info); else if (!v) AM.mapa.info.delete(i);
    AM.rede && AM.rede.tile(x, y);
  },
  bioma(x, y) { return AM.mapa.bioma ? AM.BIOMAS[AM.mapa.bioma[y * AM.mapa.w + x]] || 'planicie' : 'masmorra'; },
  // bloqueia a passagem? (voando ignora tudo)
  solido(x, y) {
    if (!AM.m.dentro(x, y)) return true;
    const c = AM.m.ch(x, y);
    if (AM.ehAgua(c) && !(AM.tempo && AM.tempo.estacao === 3 && c === AM.CH.AGUA && AM.mapa.id === 'mundo')) return true;
    const o = AM.OBJ[AM.m.ob(x, y)];
    return !!(o && o.solido);
  },
  // água congelada no inverno (dá para andar por cima do rio raso)
  congelado(x, y) { return AM.tempo && AM.tempo.estacao === 3 && AM.mapa.id === 'mundo' && AM.m.ch(x, y) === AM.CH.AGUA; },
  variante(x, y) { let n = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; n = Math.imul(n ^ (n >>> 13), 1274126177); return (n ^ (n >>> 16)) >>> 0; },
};

// ---------- geração ----------
AM.gerarMundo = function (semente) {
  const W = AM.MUNDO_W, H = AM.MUNDO_H, N = W * H;
  const mapa = { id: 'mundo', w: W, h: H, chao: new Uint8Array(N), obj: new Uint8Array(N), bioma: new Uint8Array(N), info: new Map(), plantas: new Map() };
  const r = sorteador(semente);
  const nElev = AM.u.ruido2D(semente + 1), nUmid = AM.u.ruido2D(semente + 2), nTemp = AM.u.ruido2D(semente + 3), nRio = AM.u.ruido2D(semente + 4);
  const CX = W >> 1, CY = H >> 1;
  const I = (x, y) => y * W + x;
  const B = Object.fromEntries(AM.BIOMAS.map((b, i) => [b, i]));
  const CH = AM.CH, OB = AM.OB;

  // 1. biomas e terreno
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = I(x, y), d = Math.hypot(x - CX, y - CY);
    const borda = Math.min(x, y, W - 1 - x, H - 1 - y);
    let elev = nElev(x / 52, y / 52), umid = nUmid(x / 44, y / 44);
    const temp = (y / H) * 2 - 1 + nTemp(x / 60, y / 60) * .45;
    if (d < 26) { elev *= d / 26; umid *= .6; }          // perto da vila é plano
    if (borda < 6) elev = -1;                              // o mundo é cercado de água
    let b;
    if (d < 15) b = B.vila;
    else if (elev > .5) b = B.montanha;
    else if (temp < -.5) b = B.tundra;
    else if (temp > .5 && umid < .15) b = B.deserto;
    else if (umid > .3 && elev < .1) b = B.pantano;
    else if (umid > .02) b = B.floresta;
    else b = B.planicie;
    const rio = Math.abs(nRio(x / 70, y / 70, 3)) < .028 && d > 18 && b !== B.montanha;
    if (elev < -.48 || rio || borda < 3) b = B.agua;
    mapa.bioma[i] = b;
    let c = CH.GRAMA;
    if (b === B.agua) c = elev < -.62 || borda < 3 ? CH.FUNDA : CH.AGUA;
    else if (b === B.montanha) c = CH.PEDRA;
    else if (b === B.tundra) c = CH.NEVE;
    else if (b === B.deserto) c = CH.AREIA;
    else if (b === B.pantano) c = r() < .5 ? CH.LAMA : CH.MATA;
    else if (b === B.floresta) c = CH.MATA;
    if (b === B.pantano && nElev(x / 9, y / 9) < -.35) c = CH.AGUA;
    mapa.chao[i] = c;
  }
  // praias de areia
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = I(x, y), c = mapa.chao[i];
    if (AM.ehAgua(c) || ![CH.GRAMA, CH.MATA].includes(c)) continue;
    if (AM.ehAgua(mapa.chao[i - 1]) || AM.ehAgua(mapa.chao[i + 1]) || AM.ehAgua(mapa.chao[i - W]) || AM.ehAgua(mapa.chao[i + W]))
      if (mapa.bioma[i] !== B.pantano && r() < .8) mapa.chao[i] = CH.AREIA;
  }

  // 2. objetos naturais
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = I(x, y), c = mapa.chao[i];
    if (AM.ehAgua(c)) continue;
    const b = AM.BIOMAS[mapa.bioma[i]], s = r();
    let o = 0;
    switch (b) {
      case 'planicie': o = s < .025 ? OB.ARVORE : s < .04 ? OB.PEDRA : s < .08 ? OB.FLOR : s < .14 ? OB.CAPIM : s < .147 ? OB.ARBUSTO : s < .152 ? OB.TRONCO : 0; break;
      case 'floresta': o = s < .2 ? (r() < .7 ? OB.ARVORE : OB.PINHEIRO) : s < .23 ? OB.ARBUSTO : s < .25 ? OB.COGUMELO : s < .27 ? OB.TRONCO : s < .3 ? OB.CAPIM : s < .31 ? OB.PEDRA : 0; break;
      case 'pantano': o = s < .05 ? OB.ARVORE : s < .14 ? OB.JUNCO : s < .17 ? OB.COGUMELO : s < .19 ? OB.TRONCO : 0; break;
      case 'deserto': o = s < .03 ? OB.CACTO : s < .045 ? OB.PEDRA : s < .05 ? OB.OURO : 0; break;
      case 'tundra': o = s < .1 ? OB.PINHEIRO : s < .13 ? OB.PEDRA : s < .14 ? OB.FERRO : s < .145 ? OB.CRISTAL : 0; break;
      case 'montanha': o = s < .16 ? OB.PEDRA : s < .2 ? OB.FERRO : s < .215 ? OB.OURO : s < .222 ? OB.CRISTAL : s < .24 ? OB.PINHEIRO : 0; break;
    }
    mapa.obj[i] = o;
    if (o === OB.ARBUSTO) mapa.info.set(i, { fruta: true });
  }

  // 3. estradas a partir da vila (pontes onde cruzam água)
  const pintarEstrada = (x0, y0, dx, dy, passos) => {
    let x = x0, y = y0;
    for (let k = 0; k < passos; k++) {
      for (let a = 0; a < 2; a++) {
        const px = x + (dy ? a : 0), py = y + (dx ? a : 0);
        if (px < 4 || py < 4 || px >= W - 4 || py >= H - 4) return;
        const i = I(px, py);
        mapa.chao[i] = AM.ehAgua(mapa.chao[i]) ? CH.PONTE : CH.CAMINHO;
        mapa.obj[i] = 0; mapa.info.delete(i);
      }
      x += dx; y += dy;
      if (k % 9 === 8 && r() < .5) { if (dx) y += r() < .5 ? 1 : -1; else x += r() < .5 ? 1 : -1; }
    }
  };
  pintarEstrada(CX + 9, CY - 1, 1, 0, 80); pintarEstrada(CX - 10, CY - 1, -1, 0, 80);
  pintarEstrada(CX - 1, CY - 8, 0, -1, 80); pintarEstrada(CX - 1, CY + 9, 0, 1, 80);

  // 4. a vila
  const limpar = (x, y, c = CH.GRAMA) => { const i = I(x, y); mapa.chao[i] = c; mapa.obj[i] = 0; mapa.info.delete(i); mapa.bioma[i] = B.vila; };
  for (let y = CY - 16; y <= CY + 16; y++) for (let x = CX - 18; x <= CX + 18; x++) if (Math.hypot(x - CX, y - CY) < 17) limpar(x, y, mapa.chao[I(x, y)] === CH.CAMINHO ? CH.CAMINHO : CH.GRAMA);
  for (let y = CY - 6; y <= CY + 7; y++) for (let x = CX - 8; x <= CX + 8; x++) limpar(x, y, CH.CAMINHO);
  const predio = (x0, y0, w, alt, telhadoCor, portaX) => {
    for (let y = y0; y < y0 + alt; y++) for (let x = x0; x < x0 + w; x++) {
      limpar(x, y, CH.P_PEDRA);
      const telhado = y < y0 + alt - 2;
      mapa.obj[I(x, y)] = telhado ? OB.TELHADO : (x === portaX && y === y0 + alt - 1 ? OB.PORTA_VILA : OB.PAREDE_VILA);
      if (telhado) mapa.info.set(I(x, y), { v: telhadoCor });
    }
    for (let x = x0; x < x0 + w; x += 3) if (x !== portaX) { mapa.obj[I(x, y0 + alt - 2)] = OB.PAREDE_VILA; }
  };
  predio(CX - 6, CY - 15, 13, 7, 3, CX);           // Guilda (telhado roxo)
  predio(CX + 10, CY - 6, 6, 5, 0, CX + 12);       // Forja
  predio(CX - 16, CY + 2, 6, 5, 1, CX - 13);       // Carpintaria
  predio(CX + 10, CY + 3, 7, 5, 2, CX + 13);       // Estábulo
  // barracas do mercado
  for (let k = 0; k < 3; k++) { const i = I(CX - 7 + k, CY - 3); mapa.obj[i] = OB.BARRACA; mapa.info.set(i, { v: k }); }
  mapa.obj[I(CX, CY)] = OB.POCO;
  mapa.obj[I(CX + 3, CY - 8)] = OB.QUADRO;
  for (const [x, y] of [[CX - 8, CY - 6], [CX + 8, CY - 6], [CX - 8, CY + 7], [CX + 8, CY + 7], [CX - 3, CY - 8], [CX + 6, CY - 8]]) mapa.obj[I(x, y)] = OB.LAMPIAO;
  for (const [x, y] of [[CX - 4, CY + 4], [CX + 4, CY + 4], [CX - 4, CY - 4], [CX + 4, CY - 4]]) mapa.obj[I(x, y)] = OB.VASO;
  mapa.obj[I(CX + 15, CY - 1)] = OB.FORNO; mapa.obj[I(CX - 12, CY + 8)] = OB.BANCADA;
  for (let x = CX + 9; x <= CX + 17; x++) { mapa.obj[I(x, CY + 9)] = OB.CERCA; mapa.obj[I(x, CY + 13)] = OB.CERCA; }
  for (let y = CY + 9; y <= CY + 13; y++) mapa.obj[I(CX + 17, y)] = OB.CERCA;
  mapa.obj[I(CX + 9, CY + 11)] = 0;

  // 5. a sua fazenda (a oeste da vila)
  const FX = CX - 30, FY = CY - 2;
  for (let y = FY - 7; y <= FY + 8; y++) for (let x = FX - 10; x <= FX + 10; x++) { const i = I(x, y); mapa.chao[i] = CH.GRAMA; mapa.obj[i] = 0; mapa.info.delete(i); mapa.bioma[i] = B.planicie; }
  for (let x = FX - 10; x <= FX + 10; x++) { mapa.obj[I(x, FY - 8)] = OB.CERCA; mapa.obj[I(x, FY + 9)] = OB.CERCA; }
  for (let y = FY - 8; y <= FY + 9; y++) { mapa.obj[I(FX - 11, y)] = OB.CERCA; if (Math.abs(y - FY) > 1) mapa.obj[I(FX + 11, y)] = OB.CERCA; }
  for (let x = FX + 11; x < CX - 10; x++) for (let a = 0; a < 2; a++) { const i = I(x, FY + a - 1); mapa.chao[i] = AM.ehAgua(mapa.chao[i]) ? CH.PONTE : CH.CAMINHO; mapa.obj[i] = 0; }
  mapa.obj[I(FX - 4, FY - 5)] = OB.CAMA;
  mapa.obj[I(FX - 2, FY - 5)] = OB.BAU; mapa.info.set(I(FX - 2, FY - 5), { itens: [] });
  mapa.obj[I(FX, FY - 3)] = OB.FOGUEIRA;
  mapa.obj[I(FX + 2, FY - 5)] = OB.CAIXA_VENDA; mapa.info.set(I(FX + 2, FY - 5), { itens: [] });
  mapa.obj[I(FX + 9, FY - 2)] = OB.PLACA; mapa.info.set(I(FX + 9, FY - 2), { texto: 'Sua fazenda' });
  for (let y = FY + 2; y <= FY + 5; y++) for (let x = FX - 6; x <= FX - 1; x++) mapa.chao[I(x, y)] = CH.ARADA;
  mapa.obj[I(FX + 6, FY + 5)] = OB.ARVORE; mapa.obj[I(FX - 8, FY + 6)] = OB.PEDRA; mapa.obj[I(FX + 7, FY - 6)] = OB.PEDRA;
  // um laguinho na fazenda para encher o regador
  for (let y = FY + 3; y <= FY + 6; y++) for (let x = FX + 3; x <= FX + 6; x++) if (Math.hypot(x - FX - 4.5, y - FY - 4.5) < 2.2) mapa.chao[I(x, y)] = CH.AGUA;
  mapa.spawn = { x: FX, y: FY - 1 };
  mapa.fazenda = { x: FX - 10, y: FY - 7, w: 21, h: 16 };
  mapa.vila = { x: CX, y: CY };

  // 6. entradas das masmorras, uma por bioma
  mapa.entradas = {};
  for (const m of AM.MASMORRAS) {
    let melhor = null;
    for (let tent = 0; tent < 4000 && !melhor; tent++) {
      const x = 8 + Math.floor(r() * (W - 16)), y = 8 + Math.floor(r() * (H - 16));
      const d = Math.hypot(x - CX, y - CY);
      if (d < 34 || d > 88 || AM.BIOMAS[mapa.bioma[I(x, y)]] !== m.bioma) continue;
      if (Object.values(mapa.entradas).some(e => Math.hypot(e.x - x, e.y - y) < 25)) continue;
      melhor = { x, y };
    }
    if (!melhor) { const a = AM.MASMORRAS.indexOf(m) * 1.3; melhor = { x: Math.round(CX + Math.cos(a) * 50), y: Math.round(CY + Math.sin(a) * 50) }; }
    for (let y = melhor.y - 2; y <= melhor.y + 2; y++) for (let x = melhor.x - 2; x <= melhor.x + 2; x++) {
      const i = I(x, y); mapa.obj[i] = 0; mapa.info.delete(i);
      if (AM.ehAgua(mapa.chao[i])) mapa.chao[i] = CH.PEDRA;
    }
    mapa.obj[I(melhor.x, melhor.y)] = OB.ENTRADA;
    mapa.info.set(I(melhor.x, melhor.y), { masmorra: m.id });
    mapa.entradas[m.id] = melhor;
  }
  return mapa;
};
