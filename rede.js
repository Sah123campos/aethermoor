// Multijogador: salas por código (até 8), posições dos outros jogadores,
// mudanças no mapa, relógio do anfitrião, ouro coletivo, missões
// cooperativas, todos dormem para passar o dia e salvamento na nuvem.
'use strict';

AM.rede = (() => {
  let ws = null, tPos = 0, tSalvar = 60, aplicando = false, nomeEntrada = null;
  const est = { conectado: false, anfitriao: true, codigo: null, id: null, ouro: 0, config: {}, jogadores: [] };
  const outros = new Map(), tilesPendentes = new Set();
  const PALETAS = ['morador1', 'morador2', 'morador3', 'brasa', 'tiao', 'bento', 'iara'];

  // ---------- conexão ----------
  function enderecoServidor() {
    if (location.protocol.startsWith('http')) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
    try { return localStorage.getItem('aethermoor.servidor') || 'ws://localhost:8080/ws'; } catch (e) { return 'ws://localhost:8080/ws'; }
  }
  function conectar(aoAbrir) {
    try { ws = new WebSocket(enderecoServidor()); } catch (e) { avisar('Endereço do servidor inválido.'); return; }
    ws.onopen = aoAbrir;
    ws.onmessage = e => { try { receber(JSON.parse(e.data)); } catch (erro) { console.error(erro); } };
    ws.onclose = () => { if (est.conectado) avisar('Você saiu da sala (conexão encerrada).'); est.conectado = false; est.anfitriao = true; outros.clear(); };
    ws.onerror = () => avisar('Não consegui falar com o servidor. Ele precisa estar rodando: node servidor.js');
  }
  const enviar = o => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
  const avisar = (t, tipo) => { if (AM.ui && document.querySelector('#avisos')) AM.ui.aviso(t, tipo); else { const p = document.querySelector('#inicio p'); if (p) p.textContent = t; } };

  function criarSala() {
    if (est.conectado) return;
    conectar(() => enviar({ t: 'criar', nome: AM.jog.nome, config: AM.E.partida, ouro: AM.jog.ouro, save: AM.jogo.serializar() }));
  }
  function entrar(codigo, nome) {
    if (est.conectado) return;
    nomeEntrada = nome || (AM.jog && AM.jog.nome) || 'Viajante';
    conectar(() => enviar({ t: 'entrar', codigo, nome: nomeEntrada }));
  }
  function sairDaSala() { if (ws) ws.close(); est.conectado = false; outros.clear(); avisar('Você saiu da sala.'); }

  // ---------- dados do próprio jogador numa sala (guardados neste navegador) ----------
  const chaveMeu = () => 'aethermoor.sala.' + est.codigo;
  function guardarMeu() {
    if (!AM.jog || !est.codigo) return;
    try { localStorage.setItem(chaveMeu(), JSON.stringify({ jog: Object.assign({}, AM.jog, { veiculo: undefined, acao: null, pesca: null }), missoes: AM.E.missoes, tutorial: AM.E.tutorial, estat: AM.E.estat })); } catch (e) { /* tudo bem */ }
  }
  function lerMeu() { try { return JSON.parse(localStorage.getItem(chaveMeu()) || 'null'); } catch (e) { return null; } }
  function guardarAmigo(codigo) {
    try {
      const l = JSON.parse(localStorage.getItem('aethermoor.amigos') || '[]').filter(a => a.codigo !== codigo);
      l.unshift({ codigo, nomes: est.jogadores.map(j => j.nome).join(', '), quando: Date.now() });
      localStorage.setItem('aethermoor.amigos', JSON.stringify(l.slice(0, 8)));
    } catch (e) { /* tudo bem */ }
  }
  const amigos = () => { try { return JSON.parse(localStorage.getItem('aethermoor.amigos') || '[]'); } catch (e) { return []; } };

  // ---------- mensagens ----------
  function receber(m) {
    switch (m.t) {
      case 'sala':
        Object.assign(est, { conectado: true, codigo: m.codigo, id: m.id, anfitriao: m.anfitriao, ouro: m.ouro, config: m.config || {}, jogadores: m.jogadores });
        if (est.config.ouroColetivo && m.anfitriao && AM.jog) { est.ouro = Math.max(est.ouro, 0); }
        guardarAmigo(m.codigo);
        avisar(m.anfitriao ? `Sala criada! Código: ${m.codigo}. Passe para os amigos.` : `Você entrou na sala ${m.codigo}. Baixando o mundo...`, 'ouro');
        break;
      case 'pedeEstado': if (est.anfitriao) enviar({ t: 'estado', para: m.para, dados: AM.jogo.serializar() }); break;
      case 'estado': aplicarEstado(m.dados, m.novoDia, m.retomar); break;
      case 'pos': {
        const o = outros.get(m.id) || { x: m.x, y: m.y, paleta: PALETAS[m.id % PALETAS.length] };
        Object.assign(o, m, { alvoX: m.x, alvoY: m.y, x: o.x, y: o.y, visto: performance.now() });
        outros.set(m.id, o);
        break;
      }
      case 'entrou': est.jogadores.push({ id: m.id, nome: m.nome }); avisar(`${m.nome} entrou no mundo!`, 'ouro'); AM.bot && AM.bot.falar(`${m.nome} chegou! Mais um melhor amigo pra minha coleção! ❤️`, 'apaixonado'); break;
      case 'saiu': outros.delete(m.id); est.jogadores = est.jogadores.filter(j => j.id !== m.id); avisar(`${m.nome} saiu.`); break;
      case 'tiles': aplicarTiles(m.lista); break;
      case 'tempo': if (!est.anfitriao && AM.tempo) Object.assign(AM.tempo, m.tempo); break;
      case 'ouro': est.ouro = m.total; break;
      case 'chat': avisar(`${m.nome}: ${m.texto}`, 'roxo'); break;
      case 'missao': AM.missoes.concluirRemota(m.missao, m.nome); break;
      case 'construcao': if (AM.E && !AM.E.construcoes.some(c => c.id === m.c.id)) AM.E.construcoes.push(m.c); break;
      case 'dormindo': avisar(`${m.n} de ${m.total} jogadores dormindo. O dia passa quando todos dormirem.`); break;
      case 'novoDia': if (est.anfitriao) passarDiaComoAnfitriao(); break;
      case 'anfitriao': est.anfitriao = true; avisar('Você agora é o anfitrião da sala (o mundo roda no seu jogo).', 'ouro'); break;
      case 'erro': avisar(m.msg); if (ws) ws.close(); break;
    }
  }

  function aplicarEstado(texto, novoDia, retomar) {
    const meuAntes = AM.jog && AM.E ? { jog: AM.jog, missoes: AM.E.missoes, tutorial: AM.E.tutorial, estat: AM.E.estat } : lerMeu();
    aplicando = true;
    AM.jogo.carregar(texto);
    aplicando = false;
    if (!retomar) {
      if (meuAntes) Object.assign(AM.E, { missoes: meuAntes.missoes, tutorial: meuAntes.tutorial, estat: meuAntes.estat || {} }), (AM.jog = meuAntes.jog);
      else {
        AM.jog = AM.novoJogador(nomeEntrada || 'Viajante', AM.mundo.spawn.x + 2, AM.mundo.spawn.y);
        AM.E.missoes = { registrado: false, ativas: [], quadro: [], feitas: 0, feitasIds: [] };
        AM.E.tutorial = { passo: 0, feito: false }; AM.E.estat = {};
      }
      AM.jog.veiculo = null; AM.jog.montaria = null;
    }
    if (!AM.emJogo) AM.jogo.comecar(); else { AM.criaturas.carregarMapa(); AM.ui.atualizarHotbar(); AM.ui.atualizarRolo(); }
    if (novoDia) {
      const j = AM.jog;
      j.x = j.checkpoint.x; j.y = j.checkpoint.y; j.vida = j.vidaMax;
      AM.missoes.novoDia();
      AM.ui.resumoDia([], true);
    }
    guardarMeu();
  }

  function passarDiaComoAnfitriao() {
    const rel = AM.sis.novoDia(true), j = AM.jog;
    j.x = j.checkpoint.x; j.y = j.checkpoint.y;
    AM.jogo.salvar(true);
    enviar({ t: 'estado', todos: true, novoDia: true, dados: AM.jogo.serializar() });
    AM.ui.resumoDia(rel, true);
  }

  // ---------- mudanças no mapa ----------
  function tile(x, y) { if (est.conectado && !aplicando && AM.mapa === AM.mundo) tilesPendentes.add(y * AM.mundo.w + x); }
  function aplicarTiles(lista) {
    const M = AM.mundo;
    aplicando = true;
    for (const t of lista) {
      M.chao[t.i] = t.ch; M.obj[t.i] = t.ob;
      if (t.info) M.info.set(t.i, t.info); else M.info.delete(t.i);
      if (t.planta) M.plantas.set(t.i, t.planta); else M.plantas.delete(t.i);
      if (AM.mapa === M) AM.render.sujar(t.i % M.w, Math.floor(t.i / M.w));
    }
    aplicando = false;
  }

  function atualizar(dt) {
    if (!est.conectado) return;
    if (tilesPendentes.size) {
      const M = AM.mundo;
      enviar({ t: 'tiles', lista: [...tilesPendentes].map(i => ({ i, ch: M.chao[i], ob: M.obj[i], info: M.info.get(i) || null, planta: M.plantas.get(i) || null })) });
      tilesPendentes.clear();
    }
    if ((tPos -= dt) <= 0) {
      tPos = .1;
      const j = AM.jog;
      enviar({ t: 'pos', x: Math.round(j.x), y: Math.round(j.y), dir: j.dir, andando: j.andando, montaria: j.montaria, faixa: j.faixa, nome: j.nome, mapa: AM.mapa.id });
    }
    for (const o of outros.values()) { o.x += (o.alvoX - o.x) * Math.min(1, dt * 10); o.y += (o.alvoY - o.y) * Math.min(1, dt * 10); }
    if ((tSalvar -= dt) <= 0) { tSalvar = 60; if (est.anfitriao) enviar({ t: 'salvar', dados: AM.jogo.serializar() }); else guardarMeu(); }
  }

  // ---------- painel (aba Multijogador das opções) ----------
  function painelHtml() {
    const local = !location.protocol.startsWith('http');
    let h = '<div class="opcoes">';
    if (est.conectado) {
      h += `<p>Sala <b style="font-size:1.3em;letter-spacing:.1em">${est.codigo}</b> · você é ${est.anfitriao ? '<b>anfitrião</b>' : 'convidado'}${est.config.ouroColetivo ? ' · ouro coletivo' : ''}</p>
        <p>Jogadores: ${est.jogadores.map(j => j.nome).join(', ')}</p>
        <form id="mChat" style="display:flex;gap:6px"><input type="text" id="mMsg" maxlength="200" placeholder="Mensagem para a sala" style="flex:1;min-width:0"><button class="btn">Enviar</button></form>
        <button class="btn claro" id="mSair">Sair da sala</button>`;
    } else {
      h += `<p>Jogue junto com até 8 pessoas no mesmo mundo. Uma pessoa roda o servidor (<code>node servidor.js</code>) e todos abrem o endereço dele no navegador.</p>
        ${local ? `<div class="op"><span>Servidor<small>Você abriu o jogo direto do arquivo, então diga onde está o servidor</small></span><input type="text" id="mServ" value="${enderecoServidor()}"></div>` : ''}
        <div class="op"><span>Criar sala<small>Seu mundo atual vira o mundo da sala</small></span><button class="btn ouro" id="mCriar">Criar sala</button></div>
        <form class="op" id="mEntrar"><span>Entrar numa sala<small>Use o código que o amigo passou. Seu mundo atual continua salvo neste navegador.</small></span><span style="display:flex;gap:6px"><input type="text" id="mCodigo" maxlength="5" placeholder="CÓDIGO" style="width:6em;text-transform:uppercase"><button class="btn">Entrar</button></span></form>
        ${amigos().length ? `<h3>Salas recentes (amigos)</h3><div class="lista">${amigos().map(a => `<div class="linha"><b>${a.codigo}</b><small>${a.nomes || ''}</small><button class="btn claro" data-sala="${a.codigo}">Entrar</button></div>`).join('')}</div>` : ''}`;
    }
    return h + '</div>';
  }
  function ligarPainel(el) {
    const b = id => el.querySelector('#' + id);
    if (b('mServ')) b('mServ').onchange = e => { try { localStorage.setItem('aethermoor.servidor', e.target.value.trim()); } catch (er) { /* tudo bem */ } };
    if (b('mCriar')) b('mCriar').onclick = () => { AM.ui.fechar(); criarSala(); };
    if (b('mEntrar')) b('mEntrar').onsubmit = e => { e.preventDefault(); const k = b('mCodigo').value.trim(); if (k) { AM.jogo.salvar(); AM.ui.fechar(); entrar(k); } };
    el.querySelectorAll('[data-sala]').forEach(bt => { bt.onclick = () => { AM.jogo.salvar(); AM.ui.fechar(); entrar(bt.dataset.sala); }; });
    if (b('mChat')) b('mChat').onsubmit = e => { e.preventDefault(); const t = b('mMsg').value.trim(); if (t) { enviar({ t: 'chat', texto: t }); b('mMsg').value = ''; } };
    if (b('mSair')) b('mSair').onclick = () => { AM.ui.fechar(); sairDaSala(); };
  }

  return {
    criarSala, entrar, sairDaSala, tile, atualizar, painelHtml, ligarPainel, guardarMeu,
    conectado: () => est.conectado,
    anfitriao: () => !est.conectado || est.anfitriao,
    ouroColetivo: () => est.conectado && !!est.config.ouroColetivo,
    ouro: n => { est.ouro += n; enviar({ t: 'ouro', delta: n }); },
    gastarOuro: n => { if (est.ouro < n) return false; est.ouro -= n; enviar({ t: 'ouro', delta: -n }); return true; },
    ouroTotal: () => est.ouro,
    outros: () => [...outros.values()].filter(o => o.mapa === (AM.mapa && AM.mapa.id) && performance.now() - o.visto < 5000),
    tempo: forcar => { if (est.conectado && est.anfitriao) enviar({ t: 'tempo', tempo: AM.tempo }); },
    missao: m => enviar({ t: 'missao', missao: m.id, nome: AM.jog.nome }),
    construcao: c => enviar({ t: 'construcao', c }),
    dormir: () => enviar({ t: 'dormir' }),
    salvarNuvem: txt => { if (est.conectado && est.anfitriao) enviar({ t: 'salvar', dados: txt }); },
    get codigo() { return est.codigo; },
  };
})();
