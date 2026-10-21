// Laço do jogo, novo jogo, salvar e carregar, música do momento e a ponte
// com o prólogo (a abertura vira o começo do jogo novo).
'use strict';

AM.jogo = (() => {
  let ultimo = 0, tTotal = 0, tSalvar = 120, pausaAte = 0, andou = 0, tMusica = 0, iniciado = false;
  const $ = s => document.querySelector(s);

  // ---------- estado ----------
  function novoEstado(nome, partida = {}) {
    const semente = Math.floor(Math.random() * 1e9);
    AM.mundo = AM.gerarMundo(semente);
    AM.mapa = AM.mundo;
    AM.E = {
      versao: 1, semente, partida: Object.assign({ modo: 'solo', ouroColetivo: false, construcoesCompartilhadas: true }, partida),
      tempo: { dia: 1, estacao: 0, diaEstacao: 1, ano: 1, minuto: 6 * 60, clima: 'sol' },
      missoes: { registrado: false, ativas: [], quadro: [], feitas: 0, feitasIds: [] },
      construcoes: [], animais: [], veiculos: [], tutorial: { passo: 0, feito: false }, estat: {}, chefes: {},
    };
    AM.tempo = AM.E.tempo;
    AM.jog = AM.novoJogador(nome, AM.mundo.spawn.x, AM.mundo.spawn.y);
    AM.inv.adicionar('vara', 1, true); AM.inv.adicionar('batata', 2, true);
  }

  function serializar() {
    const M = AM.mundo, j = AM.jog;
    const pos = AM.mapa.id === 'mundo' ? { x: j.x, y: j.y } : (AM.E.voltaMundo || { x: j.x, y: j.y });
    const jog = Object.assign({}, j, pos, { veiculo: undefined, veiculoIdx: j.veiculo ? AM.E.veiculos.indexOf(j.veiculo) : -1, acao: null, pesca: null });
    return JSON.stringify({
      versao: 1, salvoEm: Date.now(), E: AM.E, jog,
      mundo: { semente: M.semente, w: M.w, h: M.h, chao: AM.u.paraB64(M.chao), obj: AM.u.paraB64(M.obj), bioma: AM.u.paraB64(M.bioma),
        info: [...M.info], plantas: [...M.plantas], spawn: M.spawn, fazenda: M.fazenda, vila: M.vila, entradas: M.entradas },
    }, (k, v) => (k === 'classe' || k === 'vagar' ? undefined : v));
  }

  function carregar(texto) {
    const s = JSON.parse(texto), m = s.mundo;
    AM.mundo = { id: 'mundo', w: m.w, h: m.h, chao: AM.u.deB64(m.chao, Uint8Array), obj: AM.u.deB64(m.obj, Uint8Array), bioma: AM.u.deB64(m.bioma, Uint8Array),
      info: new Map(m.info), plantas: new Map(m.plantas), spawn: m.spawn, fazenda: m.fazenda, vila: m.vila, entradas: m.entradas };
    AM.mapa = AM.mundo; AM.masmorraCores = null;
    AM.E = s.E; AM.tempo = AM.E.tempo;
    AM.E.estat ||= {}; AM.E.chefes ||= {};
    AM.jog = s.jog;
    if (AM.jog.veiculoIdx >= 0) AM.jog.veiculo = AM.E.veiculos[AM.jog.veiculoIdx]; else AM.jog.montaria = null;
    AM.jog.invuln = 0; AM.jog.cd = 0;
    AM.criaturas.carregarMapa();
    AM.render && AM.render.sujarTudo();
    if (iniciado) { AM.ui.atualizarHotbar(); AM.ui.atualizarRolo(); AM.ui.atualizarTutorial(); }
  }

  function salvar(inicioDoDia) {
    if (AM.rede.conectado() && !AM.rede.anfitriao()) { AM.rede.guardarMeu(); return; }
    try {
      const txt = serializar();
      localStorage.setItem(AM.CHAVE_SAVE, txt);
      if (inicioDoDia === true) AM.snapshotDia = txt;
      AM.rede && AM.rede.salvarNuvem(txt);
    } catch (e) { AM.ui && AM.ui.aviso('Não consegui salvar neste navegador.'); }
  }

  // ---------- início ----------
  function montarTela() {
    if (iniciado) return;
    iniciado = true;
    AM.emJogo = true;
    document.body.classList.add('em-jogo');
    document.querySelector('#inicio').hidden = true;
    $('#ui').hidden = false;
    const cv = $('#telaJogo'); cv.hidden = false;
    AM.render.iniciar(cv);
    AM.ui.montar();
    AM.bot.iniciar();
    aplicarOpcoes();
    AM.input.ligar(true);
    addEventListener('keydown', teclaPainel);
    addEventListener('visibilitychange', () => { if (document.hidden) salvar(); });
    requestAnimationFrame(t => { ultimo = t; requestAnimationFrame(quadro); });
  }
  function comecar() {
    montarTela();
    AM.criaturas.carregarMapa();
    AM.render.sujarTudo();
    AM.ui.atualizarHotbar(); AM.ui.atualizarRolo(); AM.ui.atualizarTutorial();
    AM.tutorial.iniciar();
    trilhaDoMomento(true);
  }
  function iniciarNovo(nome, partida) {
    novoEstado(nome, partida);
    salvar(true);
    comecar();
    if (partida && partida.modo === 'coop' && AM.rede) AM.rede.criarSala();
  }
  function continuar() {
    try { const txt = localStorage.getItem(AM.CHAVE_SAVE); carregar(txt); AM.snapshotDia = txt; }
    catch (e) { alertaSave(); return; }
    comecar();
    setTimeout(() => AM.bot.falarDe('boasVindas'), 1200);
  }
  function alertaSave() { const p = $('#inicio p'); if (p) p.textContent = 'Não consegui abrir o jogo salvo. Comece um novo.'; }

  function aplicarOpcoes() {
    document.documentElement.style.setProperty('--escala-ui', AM.opc.escalaTexto || 1);
    if (typeof Som !== 'undefined') Som.alternar(AM.opc.som);
    trilhaDoMomento(true);
  }

  // música que combina com o momento
  let trilhaAtual = '';
  function trilhaDoMomento(forcar) {
    if (typeof Som === 'undefined' || !AM.tempo) return;
    let t = 'dia';
    if (!AM.opc.musica) t = 'nada';
    else if (AM.mapa && AM.mapa.id !== 'mundo') t = 'masmorra';
    else if (AM.sis.ehNoite()) t = 'noitejogo';
    else if (AM.tempo.estacao === 3) t = 'inverno';
    if (t !== trilhaAtual || forcar) { trilhaAtual = t; Som.trilha(t); }
  }

  // ---------- laço ----------
  function teclaPainel(e) {
    if (!AM.ui.aberto() || e.target.closest('input, textarea, select')) return;
    const fechaCom = { inventario: ['KeyE', 'KeyI'], quadro: ['KeyQ'], construir: ['KeyB'], atributos: ['KeyC'], mapa: ['KeyM'] }[AM.ui.aberto()] || [];
    if (e.code === 'Escape' || fechaCom.includes(e.code)) { e.preventDefault(); AM.ui.fechar(); }
  }

  function entrada(dt) {
    const I = AM.input, j = AM.jog;
    if (AM.ui.aberto() || AM.morto) return;
    for (let k = 1; k <= 8; k++) if (I.apertou('h' + k)) AM.ui.selecionar(k - 1);
    if (I.apertou('inventario')) return AM.ui.abrir('inventario');
    if (I.apertou('missoes')) return AM.ui.abrir('quadro');
    if (I.apertou('construir')) { if (AM.construcao.ativo()) AM.construcao.cancelar(); else AM.ui.abrir('construir'); return; }
    if (I.apertou('atributos')) return AM.ui.abrir('atributos');
    if (I.apertou('mapa')) return AM.ui.abrir('mapa');
    if (I.apertou('doidobot')) AM.bot.chamar();
    if (I.apertou('jutsu')) AM.criaturas.jutsu();
    if (I.apertou('chat')) { AM.paineis.definirAba('opc', 'multi'); return AM.ui.abrir('opcoes'); }
    if (I.apertou('pausa')) { if (AM.construcao.ativo()) { AM.construcao.cancelar(); AM.ui.aviso('Construção cancelada.'); } else AM.ui.abrir('opcoes'); return; }
    const ms = I.mouse;
    if (AM.construcao.ativo()) { if (I.apertou('usar') || ms.cliqueEsq) AM.construcao.confirmar(); }
    else if (I.seg('usar') || I.apertou('usar') || ms.esq) AM.usar();
    if (I.apertou('interagir') || ms.cliqueDir) AM.interagir();
    // movimento
    let ex = I.eixo();
    if (ex.x || ex.y) j.destino = null;
    else if (j.destino) ex = andarAteDestino(dt);
    j.andando = !!(ex.x || ex.y);
    const t = I.toque;
    j.correndo = (I.seg('correr') || (t.ativo && Math.hypot(t.x, t.y) > .93) || (j.destino && j.destino.correr)) && j.andando && !j.montaria;
    if (j.andando) {
      let vel = 70 * AM.atrib.velocidade() * (j.correndo ? 1.45 : 1);
      if (j.montaria === 'carrinho') vel *= (AM.m.ch(Math.floor(j.x / 16), Math.floor(j.y / 16)) === AM.CH.CAMINHO ? 2.4 : 1.7) * (AM.construcao.temCavalo() ? 1.3 : 1);
      if (j.montaria === 'balao') vel *= 1.5;
      if (j.pesca) j.pesca = null;
      const antes = { x: j.x, y: j.y };
      AM.mover(j, ex.x * vel * dt, ex.y * vel * dt, 4, j.montaria === 'balao');
      if (Math.abs(ex.x) > Math.abs(ex.y)) j.dir = ex.x < 0 ? 'esq' : 'dir'; else j.dir = ex.y < 0 ? 'cima' : 'baixo';
      andou += Math.hypot(j.x - antes.x, j.y - antes.y);
      if (andou > 64) { andou = -1e9; AM.ev.emit('moveu'); }
      if (j.montaria === 'carrinho' && Math.random() < dt * 4) AM.fx.nuvem(j.x, j.y, 1, ['#c9b080'], 10, -5, .5);
    }
  }

  // toque longe: anda até lá e, se tiver, faz a ação ao chegar
  function andarAteDestino(dt) {
    const j = AM.jog, d = j.destino;
    const alvo = d.ent ? { x: d.ent.x, y: d.ent.y } : d;
    const dx = alvo.x - j.x, dy = alvo.y - j.y, dist = Math.hypot(dx, dy);
    if (dist < (d.ent ? 20 : 5)) {
      j.destino = null;
      if (d.ao) d.ao();
      return { x: 0, y: 0 };
    }
    d.preso = (d.antes && Math.hypot(j.x - d.antes.x, j.y - d.antes.y) < .2) ? (d.preso || 0) + dt : 0;
    d.antes = { x: j.x, y: j.y };
    if (d.preso > .35) { j.destino = null; if (d.ao && dist < 40) d.ao(); return { x: 0, y: 0 }; }
    return { x: dx / dist, y: dy / dist };
  }

  function atualizar(dt) {
    const j = AM.jog;
    entrada(dt);
    if (j.kx || j.ky) { AM.mover(j, j.kx * dt, j.ky * dt); j.kx *= .82; j.ky *= .82; if (Math.abs(j.kx) + Math.abs(j.ky) < 4) j.kx = j.ky = 0; }
    j.cd = Math.max(0, j.cd - dt); j.invuln = Math.max(0, j.invuln - dt);
    if (j.acao && (j.acao.t += dt) > .25) j.acao = null;
    AM.atualizarPesca(dt);
    AM.sis.atualizar(dt);
    AM.criaturas.atualizar(dt);
    AM.construcao.atualizar(dt);
    AM.rede && AM.rede.atualizar(dt);
    if ((tMusica -= dt) <= 0) { tMusica = 3; trilhaDoMomento(); }
  }

  function quadro(agora) {
    requestAnimationFrame(quadro);
    const dt = Math.min(.05, (agora - ultimo) / 1000);
    ultimo = agora;
    const emRede = AM.rede && AM.rede.conectado();
    const pausado = (AM.ui.aberto() && AM.opc.semPressa && !emRede) || agora < pausaAte;
    if (!pausado) atualizar(dt * (AM.opc.velocidade || 1) * (AM.opc.lerdo ? .8 : 1));
    else if (AM.ui.aberto() && emRede) { AM.sis.atualizar(dt); AM.criaturas.atualizar(dt); AM.rede.atualizar(dt); }
    AM.bot.atualizar(dt);
    tTotal += dt;
    AM.render.quadro(tTotal, pausado ? 0 : dt);
    AM.ui.quadro(dt);
    AM.input.limpar();
    if ((tSalvar -= dt) <= 0) { tSalvar = 120; if (AM.mapa.id === 'mundo') salvar(); }
  }

  // escurece a tela, faz algo e clareia
  function transicao(fn) {
    const p = $('#preto');
    p.style.transition = 'opacity .5s'; p.style.setProperty('opacity', '1', 'important');
    setTimeout(() => { fn(); setTimeout(() => p.style.setProperty('opacity', '0', 'important'), 250); }, 550);
  }

  // ---------- tela de partida (depois do prólogo) ----------
  function telaPartida(nome) {
    const el = document.createElement('div');
    el.id = 'partida';
    el.innerHTML = `<div class="caixaPainel" style="width:min(30em,100%)"><h2>Nova partida</h2>
      <p>Seu nome: <input id="pNome" maxlength="14" value="${(nome || 'Viajante').replace(/"/g, '')}" style="font:inherit;border:2px solid var(--madeira);border-radius:6px;padding:2px 6px;background:#fffaf0"></p>
      ${AM.servidorOk ? `<div class="opcoes">
        <div class="op"><span>Modo<small>Cooperativo cria uma sala com código para até 8 amigos</small></span><select id="pModo"><option value="solo">Solo</option><option value="coop">Cooperativo</option></select></div>
        <div class="op"><span>Ouro<small>Só faz diferença no cooperativo</small></span><select id="pOuro"><option value="ind">Individual</option><option value="col">Coletivo</option></select></div>
        <div class="op"><span>Construções<small>No cooperativo, quem pode mexer nas construções</small></span><select id="pConstr"><option value="sim">Compartilhadas</option><option value="nao">Privadas</option></select></div>
      </div>` : ''}
      <button class="btn ouro" id="pIr">Começar em Aethermoor</button></div>`;
    // flex (e não grid) para a caixa nunca passar da tela: ela rola por dentro se precisar
    Object.assign(el.style, { position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,6,20,.7)', zIndex: 30, padding: '12px' });
    $('#palco').appendChild(el);
    el.querySelector('#pIr').onclick = () => {
      const v = (id, padrao) => { const c = el.querySelector(id); return c ? c.value : padrao; };
      const partida = { modo: v('#pModo', 'solo'), ouroColetivo: v('#pOuro', 'ind') === 'col', construcoesCompartilhadas: v('#pConstr', 'sim') === 'sim' };
      const n = el.querySelector('#pNome').value.trim() || 'Viajante';
      el.remove();
      if (typeof Som !== 'undefined') Som.iniciar();
      iniciarNovo(n, partida);
    };
  }

  return { iniciarNovo, continuar, carregar, salvar, serializar, transicao, aplicarOpcoes, trilhaDoMomento, telaPartida, comecar, novoEstado,
    pausaCurta: s => { pausaAte = performance.now() + s * 1000; } };
})();

// o modo online precisa do servidor do jogo (node servidor/servidor.js). Aberto do
// arquivo, a pessoa informa o endereço; num site sem servidor (GitHub Pages) fica só o solo.
AM.servidorOk = !location.protocol.startsWith('http');

// botões da tela inicial e atalhos de teste (?jogo começa direto, ?continuar carrega)
addEventListener('DOMContentLoaded', () => {
  const b = document.querySelector('#btnContinuar');
  if (AM.temSave()) {
    b.hidden = false;
    b.onclick = () => { if (typeof Som !== 'undefined') Som.iniciar(); document.querySelector('#inicio').hidden = true; AM.jogo.continuar(); };
  }
  // entrar na sala de um amigo direto da tela inicial (só aparece se o servidor do jogo estiver rodando)
  const box = b.parentElement, bs = document.createElement('button');
  bs.className = 'grande secundario'; bs.id = 'btnSala'; bs.textContent = 'Entrar numa sala';
  bs.hidden = !AM.servidorOk;
  box.appendChild(bs);
  if (!AM.servidorOk) {
    fetch('/api/doidobot', { signal: AbortSignal.timeout(3000) }).then(r => r.json())
      .then(() => { AM.servidorOk = true; bs.hidden = false; }).catch(() => { /* sem servidor (ex.: GitHub Pages): jogo solo */ });
  }
  bs.onclick = () => {
    const local = !location.protocol.startsWith('http');
    const f = document.createElement('form');
    f.style.cssText = 'display:grid;gap:8px;justify-items:center';
    f.innerHTML = `<input id="sCodigo" maxlength="5" placeholder="CÓDIGO DA SALA" required style="font:inherit;font-size:1.2em;text-transform:uppercase;text-align:center;width:9em;padding:4px 8px;border-radius:6px;border:2px solid var(--ouro)">
      <input id="sNome" maxlength="14" placeholder="Seu nome" style="font:inherit;text-align:center;width:12em;padding:4px 8px;border-radius:6px;border:2px solid #fff3">
      ${local ? '<input id="sServ" placeholder="ws://endereço:8080/ws" style="font:inherit;font-size:.8em;text-align:center;width:16em;padding:4px 8px;border-radius:6px">' : ''}
      <button class="grande">Entrar</button>`;
    box.replaceWith(f);
    if (local) { try { f.querySelector('#sServ').value = localStorage.getItem('aethermoor.servidor') || 'ws://localhost:8080/ws'; } catch (e) { /* tudo bem */ } }
    f.querySelector('#sCodigo').focus();
    f.onsubmit = e => {
      e.preventDefault();
      if (local) { try { localStorage.setItem('aethermoor.servidor', f.querySelector('#sServ').value.trim()); } catch (er) { /* tudo bem */ } }
      if (typeof Som !== 'undefined') Som.iniciar();
      document.querySelector('#inicio p').textContent = 'Conectando...';
      AM.rede.entrar(f.querySelector('#sCodigo').value.trim(), f.querySelector('#sNome').value.trim() || 'Viajante');
    };
  };
  const q = new URLSearchParams(location.search);
  if (q.has('jogo')) { document.querySelector('#inicio').hidden = true; AM.jogo.iniciarNovo(q.get('nome') || 'Teste', {}); }
  else if (q.has('continuar') && AM.temSave()) { document.querySelector('#inicio').hidden = true; AM.jogo.continuar(); }
});
