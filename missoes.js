// Guilda de Aventureiros: registro, quadro de missões (diárias e semanais),
// progresso pelos eventos do jogo, entrega e recompensas.
'use strict';

AM.missoes = (() => {
  const E = () => AM.E.missoes;
  const MAX_ATIVAS = 5;

  const MOBS_CACA = ['slime', 'goblin', 'esqueleto', 'lobo_selvagem', 'escorpiao', 'slime_azul', 'morcego'];
  const COLETA = [['madeira', 20, 40], ['pedra', 15, 30], ['fibra', 10, 20], ['minerio_ferro', 5, 10], ['gosma', 5, 10], ['osso', 4, 8], ['feno', 4, 8], ['carvao', 4, 8], ['couro', 2, 4], ['flor', 3, 6]];
  const NOME_MOB = t => AM.MOBS[t].nome.toLowerCase().replace(/^slime$/, 'slimes').replace(/^(.*)$/, '$1');

  function titulo(m) {
    switch (m.tipo) {
      case 'cacar': return `Derrote ${m.n} × ${AM.MOBS[m.alvo].nome}`;
      case 'coletar': return `Traga ${m.n} × ${AM.ITENS[m.alvo].nome}`;
      case 'colher': return `Colha ${m.n} × ${AM.CULTURAS[m.alvo].nome}`;
      case 'cozinhar': return `Cozinhe ${m.n} pratos`;
      case 'pescar': return `Pesque ${m.n} peixes`;
      case 'chefe': return `Derrote o chefe: ${AM.MASMORRAS.find(d => d.id === m.alvo).nome}`;
      case 'domesticar': return 'Domestique ou compre um animal';
      case 'construir': return `Construa: ${AM.PLANTAS[m.alvo].nome}`;
      case 'vender': return `Venda ${m.n} itens na sua loja`;
      case 'explorar': return `Entre em ${m.n} masmorras diferentes`;
    }
    return 'Missão';
  }
  const progresso = m => m.tipo === 'coletar' ? Math.min(m.n, AM.inv.contar(m.alvo)) : Math.min(m.n, m.prog);

  function gerar(dia, semanal) {
    const r = sorteador(AM.E.semente * 7 + dia * 131 + (semanal ? 999 : 0));
    const esc = l => l[Math.floor(r() * l.length)], ent = (a, b) => a + Math.floor(r() * (b - a + 1));
    const nivel = AM.jog.nivel, k = 1 + (nivel - 1) * .15;
    const lista = [];
    const tipos = semanal ? ['chefe', 'domesticar', 'construir', 'vender', 'explorar'] : ['cacar', 'coletar', 'colher', 'cozinhar', 'pescar', 'cacar', 'coletar'];
    const usados = new Set();
    while (lista.length < (semanal ? 2 : 3)) {
      const tipo = esc(tipos);
      if (usados.has(tipo)) continue;
      usados.add(tipo);
      const m = { id: `${semanal ? 's' : 'd'}${dia}-${tipo}`, tipo, prog: 0, periodo: semanal ? 'semanal' : 'diaria', coop: !!(AM.rede && AM.rede.conectado() && r() < .5) };
      switch (tipo) {
        case 'cacar': m.alvo = esc(MOBS_CACA); m.n = ent(3, 7); m.ouro = m.n * 18; m.xp = m.n * 7; break;
        case 'coletar': { const [it, a, b] = esc(COLETA); m.alvo = it; m.n = ent(a, b); m.ouro = Math.round(m.n * Math.max(6, AM.ITENS[it].preco * 1.6)); m.xp = 20; break; }
        case 'colher': {
          const cs = Object.keys(AM.CULTURAS).filter(c => AM.CULTURAS[c].estacoes.includes(AM.tempo.estacao));
          m.alvo = esc(cs); m.n = ent(3, 8); m.ouro = Math.round(AM.CULTURAS[m.alvo].preco * m.n * 1.4); m.xp = 25; break;
        }
        case 'cozinhar': m.n = ent(2, 4); m.ouro = m.n * 45; m.xp = 20; break;
        case 'pescar': m.n = ent(2, 5); m.ouro = m.n * 40; m.xp = 20; break;
        case 'chefe': { const vivos = AM.MASMORRAS.filter(d => !(AM.E.chefes || {})[d.id]); m.alvo = (vivos.length ? esc(vivos) : esc(AM.MASMORRAS)).id; m.n = 1; m.ouro = 600; m.xp = 200; break; }
        case 'domesticar': m.n = 1; m.ouro = 250; m.xp = 60; break;
        case 'construir': { const feitas = new Set(AM.E.construcoes.map(c => c.planta)); const ops = Object.keys(AM.PLANTAS).filter(p => !feitas.has(p)); m.alvo = esc(ops.length ? ops : Object.keys(AM.PLANTAS)); m.n = 1; m.ouro = Math.round(AM.PLANTAS[m.alvo].ouro * .8); m.xp = 120; break; }
        case 'vender': m.n = ent(4, 8); m.ouro = m.n * 30; m.xp = 80; break;
        case 'explorar': m.n = 2; m.ouro = 350; m.xp = 140; m.vistas = []; break;
      }
      m.ouro = Math.round(m.ouro * k); m.xp = Math.round(m.xp * k);
      m.titulo = titulo(m);
      lista.push(m);
    }
    return lista;
  }

  function novoDia() {
    const e = E(), dia = AM.tempo.dia;
    if (!e.registrado) return;
    const semana = Math.floor((dia - 1) / 7);
    // diárias vencem; semanais duram a semana
    e.ativas = e.ativas.filter(m => m.periodo === 'semanal' ? m.semana === semana : m.dia === dia);
    e.quadro = [...gerar(dia, false).map(m => ({ ...m, dia })), ...(e.semana === semana ? e.quadro.filter(m => m.periodo === 'semanal') : gerar(semana, true).map(m => ({ ...m, semana })))]
      .filter(m => !e.ativas.some(a => a.id === m.id) && !(e.feitasIds || []).includes(m.id));
    e.semana = semana;
    AM.ui && AM.ui.atualizarRolo();
  }

  function registrar() {
    const e = E();
    if (e.registrado) return;
    e.registrado = true;
    e.semana = -1;
    novoDia();
    AM.som('missao');
    AM.ui.aviso('Registro feito na Guilda! O quadro de missões está liberado.', 'ouro');
    AM.ev.emit('guilda_registro');
  }

  function aceitar(id) {
    const e = E(), m = e.quadro.find(q => q.id === id);
    if (!m) return;
    if (e.ativas.length >= MAX_ATIVAS) { AM.ui.aviso(`Você já tem ${MAX_ATIVAS} missões ativas.`); return; }
    e.quadro = e.quadro.filter(q => q !== m);
    e.ativas.push(m);
    AM.som('pop'); AM.ev.emit('missao_aceita', { m });
    AM.ui.atualizarRolo(true);
    verificar(m);
  }

  function concluir(m, remoto) {
    const e = E();
    e.ativas = e.ativas.filter(a => a !== m);
    (e.feitasIds ||= []).push(m.id);
    e.feitas = (e.feitas || 0) + 1;
    AM.sis.ganharOuro(m.ouro); AM.sis.ganharXP(m.xp, 'missao');
    AM.som('missao');
    AM.ui.missaoConcluida(m);
    AM.bot.falarDe('missaoFeita');
    AM.ev.emit('missao_feita', { m });
    if (!remoto && m.coop) AM.rede.missao(m);
    AM.ui.atualizarRolo();
  }

  function entregar(id) {
    const m = E().ativas.find(a => a.id === id);
    if (!m || m.tipo !== 'coletar') return;
    if (!AM.inv.remover(m.alvo, m.n)) { AM.ui.aviso(`Faltam ${m.n - AM.inv.contar(m.alvo)} × ${AM.ITENS[m.alvo].nome}.`); return; }
    concluir(m);
  }

  function verificar(m) { if (m.tipo !== 'coletar' && m.prog >= m.n) concluir(m); }
  function avancar(filtro, qtd = 1) {
    for (const m of [...E().ativas]) if (filtro(m)) { m.prog += qtd; verificar(m); }
    AM.ui && AM.ui.atualizarRolo();
  }

  // escuta o que acontece no jogo
  AM.ev.on('matou', d => {
    avancar(m => m.tipo === 'cacar' && (m.alvo === d.tipo || (m.alvo === 'slime' && d.tipo.startsWith('slime'))));
    if (d.chefe) avancar(m => m.tipo === 'chefe' && m.alvo === d.masmorra);
  });
  AM.ev.on('colheu', d => avancar(m => m.tipo === 'colher' && m.alvo === d.tipo, d.qtd));
  AM.ev.on('criou', d => { if (AM.ITENS[d.id].cat === 'comida') avancar(m => m.tipo === 'cozinhar', d.qtd); });
  AM.ev.on('pescou', () => avancar(m => m.tipo === 'pescar'));
  AM.ev.on('domou', () => avancar(m => m.tipo === 'domesticar'));
  AM.ev.on('novoAnimal', () => avancar(m => m.tipo === 'domesticar'));
  AM.ev.on('construiu', d => avancar(m => m.tipo === 'construir' && m.alvo === d.planta));
  AM.ev.on('vendeu', d => { if (!d.caixa) avancar(m => m.tipo === 'vender'); });
  AM.ev.on('entrou_masmorra', d => {
    for (const m of E().ativas) if (m.tipo === 'explorar' && !m.vistas.includes(d.id)) { m.vistas.push(d.id); m.prog = m.vistas.length; verificar(m); }
  });
  AM.ev.on('coletou', () => AM.ui && AM.ui.atualizarRolo());

  function concluirRemota(id, quem) {
    const m = E().ativas.find(a => a.id === id && a.coop);
    if (!m) return;
    AM.ui.aviso(`${quem || 'Um amigo'} concluiu a missão cooperativa! A recompensa é de todos.`, 'ouro');
    concluir(m, true);
  }

  return { registrar, aceitar, entregar, novoDia, progresso, titulo, concluirRemota, MAX_ATIVAS };
})();
