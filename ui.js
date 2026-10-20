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
        <div id="botoesJogo">
          <button data-acao="inventario">Inventário <kbd>E</kbd></button><button data-acao="construir">Construir <kbd>B</kbd></button>
          <button data-acao="missoes">Missões <kbd>Q</kbd></button><button data-acao="atributos">Atributos <kbd>C</kbd></button>
          <button data-acao="opcoes">Opções <kbd>Esc</kbd></button>
        </div>
      </div>
      <div id="roloJogo" hidden><span class="pau"></span><div class="perg"><button class="seta" data-r="-1" aria-label="Missão anterior">‹</button><span class="missaoAtual"></span><button class="seta" data-r="1" aria-label="Próxima missão">›</button><button class="recolher" aria-label="Recolher o rolo">▴</button></div><span class="pau"></span></div>
      <div id="roloLista" hidden></div>
      <div id="nomeItem" class="peca" style="opacity:0"></div>
      <div id="hotbar" class="peca"></div>
      <div id="avisos"></div>
      <div id="pegou"></div>
      <div id="botBox"><div id="botCabeca" title="Doidobot (H dá uma dica, clique para conversar)"></div><div id="botBalao" hidden><span class="txt"></span><button hidden>OK</button></div></div>
      <div id="toque" hidden><div id="joy"><i></i></div><button class="bToque" id="tInter">F</button><button class="bToque" id="tUsar">Usar</button></div>
      <div id="painel" hidden></div>`;
    $('#botoesJogo').onclick = e => { const b = e.target.closest('button'); if (b) abrir(b.dataset.acao === 'missoes' ? 'quadro' : b.dataset.acao); };
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
  function selecionar(i) {
    AM.jog.sel = (i + 8) % 8; AM.jog.pesca = null;
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
    cv.addEventListener('wheel', e => { e.preventDefault(); if (!painelAberto) selecionar(AM.jog.sel + (e.deltaY > 0 ? 1 : -1)); }, { passive: false });
  }

  // ---------- toque ----------
  function controlesDeToque() {
    const usarToque = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (!usarToque) return;
    AM.toqueAtivo = true;
    document.body.classList.add('toque');
    $('#toque').hidden = false;
    const joy = $('#joy'), bola = joy.querySelector('i'), t = AM.input.toque;
    let idJoy = null;
    const mover = e => {
      const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
      const n = Math.hypot(dx, dy); if (n > 1) { dx /= n; dy /= n; }
      t.x = Math.abs(dx) > .2 ? dx : 0; t.y = Math.abs(dy) > .2 ? dy : 0; t.ativo = true;
      bola.style.transform = `translate(${dx * 34}px, ${dy * 34}px)`;
    };
    joy.addEventListener('pointerdown', e => { idJoy = e.pointerId; joy.setPointerCapture(e.pointerId); mover(e); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === idJoy) mover(e); });
    const soltar = e => { if (e.pointerId !== idJoy) return; idJoy = null; t.ativo = false; t.x = t.y = 0; bola.style.transform = ''; };
    joy.addEventListener('pointerup', soltar); joy.addEventListener('pointercancel', soltar);
    const botao = (el, acao) => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); t.botoes.add(acao); t.novos.add(acao); });
      const fim = () => t.botoes.delete(acao);
      el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim); el.addEventListener('pointerleave', fim);
    };
    botao($('#tUsar'), 'usar'); botao($('#tInter'), 'interagir');
  }

  function quadro(dt) { atualizarHud(dt); }

  return { montar, atualizarHotbar, selecionar, atualizarRolo, atualizarTutorial, aviso, pegou, missaoConcluida, resumoDia, abrir, fechar, quadro, htmlSlot,
    aberto: () => painelAberto, corTile };
})();
