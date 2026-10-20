// Desenho do jogo: câmera, chão em pedaços (chunks) guardados em cache,
// objetos e seres em ordem de profundidade, luz do dia e da noite, clima,
// partículas e textos flutuantes.
'use strict';

AM.render = (() => {
  const CH_T = 16;              // tiles por chunk
  const chunks = new Map(), sujos = new Set();
  let tela, ctx, buf, b, luz, l, escala = 3, camX = 0, camY = 0, tremor = 0;
  const chuva = [];

  function iniciar(canvas) {
    tela = canvas; ctx = tela.getContext('2d');
    buf = document.createElement('canvas'); b = buf.getContext('2d');
    luz = document.createElement('canvas'); l = luz.getContext('2d');
    ajustar();
    new ResizeObserver(ajustar).observe(tela.parentElement);
  }
  function ajustar() {
    const r = tela.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    AM.BASE = { perto: 170, normal: 216, longe: 270 }[AM.opc.zoom] || 216;
    const W = Math.max(200, Math.round(r.width * d)), H = Math.max(150, Math.round(r.height * d));
    tela.width = W; tela.height = H;
    escala = Math.max(1, Math.floor(Math.min(W, H) / AM.BASE));
    AM.VW = Math.ceil(W / escala); AM.VH = Math.ceil(H / escala);
    buf.width = luz.width = AM.VW; buf.height = luz.height = AM.VH;
  }

  const chaveChunk = (cx, cy) => `${AM.mapa.id}:${cx},${cy}`;
  function sujar(x, y) {
    sujos.add(chaveChunk(Math.floor(x / CH_T), Math.floor(y / CH_T)));
    // a borda da água depende dos vizinhos
    if (x % CH_T === 0) sujos.add(chaveChunk(Math.floor(x / CH_T) - 1, Math.floor(y / CH_T)));
    if (y % CH_T === 0) sujos.add(chaveChunk(Math.floor(x / CH_T), Math.floor(y / CH_T) - 1));
  }
  function sujarTudo() { chunks.clear(); sujos.clear(); }

  function desenharChunk(cx, cy) {
    const k = chaveChunk(cx, cy);
    let c = chunks.get(k);
    if (c && !sujos.has(k)) return c;
    if (!c) { c = document.createElement('canvas'); c.width = c.height = CH_T * 16; chunks.set(k, c); }
    sujos.delete(k);
    const x = c.getContext('2d'), est = AM.tempo.estacao, M = AM.m;
    for (let ty = 0; ty < CH_T; ty++) for (let tx = 0; tx < CH_T; tx++) {
      const wx = cx * CH_T + tx, wy = cy * CH_T + ty;
      let id = M.ch(wx, wy);
      if (M.congelado(wx, wy)) id = AM.CH.GELO;
      const v = M.variante(wx, wy) & 3;
      x.drawImage(AM.spr.chao(id, est, v), tx * 16, ty * 16);
      // bordas: espuma na água e contorno da terra arada
      if (AM.ehAgua(id)) {
        x.fillStyle = 'rgba(255,255,255,.55)';
        if (!AM.ehAgua(M.ch(wx, wy - 1))) x.fillRect(tx * 16, ty * 16, 16, 2);
        if (!AM.ehAgua(M.ch(wx - 1, wy))) x.fillRect(tx * 16, ty * 16, 1, 16);
        if (!AM.ehAgua(M.ch(wx + 1, wy))) x.fillRect(tx * 16 + 15, ty * 16, 1, 16);
        x.fillStyle = 'rgba(20,40,80,.35)';
        if (!AM.ehAgua(M.ch(wx, wy + 1))) x.fillRect(tx * 16, ty * 16 + 14, 16, 2);
      } else if (id === AM.CH.ARADA || id === AM.CH.MOLHADA) {
        x.fillStyle = 'rgba(60,35,20,.45)';
        const viz = c2 => c2 === AM.CH.ARADA || c2 === AM.CH.MOLHADA;
        if (!viz(M.ch(wx, wy - 1))) x.fillRect(tx * 16, ty * 16, 16, 1);
        if (!viz(M.ch(wx, wy + 1))) x.fillRect(tx * 16, ty * 16 + 15, 16, 1);
        if (!viz(M.ch(wx - 1, wy))) x.fillRect(tx * 16, ty * 16, 1, 16);
        if (!viz(M.ch(wx + 1, wy))) x.fillRect(tx * 16 + 15, ty * 16, 1, 16);
      }
      // sombra embaixo de paredes
      const acima = AM.OBJ[M.ob(wx, wy - 1)];
      if (acima && acima.bloco && !AM.OBJ[M.ob(wx, wy)]?.bloco) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(tx * 16, ty * 16, 16, 3); }
    }
    return c;
  }

  // círculos de luz prontos (mais rápido que criar gradiente todo quadro)
  const luzes = new Map();
  function spriteLuz(raio, forca) {
    const k = raio + ':' + forca;
    let c = luzes.get(k);
    if (!c) {
      c = document.createElement('canvas'); c.width = c.height = raio * 2;
      const x = c.getContext('2d'), g = x.createRadialGradient(raio, raio, 0, raio, raio, raio);
      g.addColorStop(0, `rgba(0,0,0,${forca})`); g.addColorStop(.6, `rgba(0,0,0,${forca * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, raio * 2, raio * 2);
      luzes.set(k, c);
    }
    return c;
  }

  // ---------- partículas e textos ----------
  const part = [], textos = [];
  const fx = {
    soltar(p) { part.push(Object.assign({ vx: 0, vy: 0, g: 0, vida: .6, idade: 0, cor: '#fff', tam: 1 }, p)); },
    nuvem(x, y, n, cores, vel = 40, g = 60, vida = .6, tam = 1) {
      for (let i = 0; i < n; i++) fx.soltar({ x, y, vx: AM.u.aleat(-vel, vel), vy: AM.u.aleat(-vel * 1.3, vel * .3), g, vida: vida * AM.u.aleat(.6, 1.2), cor: AM.u.escolha(cores), tam });
    },
    terra: (tx, ty) => fx.nuvem(tx * 16 + 8, ty * 16 + 10, 6, ['#8a5a36', '#a06a42']),
    agua: (tx, ty) => fx.nuvem(tx * 16 + 8, ty * 16 + 6, 8, ['#7ac0ff', '#c8e8ff'], 30, 90),
    lascas: (tx, ty, cor) => fx.nuvem(tx * 16 + 8, ty * 16 + 4, 5, [cor, '#ffffff'], 50, 120, .5),
    fumaca: (x, y, n) => { for (let i = 0; i < n; i++) fx.soltar({ x: x + AM.u.aleat(-6, 6), y: y + AM.u.aleat(-6, 6), vx: AM.u.aleat(-10, 10), vy: AM.u.aleat(-25, -5), vida: AM.u.aleat(.4, .9), cor: AM.u.escolha(['#e8e8f0', '#c8c8d4', '#a8a8b8']), tam: 2 }); },
    brilhos: (x, y, n) => fx.nuvem(x, y, n, ['#fff3a0', '#ffd23f', '#ffffff'], 45, -10, .8),
    sangue: (x, y, cor) => fx.nuvem(x, y, 6, [cor, css(misturar(rgb(cor), [0, 0, 0], .3))], 50, 100, .45),
    coracao: (x, y) => fx.soltar({ x, y, vy: -18, vida: 1.1, tipo: 'coracao', cor: '#ff4d8d' }),
    texto: (x, y, txt, cor = '#fff') => textos.push({ x, y, txt, cor, idade: 0, vida: 1.1 }),
  };
  AM.fx = fx;

  function atualizarFx(dt) {
    for (let i = part.length - 1; i >= 0; i--) {
      const p = part[i];
      p.idade += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.idade >= p.vida) part.splice(i, 1);
    }
    for (let i = textos.length - 1; i >= 0; i--) { const t = textos[i]; t.idade += dt; t.y -= 14 * dt; if (t.idade >= t.vida) textos.splice(i, 1); }
    tremor = Math.max(0, tremor - dt * 8);
  }

  // ---------- desenho ----------
  const PLANOS = new Set(['palha', 'saida', 'flor', 'capim', 'junco', 'cogumelo', 'murcha']);
  function quadro(t, dt) {
    const j = AM.jog, M = AM.m, VW = AM.VW, VH = AM.VH;
    atualizarFx(dt);
    // câmera segue o jogador, presa às bordas do mapa
    const alvoX = j.x - VW / 2, alvoY = j.y - 10 - VH / 2;
    camX += (alvoX - camX) * Math.min(1, dt * 8); camY += (alvoY - camY) * Math.min(1, dt * 8);
    camX = limitar(camX, 0, Math.max(0, AM.mapa.w * 16 - VW)); camY = limitar(camY, 0, Math.max(0, AM.mapa.h * 16 - VH));
    if (Math.abs(alvoX - camX) > VW) { camX = limitar(alvoX, 0, AM.mapa.w * 16 - VW); camY = limitar(alvoY, 0, AM.mapa.h * 16 - VH); }
    const cx = Math.round(camX + (tremor ? AM.u.aleat(-tremor, tremor) : 0)), cy = Math.round(camY + (tremor ? AM.u.aleat(-tremor, tremor) : 0));
    const ms = AM.input.mouse; ms.mundoX = ms.x + cx; ms.mundoY = ms.y + cy;

    b.setTransform(1, 0, 0, 1, 0, 0);
    b.fillStyle = '#000'; b.fillRect(0, 0, VW, VH);
    // chão
    const c0x = Math.floor(cx / 256), c1x = Math.floor((cx + VW) / 256), c0y = Math.floor(cy / 256), c1y = Math.floor((cy + VH) / 256);
    for (let ky = c0y; ky <= c1y; ky++) for (let kx = c0x; kx <= c1x; kx++) {
      if (kx < 0 || ky < 0 || kx * 16 >= AM.mapa.w || ky * 16 >= AM.mapa.h) continue;
      b.drawImage(desenharChunk(kx, ky), kx * 256 - cx, ky * 256 - cy);
    }
    b.setTransform(1, 0, 0, 1, -cx, -cy);
    const tx0 = Math.max(0, Math.floor(cx / 16) - 1), tx1 = Math.min(AM.mapa.w - 1, Math.floor((cx + VW) / 16) + 1);
    const ty0 = Math.max(0, Math.floor(cy / 16) - 1), ty1 = Math.min(AM.mapa.h - 1, Math.floor((cy + VH) / 16) + 3);
    // brilho da água
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      if (!AM.ehAgua(M.ch(tx, ty)) || M.congelado(tx, ty)) continue;
      const fase = (t * 1.6 + (M.variante(tx, ty) & 15)) % 6;
      if (fase < 1.2) { b.fillStyle = 'rgba(220,240,255,.7)'; b.fillRect(tx * 16 + (M.variante(tx, ty) % 11) + 2, ty * 16 + 5 + Math.floor(fase * 3), 3, 1); }
    }
    // lista em ordem de profundidade
    const lista = [], est = AM.tempo.estacao;
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      const id = M.ob(tx, ty), p = M.planta(tx, ty);
      if (p) lista.push({ y: ty * 16 + 14, f: () => b.drawImage(AM.spr.planta(p.tipo, AM.sis.faseDe(p), p.morta), tx * 16, ty * 16 - 6) });
      if (!id) continue;
      const ob = AM.OBJ[id];
      if (!ob) continue;
      const info = M.info(tx, ty);
      let v = info && info.v != null ? info.v : M.variante(tx, ty) % 4;
      if (ob.chave === 'arbusto') v = info && info.fruta ? 1 : 0;
      if (ob.chave === 'cocho') v = info && info.feno > 0 ? 1 : 0;
      const s = AM.spr.objeto(id, est, v);
      let tremer = 0;
      if (info && info.tremer > 0) { info.tremer -= dt; tremer = Math.round(Math.sin(t * 60) * 1.5); }
      const y = PLANOS.has(ob.chave) ? ty * 16 + 2 : ty * 16 + 15;
      lista.push({ y, f: () => {
        if (ob.alto) { b.fillStyle = 'rgba(0,0,0,.18)'; b.beginPath(); b.ellipse(tx * 16 + 8, ty * 16 + 14, 9, 3, 0, 0, 7); b.fill(); }
        b.drawImage(s.c, tx * 16 + s.ox + tremer, ty * 16 + s.oy);
        if (ob.luz && (ob.chave === 'fogueira' || ob.chave === 'tocha') && Math.floor(t * 8 + tx) % 2) { b.fillStyle = 'rgba(255,240,150,.8)'; b.fillRect(tx * 16 + 7, ty * 16 - (ob.chave === 'tocha' ? 4 : -7), 2, 2); }
      } });
    }
    for (const e of AM.ents) if (e.x > cx - 40 && e.x < cx + VW + 40 && e.y > cy - 20 && e.y < cy + VH + 60) lista.push({ y: e.y, f: () => desenharEnt(e, t) });
    if (AM.rede) for (const o of AM.rede.outros()) lista.push({ y: o.y, f: () => desenharOutro(o, t) });
    if (!AM.morto) lista.push({ y: j.y + (j.montaria === 'balao' ? 40 : 0), f: () => desenharJogador(j, t) });
    lista.sort((a, c) => a.y - c.y);
    for (const it of lista) it.f();

    // alvo e fantasma da construção
    const modo = AM.construcao.ativo();
    if (modo) {
      const pl = AM.PLANTAS[modo.planta];
      b.globalAlpha = .55;
      pl.planta.forEach((linha, dy) => [...linha].forEach((ch, dx) => {
        b.fillStyle = modo.ok ? '#7cf07c' : '#ff5a5a';
        b.fillRect((modo.x + dx) * 16, (modo.y + dy) * 16, 16, 16);
        const nome = AM.LEGENDA_PLANTA[ch];
        if (nome) { const s = AM.spr.objeto(AM.OB[nome.toUpperCase()], est, 0); b.drawImage(s.c, (modo.x + dx) * 16 + s.ox, (modo.y + dy) * 16 + s.oy); }
      }));
      b.globalAlpha = 1;
    } else if (!AM.ui.aberto() && !j.montaria && AM.opc.destaques !== false) {
      const a = AM.alvo();
      b.strokeStyle = 'rgba(255,255,255,.8)'; b.lineWidth = 1;
      b.strokeRect(a.x * 16 + .5, a.y * 16 + .5, 15, 15);
      b.fillStyle = 'rgba(255,255,255,.12)'; b.fillRect(a.x * 16, a.y * 16, 16, 16);
    }
    // para onde você está andando (toque)
    if (j.destino && !j.destino.ent) { const pulsa = 3 + Math.sin(t * 8); b.strokeStyle = 'rgba(255,255,255,.8)'; b.beginPath(); b.ellipse(j.destino.x, j.destino.y - 2, pulsa + 2, pulsa * .5 + 1, 0, 0, 7); b.stroke(); }
    // partículas
    for (const p of part) {
      b.globalAlpha = Math.max(0, 1 - p.idade / p.vida);
      if (p.tipo === 'coracao') glifo(b, 'coracao', p.x - 2, p.y, p.cor);
      else { b.fillStyle = p.cor; b.fillRect(Math.round(p.x), Math.round(p.y), p.tam, p.tam); }
    }
    b.globalAlpha = 1;
    // Doidobot flutuando perto de você
    AM.bot.desenharNoMundo(b, t, dt);

    // luz e escuridão
    b.setTransform(1, 0, 0, 1, 0, 0);
    const esc = AM.sis.escuridao();
    if (esc > 0.01) {
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, VW, VH);
      l.fillStyle = AM.mapa.id === 'mundo' ? `rgba(12,16,48,${esc})` : `rgba(6,4,14,${esc})`;
      l.fillRect(0, 0, VW, VH);
      l.globalCompositeOperation = 'destination-out';
      const furo = (x, y, raio, forca = 1) => {
        const s = spriteLuz(Math.round(raio / 2) * 2, forca);
        l.drawImage(s, Math.round(x - cx - s.width / 2), Math.round(y - cy - s.height / 2));
      };
      furo(j.x, j.y - 8, AM.mapa.id === 'mundo' ? 34 : 96, .95);
      const brilhos = [];
      for (let ty = ty0 - 4; ty <= ty1 + 2; ty++) for (let tx = tx0 - 4; tx <= tx1 + 4; tx++) {
        const ob = AM.OBJ[M.ob(tx, ty)];
        if (ob && ob.luz) { const osc = ob.chave === 'fogueira' || ob.chave === 'tocha' ? Math.sin(t * 9 + tx) * 3 : 0; furo(tx * 16 + 8, ty * 16 + 4, ob.luz * 16 + osc); if (ob.calor || ob.chave === 'tocha' || ob.chave === 'lampiao') brilhos.push([tx * 16 + 8, ty * 16 + 4, ob.luz * 10]); }
      }
      b.drawImage(luz, 0, 0);
      b.globalCompositeOperation = 'lighter';
      for (const [x, y, r] of brilhos) { const g = b.createRadialGradient(x - cx, y - cy, 0, x - cx, y - cy, r); g.addColorStop(0, 'rgba(255,150,60,.22)'); g.addColorStop(1, 'rgba(255,150,60,0)'); b.fillStyle = g; b.fillRect(x - cx - r, y - cy - r, r * 2, r * 2); }
      b.globalCompositeOperation = 'source-over';
    }
    // pôr do sol alaranjado
    const m = AM.tempo.minuto;
    if (AM.mapa.id === 'mundo' && m > 16 * 60 && m < 20 * 60) { b.fillStyle = `rgba(255,120,40,${Math.sin((m - 16 * 60) / 240 * Math.PI) * .12})`; b.fillRect(0, 0, VW, VH); }
    // chuva e neve
    const clima = AM.mapa.id === 'mundo' ? AM.tempo.clima : 'sol';
    if (clima === 'chuva' || clima === 'neve') {
      const neve = clima === 'neve';
      while (chuva.length < (neve ? 90 : 140)) chuva.push({ x: Math.random() * VW, y: Math.random() * VH, v: AM.u.aleat(.7, 1.3) });
      b.fillStyle = neve ? 'rgba(255,255,255,.85)' : 'rgba(180,210,255,.55)';
      for (const g of chuva) {
        g.y += (neve ? 22 : 190) * g.v * dt; g.x += (neve ? Math.sin(t + g.v * 9) * 10 : -40) * dt;
        if (g.y > VH) { g.y = -4; g.x = Math.random() * VW; } if (g.x < 0) g.x += VW;
        if (neve) b.fillRect(g.x | 0, g.y | 0, 1 + (g.v > 1.1), 1 + (g.v > 1.1)); else b.fillRect(g.x | 0, g.y | 0, 1, 4);
      }
      if (!neve) { b.fillStyle = 'rgba(30,40,70,.12)'; b.fillRect(0, 0, VW, VH); }
    } else chuva.length = 0;

    // para a tela, ampliado sem suavizar
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buf, 0, 0, AM.VW, AM.VH, 0, 0, AM.VW * escala, AM.VH * escala);
    // textos nítidos (na resolução da tela)
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.max(11, escala * 4.5)}px "Pixelify Sans", monospace`;
    for (const tx of textos) {
      const k = tx.idade / tx.vida, sx = (tx.x - cx) * escala, sy = (tx.y - cy) * escala;
      ctx.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
      ctx.lineWidth = Math.max(2, escala); ctx.strokeStyle = 'rgba(20,10,30,.85)'; ctx.strokeText(tx.txt, sx, sy);
      ctx.fillStyle = tx.cor; ctx.fillText(tx.txt, sx, sy);
    }
    ctx.globalAlpha = 1;
    // nomes de outros jogadores e barras de vida dos chefes
    ctx.font = `600 ${Math.max(10, escala * 3.6)}px "Pixelify Sans", monospace`;
    if (AM.rede) for (const o of AM.rede.outros()) { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.strokeText(o.nome, (o.x - cx) * escala, (o.y - 30 - cy) * escala); ctx.fillText(o.nome, (o.x - cx) * escala, (o.y - 30 - cy) * escala); }
    for (const e of AM.ents) {
      if (e.classe !== 'mob' || e.vida >= e.vidaMax) continue;
      const d = AM.MOBS[e.tipo], w = (d.chefe ? 30 : 14) * escala, sx = (e.x - cx) * escala - w / 2, sy = (e.y - cy - 20 * (d.tam || 1) - 6) * escala;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(sx - 1, sy - 1, w + 2, escala * 2 + 2);
      ctx.fillStyle = AM.opc.daltonico ? '#ffb000' : '#e84a4a'; ctx.fillRect(sx, sy, w * Math.max(0, e.vida / e.vidaMax), escala * 2);
    }
  }

  function desenharJogador(j, t) {
    if (j.invuln > 0 && Math.floor(t * 20) % 2) return;
    const quadroAnda = j.andando ? 1 + Math.floor(t * 8) % 4 : 0;
    const q = quadroAnda === 4 ? 0 : quadroAnda;
    b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(j.x, j.y, 6, 2, 0, 0, 7); b.fill();
    if (j.montaria === 'carrinho') desenharCarrinho(j.x, j.y, t, j.andando);
    if (j.montaria === 'balao') {
      const y = j.y - 30 + Math.sin(t * 2) * 2;
      b.drawImage(AM.spr.pessoa(j.paleta, 'baixo', 0, { faixa: j.faixa }), j.x - 8, y - 14, 16, 24);
      desenharBalao(j.x, y, t);
      return;
    }
    const sp = AM.spr.pessoa(j.paleta, j.dir, j.montaria ? 0 : q, { faixa: j.faixa });
    b.drawImage(sp, Math.round(j.x - 8), Math.round(j.y - 23 - (j.montaria === 'carrinho' ? 5 : 0)));
    // ferramenta em uso
    if (j.acao) {
      const s = AM.inv.selecionado(), k = j.acao.t / .25;
      if (s) {
        const ang = { baixo: Math.PI * .75, cima: -Math.PI * .25, esq: -Math.PI * .75, dir: Math.PI * .25 }[j.dir] + (k - .5) * 1.8 * (j.dir === 'esq' ? -1 : 1);
        b.save(); b.translate(j.x, j.y - 12); b.rotate(ang); b.drawImage(AM.spr.icone(s.id), -2, -16); b.restore();
      }
    }
    if (j.pesca) {
      const p = j.pesca, by = p.y + (p.mordeu > 0 ? 2 : Math.sin(t * 3) * 1.5);
      b.strokeStyle = 'rgba(255,255,255,.7)'; b.beginPath(); b.moveTo(j.x + (j.dir === 'esq' ? -10 : 10), j.y - 20); b.lineTo(p.x, by); b.stroke();
      b.fillStyle = '#e8354a'; b.fillRect(p.x - 1, by - 1, 3, 2); b.fillStyle = '#fff'; b.fillRect(p.x - 1, by - 2, 3, 1);
      if (p.mordeu > 0) glifo(b, '!', j.x - 1, j.y - 36, '#ffd23f', 2);
    }
  }
  function desenharCarrinho(x, y, t, andando) {
    const r = andando ? Math.floor(t * 10) % 2 : 0;
    b.fillStyle = '#6b4226'; b.fillRect(x - 11, y - 12, 22, 9);
    b.fillStyle = '#a8703f'; b.fillRect(x - 10, y - 13, 20, 7);
    b.fillStyle = '#d84848'; b.fillRect(x - 10, y - 9, 20, 2);
    for (const wx of [x - 8, x + 8]) { b.fillStyle = '#2a2a30'; b.fillRect(wx - 3, y - 5, 6, 6); b.fillStyle = '#8a8a96'; b.fillRect(wx - 1 + r, y - 3, 2, 2); }
  }
  function desenharBalao(x, y, t) {
    b.fillStyle = '#7a4a24'; b.fillRect(x - 7, y - 4, 14, 8); b.fillStyle = '#a8703f'; b.fillRect(x - 7, y - 4, 14, 2);
    b.fillStyle = '#5a3a22'; b.fillRect(x - 6, y - 16, 1, 12); b.fillRect(x + 5, y - 16, 1, 12);
    for (let dy = -12; dy <= 12; dy++) {
      const w = Math.round(Math.sqrt(156 - dy * dy) * (dy > 4 ? .8 : 1));
      for (let dx = -w; dx <= w; dx++) { b.fillStyle = Math.floor((dx + 13) / 4) % 2 ? '#e2484f' : '#ffd23f'; b.fillRect(x + dx, y - 30 + dy, 1, 1); }
    }
    b.fillStyle = 'rgba(255,255,255,.5)'; b.fillRect(x - 7, y - 38, 3, 6);
  }

  function desenharEnt(e, t) {
    switch (e.classe) {
      case 'npc': { const q = e.andando ? 1 + Math.floor(t * 6) % 3 : 0;
        b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(e.x, e.y, 6, 2, 0, 0, 7); b.fill();
        b.drawImage(AM.spr.pessoa(e.paleta, e.dir, q), Math.round(e.x - 8), Math.round(e.y - 23));
        if (e.loja && Math.hypot(AM.jog.x - e.x, AM.jog.y - e.y) < 40) glifo(b, '...', e.x - 2, e.y - 30, '#fff8e7');
        break; }
      case 'mob': { const d = AM.MOBS[e.tipo];
        b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(e.x, e.y, 6 * (d.tam || 1), 2 * (d.tam || 1), 0, 0, 7); b.fill();
        if (e.carga > 0) { b.fillStyle = 'rgba(255,60,60,.35)'; b.beginPath(); b.ellipse(e.x, e.y, 14, 5, 0, 0, 7); b.fill(); }
        AM.spr.mob(b, e, t * 1000); break; }
      case 'animal':
        b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(e.x, e.y, 6, 2, 0, 0, 7); b.fill();
        AM.spr.animal(b, e, t * 1000);
        if (e.pronto) glifo(b, 'brilho', e.x - 1, e.y - 24 + Math.sin(t * 4) * 1.5, '#ffd23f');
        break;
      case 'drop': { const s = AM.spr.icone(e.item), bob = Math.sin(t * 4 + e.id) * 1.5;
        b.fillStyle = 'rgba(0,0,0,.2)'; b.beginPath(); b.ellipse(e.x, e.y, 4, 1.5, 0, 0, 7); b.fill();
        b.drawImage(s, Math.round(e.x - 6), Math.round(e.y - 13 - e.z + bob), 12, 12); break; }
      case 'proj':
        if (e.tipo === 'flecha') { const a = Math.atan2(e.vy, e.vx); b.save(); b.translate(e.x, e.y); b.rotate(a); b.fillStyle = '#8a5a32'; b.fillRect(-6, 0, 9, 1); b.fillStyle = '#c9d1dc'; b.fillRect(3, -1, 2, 3); b.fillStyle = '#f4f0e8'; b.fillRect(-7, -1, 2, 3); b.restore(); }
        else { b.save(); b.translate(e.x, e.y); b.rotate(t * 12); b.fillStyle = '#f0ead8'; b.fillRect(-3, -1, 6, 2); b.fillRect(-4, -2, 2, 4); b.fillRect(2, -2, 2, 4); b.restore(); }
        break;
      case 'veiculo':
        b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(e.x, e.y, 10, 3, 0, 0, 7); b.fill();
        if (e.tipo === 'carrinho') desenharCarrinho(e.x, e.y, t, false); else desenharBalao(e.x, e.y - 2, 0);
        break;
      case 'clone':
        b.globalAlpha = .7;
        b.drawImage(AM.spr.pessoa(AM.jog.paleta, AM.jog.dir, AM.jog.andando ? 1 + Math.floor(t * 8) % 3 : 0, { faixa: true }), Math.round(e.x - 8), Math.round(e.y - 23));
        b.globalAlpha = 1; break;
    }
  }
  function desenharOutro(o, t) {
    b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(o.x, o.y, 6, 2, 0, 0, 7); b.fill();
    if (o.montaria === 'carrinho') desenharCarrinho(o.x, o.y, t, o.andando);
    if (o.montaria === 'balao') { desenharBalao(o.x, o.y - 30, t); return; }
    b.drawImage(AM.spr.pessoa(o.paleta || 'morador1', o.dir || 'baixo', o.andando ? 1 + Math.floor(t * 8) % 3 : 0, { faixa: o.faixa }), Math.round(o.x - 8), Math.round(o.y - 23 - (o.montaria ? 5 : 0)));
  }

  return {
    iniciar, ajustar, quadro, sujar, sujarTudo,
    tremer: n => { if (!matchMedia('(prefers-reduced-motion: reduce)').matches) tremor = Math.max(tremor, n); },
    get escala() { return escala; },
    get cam() { return { x: camX, y: camY }; },
    paraTela: (x, y) => ({ x: (x - camX) * escala, y: (y - camY) * escala }),
  };
})();
