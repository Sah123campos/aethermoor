// Interface do jogo: HUD, hotbar, rolo de missões, avisos, minimapa,
// controles de mouse e de toque. Os painéis ficam em paineis.js.
'use strict';

AM.ui = (() => {
  const $ = s => document.querySelector(s);
  let painelAberto = null, roloI = 0, tRolo = 0, tHud = 0, tMini = 0, roloAberto = false;
  const ICONE_CLIMA = { sol: '☀', chuva: '☂', neve: '❄' };

  function montar() {
    $('#ui').innerHTML = `
      <div id="colunaEsq"><div id="hudJogo" class="peca">
        <div class="barra vida"><i></i><span>♥ <b class="v"></b></span></div>
        <div class="barra fome"><i></i><span>🍖 Fome <b class="v"></b></span></div>
        <div class="barra sede"><i></i><span>💧 Sede <b class="v"></b></span></div>
        <div class="linhaNivel"><b id="hNivel">Nv 1</b><div class="xp"><i></i></div><span class="ouroHud" id="hOuro">0</span></div>
      </div><div id="tutorialCard" class="peca" hidden></div></div>
      <div id="cantoDir">
        <div id="relogio" class="peca"><span id="hData"></span><span id="hHora"></span><span id="hClima"></span></div>
        <canvas id="minimapa" width="96" height="96" title="Mapa (M)"></canvas>
        <button id="btnMenu" aria-label="Menu" aria-expanded="false">☰ Menu</button>
        <div id="botoesJogo">
          <button data-acao="inventario">Inventário <kbd>E</kbd></button><button data-acao="construir">Construir <kbd>B</kbd></button>
          <button data-acao="missoes">Missões <kbd>Q</kbd></button><button data-acao="atributos">Atributos <kbd>C</kbd></button>
          <button data-acao="mapa">Mapa <kbd>M</kbd></button><button data-acao="conversa">Doidobot <kbd>H</kbd></button>
          <button data-acao="opcoes">Opções <kbd>Esc</kbd></button><button data-acao="telaCheia" class="soToque">Tela cheia</button>
        </div>
      </div>
      <div id="roloJogo" hidden><span class="pau"></span><div class="perg"><button class="seta" data-r="-1" aria-label="Missão anterior">‹</button><span class="missaoAtual"></span><button class="seta" data-r="1" aria-label="Próxima missão">›</button><button class="recolher" aria-label="Recolher o rolo">▴</button></div><span class="pau"></span></div>
      <div id="roloLista" hidden></div>
      <div id="nomeItem" class="peca" style="opacity:0"></div>
      <div id="hotbar" class="peca"></div>
      <div id="avisos"></div>
      <div id="pegou"></div>
      <div id="botBox"><div id="botCabeca" title="Doidobot (H dá uma dica, clique para conversar)"></div><div id="botBalao" hidden><span class="txt"></span><button hidden>OK</button></div></div>
      <div id="dicaAcao" hidden></div>
      <div id="obraBotoes" hidden><button class="btn ouro" id="obraOk">✔ Construir aqui</button><button class="btn claro" id="obraNao">✖ Cancelar</button></div>
      <div id="toque" hidden><div id="joyZona"><div id="joy"><i></i></div></div>
        <button class="bToque" id="tInter" aria-label="Ação"><span>Ação</span></button>
        <button class="bToque" id="tUsar" aria-label="Usar o item da mão"><img alt=""><span>Usar</span></button>
        <button class="bToque pequeno" id="tJutsu" hidden aria-label="Jutsu">忍</button></div>
      <div id="painel" hidden></div>`;
    $('#botoesJogo').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      menu(false);
      if (b.dataset.acao === 'telaCheia') return telaCheia();
      abrir(b.dataset.acao === 'missoes' ? 'quadro' : b.dataset.acao);
    };
    $('#btnMenu').onclick = () => menu(!$('#botoesJogo').classList.contains('aberto'));
    $('#obraOk').onclick = () => AM.construcao.confirmar();
    $('#obraNao').onclick = () => { AM.construcao.cancelar(); AM.ui.aviso('Construção cancelada.'); };
    $('#minimapa').onclick = () => abrir('mapa');
    const rolo = $('#roloJogo');
    rolo.querySelector('.perg').onclick = e => {
      const b = e.target.closest('button');
      if (b && b.dataset.r) { roloI += +b.dataset.r; tRolo = 0; desenharRolo(); return; }
      if (b && b.classList.contains('recolher')) { rolo.classList.toggle('recolhido'); b.textContent = rolo.classList.contains('recolhido') ? '▾' : '▴'; $('#roloLista').hidden = true; return; }
      roloAberto = !roloAberto; desenharLista();
    };
    montarHotbar();
    controlesDeMouse();
    controlesDeToque();
  }

  // ---------- hotbar ----------
  function montarHotbar() {
    const hb = $('#hotbar');
    hb.innerHTML = Array.from({ length: 8 }, (_, i) => `<button class="slot" data-i="${i}" aria-label="Espaço ${i + 1}"></button>`).join('');
    hb.onclick = e => { const s = e.target.closest('.slot'); if (s) selecionar(+s.dataset.i); };
    atualizarHotbar();
  }
  function htmlSlot(it, num) {
    if (!it) return num ? `<span class="n">${num}</span>` : '';
    const def = AM.ITENS[it.id];
    return `<img src="${AM.spr.iconeURL(it.id)}" alt="${def.nome}">${num ? `<span class="n">${num}</span>` : ''}` +
      (it.qtd > 1 ? `<span class="q">${it.qtd}</span>` : '') +
      (def.cargaMax ? `<span class="carga"><i style="--v:${Math.round((it.carga || 0) / def.cargaMax * 100)}%"></i></span>` : '');
  }
  function atualizarHotbar() {
    if (!AM.jog || !$('#hotbar')) return;
    $('#hotbar').querySelectorAll('.slot').forEach((el, i) => {
      el.innerHTML = htmlSlot(AM.jog.inv[i], i + 1);
      el.classList.toggle('sel', i === AM.jog.sel);
      el.title = AM.jog.inv[i] ? AM.ITENS[AM.jog.inv[i].id].nome : '';
    });
    if (painelAberto === 'inventario' || painelAberto === 'bau') AM.paineis.redesenhar();
  }
  let tNome;
  // escolher de novo o item que já está na mão guarda o item (mão vazia)
  function selecionar(i, alternar = true) {
    i = (i + 8) % 8;
    AM.jog.sel = alternar && i === AM.jog.sel ? -1 : i;
    AM.jog.pesca = null;
    atualizarHotbar();
    const it = AM.jog.inv[AM.jog.sel], el = $('#nomeItem');
    el.textContent = it ? AM.ITENS[it.id].nome : '(mão vazia)';
    el.style.opacity = 1; clearTimeout(tNome); tNome = setTimeout(() => { el.style.opacity = 0; }, 1400);
  }

  // ---------- HUD ----------
  function atualizarHud(dt) {
    if ((tHud -= dt) > 0) return;
    tHud = .15;
    const j = AM.jog, t = AM.tempo;
    const barra = (cls, v, max) => { const el = $('#hudJogo .' + cls); el.style.setProperty('--v', `${Math.round(v / max * 100)}%`); el.querySelector('.v').textContent = Math.ceil(v); el.classList.toggle('baixa', v / max < .25); };
    barra('vida', j.vida, j.vidaMax); barra('fome', j.fome, 100); barra('sede', j.sede, 100);
    $('#hNivel').textContent = 'Nv ' + j.nivel;
    $('#hudJogo .xp').style.setProperty('--v', `${Math.round(j.xp / AM.sis.xpPara(j.nivel) * 100)}%`);
    $('#hOuro').textContent = '● ' + AM.sis.ouro();
    $('#hData').textContent = `${AM.ICONE_ESTACAO[t.estacao]} ${AM.ESTACOES[t.estacao]} ${t.diaEstacao}${t.ano > 1 ? ' · ano ' + t.ano : ''}`;
    $('#hHora').textContent = AM.u.hora(t.minuto);
    $('#hClima').textContent = AM.mapa.id === 'mundo' ? ICONE_CLIMA[t.clima] || '☀' : '⛏';
    document.body.classList.toggle('daltonico', !!AM.opc.daltonico);
    if ((tMini -= .15) <= 0) { tMini = .5; desenharMini(); }
    if ((tRolo += .15) > 6) { tRolo = 0; roloI++; desenharRolo(); }
  }

  // ---------- minimapa ----------
  const COR_CHAO = ['#5aa548', '#9a6b42', '#7a4a2a', '#5e3c24', '#e6d29a', '#eef4fb', '#3f86d0', '#2c64b0', '#8a8a96', '#6a583a', '#d4b884', '#b98552', '#9a9aa8', '#8ab07a', '#a8703f', '#bfe0f4', '#6a5a4a', '#3f8a3e'];
  function corTile(x, y) {
    const o = AM.m.ob(x, y), ob = AM.OBJ[o];
    if (ob && o) {
      if (ob.chave === 'arvore' || ob.chave === 'pinheiro') return AM.tempo.estacao === 3 ? '#7a8a7a' : '#2a5a2e';
      if (ob.chave === 'telhado') return '#b8473a';
      if (ob.chave === 'rocha') return (AM.masmorraCores || {}).parede || '#3a2e24';
      if (ob.chave === 'entrada') return '#ff4dd2';
      if (ob.bloco || ob.chave === 'parede_vila') return '#5a3a1e';
      if (ob.chave === 'pedra' || ob.chave === 'ferro' || ob.chave === 'ouro') return '#6a6a76';
    }
    const c = AM.m.ch(x, y);
    if (c === AM.CH.P_MASMORRA) return (AM.masmorraCores || {}).chao || '#5e4c3c';
    if (AM.tempo.estacao === 3 && (c === AM.CH.GRAMA || c === AM.CH.MATA)) return '#dfe8f2';
    return COR_CHAO[c] || '#000';
  }
  function desenharMini() {
    const cv = $('#minimapa'); if (!cv) return;
    const x = cv.getContext('2d'), j = AM.jog, R = 24, px = Math.floor(j.x / 16), py = Math.floor(j.y / 16);
    x.fillStyle = '#0a1420'; x.fillRect(0, 0, 96, 96);
    for (let dy = -R; dy < R; dy++) for (let dx = -R; dx < R; dx++) {
      const tx = px + dx, ty = py + dy;
      if (!AM.m.dentro(tx, ty)) continue;
      x.fillStyle = corTile(tx, ty); x.fillRect((dx + R) * 2, (dy + R) * 2, 2, 2);
    }
    for (const e of AM.ents) {
      if (!['mob', 'npc', 'animal'].includes(e.classe)) continue;
      const dx = Math.floor(e.x / 16) - px, dy = Math.floor(e.y / 16) - py;
      if (Math.abs(dx) >= R || Math.abs(dy) >= R) continue;
      x.fillStyle = e.classe === 'mob' ? '#ff4040' : e.classe === 'npc' ? '#ffd23f' : '#ffffff';
      x.fillRect((dx + R) * 2, (dy + R) * 2, 2, 2);
    }
    x.fillStyle = '#ffffff'; x.fillRect(R * 2 - 2, R * 2 - 2, 4, 4); x.fillStyle = '#e8354a'; x.fillRect(R * 2 - 1, R * 2 - 1, 2, 2);
  }

  // ---------- rolo de missões ----------
  function missoesVisiveis() {
    const l = AM.E.missoes.ativas.map(m => ({ titulo: m.titulo, prog: AM.missoes.progresso(m), n: m.n, tipo: m.periodo === 'semanal' ? 'Semanal' : 'Diária', coop: m.coop }));
    if (AM.tutorial.ativo()) l.unshift({ titulo: AM.tutorial.passo().texto.split(':')[0].slice(0, 60), prog: AM.E.tutorial.passo, n: AM.tutorial.total, tipo: 'Tutorial' });
    if (!AM.E.missoes.registrado && !AM.tutorial.ativo()) l.push({ titulo: 'Registre-se na Guilda de Aventureiros', prog: 0, n: 1, tipo: 'Principal' });
    return l;
  }
  function desenharRolo() {
    const l = missoesVisiveis(), el = $('#roloJogo');
    if (!el) return;
    el.hidden = !l.length;
    if (!l.length) return;
    roloI = ((roloI % l.length) + l.length) % l.length;
    const m = l[roloI], alvo = el.querySelector('.missaoAtual');
    alvo.style.opacity = 0;
    setTimeout(() => { alvo.innerHTML = `📜 ${m.titulo}<small>${m.prog}/${m.n} · ${m.tipo}${m.coop ? ' · coop' : ''}</small>`; alvo.style.opacity = 1; }, 120);
    if (roloAberto) desenharLista();
  }
  function desenharLista() {
    const el = $('#roloLista'), l = missoesVisiveis();
    el.hidden = !roloAberto || !l.length;
    el.innerHTML = l.map(m => `<div class="m"><b>${m.titulo}</b><span>${m.prog}/${m.n}</span><small>${m.tipo}${m.coop ? ' · cooperativa' : ''}</small><div class="progBarra"><i style="--v:${Math.round(m.prog / m.n * 100)}%"></i></div></div>`).join('') +
      '<button class="btn claro" id="abrirQuadro">Ver o quadro de missões</button>';
    const b = el.querySelector('#abrirQuadro'); if (b) b.onclick = () => { roloAberto = false; el.hidden = true; abrir('quadro'); };
  }
  function atualizarRolo(nova) { desenharRolo(); if (nova) { const el = $('#roloJogo'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'desenrola .7s ease-out'; } }

  function atualizarTutorial() {
    const el = $('#tutorialCard'); if (!el) return;
    el.hidden = !AM.tutorial.ativo();
    if (!el.hidden) {
      el.innerHTML = `<b>Tutorial ${AM.E.tutorial.passo + 1}/${AM.tutorial.total}</b><span>${AM.tutorial.passo().texto}</span><button>Pular tutorial</button>`;
      el.querySelector('button').onclick = () => AM.tutorial.pular();
    }
    desenharRolo();
  }

  // ---------- avisos ----------
  function aviso(texto, tipo = '') {
    const box = $('#avisos'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'aviso ' + tipo; el.textContent = texto;
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    const ms = (AM.opc.lerdo ? 2 : 1) * Math.max(2600, texto.length * 60);
    setTimeout(() => el.classList.add('sai'), ms); setTimeout(() => el.remove(), ms + 600);
  }
  function pegou(id, qtd) {
    const box = $('#pegou'); if (!box) return;
    const el = document.createElement('div');
    el.innerHTML = `<img src="${AM.spr.iconeURL(id)}" alt=""> +${qtd} ${AM.ITENS[id].nome}`;
    box.appendChild(el);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => el.remove(), 2200);
  }
  function missaoConcluida(m) {
    const el = document.createElement('div');
    el.className = 'concluida';
    el.innerHTML = `<b>MISSÃO CONCLUÍDA!</b>${m.titulo}<br>+${m.ouro} ouro · +${m.xp} XP`;
    $('#ui').appendChild(el);
    setTimeout(() => el.remove(), AM.opc.lerdo ? 5200 : 3200);
    AM.fx.brilhos(AM.jog.x, AM.jog.y - 14, 20);
  }
  function resumoDia(linhas, dormiu) { abrir('resumo', { linhas, dormiu }); }

  // ---------- painéis ----------
  function abrir(nome, dados) {
    if (!AM.paineis[nome]) return;
    painelAberto = nome;
    AM.input.ligar(false);
    $('#painel').hidden = false;
    AM.paineis[nome](dados || {});
    AM.som('pop');
  }
  function fechar() {
    if (!painelAberto) return;
    const era = painelAberto;
    painelAberto = null;
    $('#painel').hidden = true; $('#painel').innerHTML = '';
    AM.input.ligar(true);
    AM.paineis.aoFechar && AM.paineis.aoFechar(era);
  }

  // ---------- mouse ----------
  function controlesDeMouse() {
    const cv = $('#telaJogo'), ms = AM.input.mouse;
    const pos = e => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; ms.x = (e.clientX - r.left) * d / AM.render.escala; ms.y = (e.clientY - r.top) * d / AM.render.escala; };
    cv.addEventListener('mousemove', e => { pos(e); ms.dentro = true; ms.mexeu = performance.now(); });
    cv.addEventListener('mouseleave', () => { ms.dentro = false; ms.esq = false; });
    cv.addEventListener('mousedown', e => { pos(e); ms.mexeu = performance.now(); if (e.button === 0) { ms.esq = true; ms.cliqueEsq = true; } if (e.button === 2) ms.cliqueDir = true; });
    addEventListener('mouseup', e => { if (e.button === 0) ms.esq = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => { e.preventDefault(); if (!painelAberto) selecionar(Math.max(0, AM.jog.sel) + (AM.jog.sel < 0 ? 0 : e.deltaY > 0 ? 1 : -1), false); }, { passive: false });
  }

  // ---------- menu, tela cheia ----------
  function menu(abrirMenu) { $('#botoesJogo').classList.toggle('aberto', abrirMenu); $('#btnMenu').setAttribute('aria-expanded', String(abrirMenu)); }
  function telaCheia() {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen && d.exitFullscreen();
    else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => aviso('Este navegador não deixou abrir em tela cheia.'));
    else aviso('Este navegador não tem tela cheia. No iPhone, use "Adicionar à Tela de Início".');
  }

  // ---------- toque ----------
  function controlesDeToque() {
    const usarToque = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (!usarToque) return;
    AM.toqueAtivo = true;
    document.body.classList.add('toque');
    $('#toque').hidden = false;
    const zona = $('#joyZona'), joy = $('#joy'), bola = joy.querySelector('i'), t = AM.input.toque;
    let idJoy = null, centro = null;
    // o direcional aparece onde o dedão encostar (dentro da área da esquerda)
    const mover = e => {
      let dx = (e.clientX - centro.x) / 52, dy = (e.clientY - centro.y) / 52;
      const n = Math.hypot(dx, dy); if (n > 1) { dx /= n; dy /= n; }
      t.x = Math.abs(dx) > .18 ? dx : 0; t.y = Math.abs(dy) > .18 ? dy : 0; t.ativo = true;
      bola.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
    };
    zona.addEventListener('pointerdown', e => {
      e.preventDefault();
      idJoy = e.pointerId; zona.setPointerCapture(e.pointerId);
      const r = zona.getBoundingClientRect();
      centro = { x: e.clientX, y: e.clientY };
      joy.style.left = (e.clientX - r.left - 65) + 'px'; joy.style.top = (e.clientY - r.top - 65) + 'px';
      joy.classList.add('ativo');
      mover(e);
    });
    zona.addEventListener('pointermove', e => { if (e.pointerId === idJoy) mover(e); });
    const soltar = e => { if (e.pointerId !== idJoy) return; idJoy = null; t.ativo = false; t.x = t.y = 0; bola.style.transform = ''; joy.classList.remove('ativo'); joy.style.left = joy.style.top = ''; };
    zona.addEventListener('pointerup', soltar); zona.addEventListener('pointercancel', soltar);
    const botao = (el, acao) => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); t.botoes.add(acao); t.novos.add(acao); el.classList.add('apertado'); });
      const fim = () => { t.botoes.delete(acao); el.classList.remove('apertado'); };
      el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim); el.addEventListener('pointerleave', fim);
    };
    botao($('#tUsar'), 'usar'); botao($('#tInter'), 'interagir'); botao($('#tJutsu'), 'jutsu');
    // tocar no mundo: perto age, longe anda até lá
    const cv = $('#telaJogo');
    let ini = null;
    cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') ini = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    cv.addEventListener('pointerup', e => {
      if (e.pointerType === 'mouse' || !ini) return;
      const longo = performance.now() - ini.t > 450, mexeu = Math.hypot(e.clientX - ini.x, e.clientY - ini.y) > 14;
      ini = null;
      if (!mexeu) toqueNoMundo(e.clientX, e.clientY, longo);
    });
  }
  function paraMundo(cx, cy) {
    const cv = $('#telaJogo'), r = cv.getBoundingClientRect(), d = cv.width / r.width, cam = AM.render.cam, k = d / AM.render.escala;
    return { x: (cx - r.left) * k + Math.round(cam.x), y: (cy - r.top) * k + Math.round(cam.y) };
  }
  function toqueNoMundo(cx, cy, longo) {
    if (painelAberto || AM.morto) return;
    const j = AM.jog, p = paraMundo(cx, cy), tx = Math.floor(p.x / 16), ty = Math.floor(p.y / 16);
    if (AM.construcao.ativo()) { AM.construcao.fixar(tx, ty); return; }
    // alguém ali? (morador, animal, veículo)
    const e = AM.ents.filter(x => ['npc', 'animal', 'veiculo'].includes(x.classe) && Math.hypot(x.x - p.x, x.y - 8 - p.y) < 14)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    if (e) {
      const falar = () => { virarPara(e.x, e.y); AM.criaturas.interagirCom(e); };
      if (Math.hypot(e.x - j.x, e.y - j.y) < 26) falar(); else j.destino = { ent: e, ao: falar };
      return;
    }
    const jx = Math.floor(j.x / 16), jy = Math.floor((j.y - 4) / 16);
    const perto = Math.abs(tx - jx) <= 1 && Math.abs(ty - jy) <= 1 && !(tx === jx && ty === jy);
    const agir = () => {
      virarPara(tx * 16 + 8, ty * 16 + 8);
      AM.alvoForcado = { x: tx, y: ty };
      const a = AM.acaoContexto();
      if (a && a.tile && !longo) a.fazer();
      else if (longo && a) a.fazer();
      else { AM.jog.cd = 0; AM.usar(); }
      AM.alvoForcado = null;
    };
    if (perto) return agir();
    // longe: anda até lá; se for algo que se usa (cama, baú, fogueira...), usa ao chegar
    const ob = AM.OBJ[AM.m.ob(tx, ty)], interessante = ob && (ob.bau || ob.cama || ob.estacao || ob.quadro || ob.venda || ob.balcao || ob.entrada || ob.saida || ob.tesouro || ob.cocho || ob.colmeia || ob.agua);
    const destinoX = tx * 16 + 8, destinoY = ty * 16 + (interessante || AM.m.solido(tx, ty) ? 28 : 12);
    j.destino = { x: destinoX, y: destinoY, ao: interessante ? () => { j.dir = 'cima'; AM.alvoForcado = { x: tx, y: ty }; const a = AM.acaoContexto(); if (a) a.fazer(); AM.alvoForcado = null; } : null };
    AM.fx.soltar({ x: destinoX, y: destinoY - 2, vida: .5, cor: '#ffffff', tam: 2 });
  }
  function virarPara(x, y) {
    const j = AM.jog, dx = x - j.x, dy = y - (j.y - 6);
    j.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'esq' : 'dir') : (dy < 0 ? 'cima' : 'baixo');
  }

  // ---------- botão de ação e dica "F · Falar" ----------
  let tAcao = 0, ultimaAcao = '', ultimoItem = null;
  function atualizarAcao(dt) {
    if ((tAcao -= dt) > 0) return;
    tAcao = .12;
    const a = !painelAberto && !AM.morto ? AM.acaoContexto() : null;
    const dica = $('#dicaAcao');
    if (AM.toqueAtivo) {
      const b = $('#tInter');
      const rot = a ? a.curto : 'Ação';
      if (rot !== ultimaAcao) { b.querySelector('span').textContent = rot; ultimaAcao = rot; }
      b.classList.toggle('vazio', !a);
      const s = AM.inv.selecionado(), id = s ? s.id : null;
      if (id !== ultimoItem) {
        ultimoItem = id;
        const img = $('#tUsar img');
        if (id) { img.src = AM.spr.iconeURL(id); img.hidden = false; } else img.hidden = true;
        $('#tUsar span').textContent = id ? (AM.ITENS[id].comida ? 'Comer' : 'Usar') : 'Mão';
      }
      $('#tJutsu').hidden = !AM.jog.faixa;
      dica.hidden = true;
    } else {
      if (!a || AM.construcao.ativo()) { dica.hidden = true; }
      else {
        const pos = a.alvo ? { x: a.alvo.x, y: a.alvo.y - 30 } : a.tile ? { x: a.tile.x * 16 + 8, y: a.tile.y * 16 - 6 } : { x: AM.jog.x, y: AM.jog.y - 34 };
        const cv = $('#telaJogo'), r = cv.getBoundingClientRect(), k = r.width / cv.width, cam = AM.render.cam;
        dica.innerHTML = `<kbd>${AM.input.nomeTecla(AM.input.tecla('interagir'))}</kbd> ${a.rotulo}`;
        dica.style.left = ((pos.x - cam.x) * AM.render.escala * k) + 'px';
        dica.style.top = ((pos.y - cam.y) * AM.render.escala * k) + 'px';
        dica.hidden = false;
      }
    }
    $('#obraBotoes').hidden = !AM.construcao.ativo();
  }

  function quadro(dt) { atualizarHud(dt); atualizarAcao(dt); }

  return { montar, atualizarHotbar, selecionar, atualizarRolo, atualizarTutorial, aviso, pegou, missaoConcluida, resumoDia, abrir, fechar, quadro, htmlSlot,
    aberto: () => painelAberto, corTile };
})();
