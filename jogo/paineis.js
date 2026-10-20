// Painéis: inventário, criação (bancada, fogueira, fogão, forno), baú, lojas,
// Guilda e quadro de missões, construção, atributos, mapa, opções, conversa
// com o Doidobot, cama, veículo e resumo do dia.
'use strict';

AM.paineis = (() => {
  const $p = () => document.querySelector('#painel');
  let atual = null, dadosAtual = null, selInv = null, aba = {};
  const img = id => `<img src="${AM.spr.iconeURL(id)}" alt="">`;
  const nome = id => id.startsWith('animal:') ? AM.ANIMAIS[id.slice(7)].nome : AM.ITENS[id].nome;

  function caixa(titulo, corpo, largura) {
    $p().innerHTML = `<div class="caixaPainel" role="dialog" aria-label="${titulo}" ${largura ? `style="width:min(${largura},100%)"` : ''}><h2><span>${titulo}</span><button class="fechar" data-fechar>Fechar</button></h2>${corpo}</div>`;
    $p().querySelector('[data-fechar]').onclick = () => AM.ui.fechar();
    $p().onclick = e => { if (e.target === $p()) AM.ui.fechar(); };
    return $p().querySelector('.caixaPainel');
  }
  function abas(nomes, chave, padrao) {
    aba[chave] ||= padrao;
    return `<div class="abas" role="tablist">${nomes.map(([id, rot]) => `<button role="tab" data-aba="${id}" aria-selected="${aba[chave] === id}">${rot}</button>`).join('')}</div>`;
  }
  function ligarAbas(el, chave) { el.querySelectorAll('[data-aba]').forEach(b => { b.onclick = () => { aba[chave] = b.dataset.aba; redesenhar(); }; }); }
  function ingHtml(ing, mult = 1) {
    return `<span class="ing">${Object.entries(ing).map(([id, q]) => { const tem = AM.inv.contar(id); return `<span class="${tem < q * mult ? 'falta' : ''}">${img(id)}${q * mult} ${AM.ITENS[id].nome}<small>(${tem})</small></span>`; }).join('')}</span>`;
  }
  function redesenhar() { if (atual && P[atual]) P[atual](dadosAtual, true); }

  // ---------- inventário ----------
  function detalheItem(i) {
    const it = AM.jog.inv[i];
    if (!it) return '<p>Clique num item para ver detalhes. Clique em dois espaços para trocar de lugar (os 8 primeiros são a hotbar).</p>';
    const d = AM.ITENS[it.id], c = d.comida;
    const acoes = [];
    if (c) acoes.push(`<button class="btn" data-ac="comer">${d.cat === 'bebida' ? 'Beber' : 'Comer'}</button>`);
    if (d.cat === 'cosmetico') acoes.push(`<button class="btn" data-ac="equipar">${AM.jog.faixa ? 'Tirar' : 'Equipar'}</button>`);
    if (i >= 8) acoes.push('<button class="btn claro" data-ac="hotbar">Pôr na hotbar</button>');
    acoes.push('<button class="btn claro" data-ac="largar">Largar</button>');
    return `<b>${d.nome}</b> ${it.qtd > 1 ? '× ' + it.qtd : ''}<br><small>${d.desc || ''}${c ? ` Fome +${c.fome}, sede +${c.sede}${c.vida ? `, vida ${c.vida > 0 ? '+' : ''}${c.vida}` : ''}.` : ''}${d.dano ? ` Dano ${d.dano}.` : ''} Vale ${d.preco} de ouro.</small><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${acoes.join('')}</div>`;
  }
  function gradeInv(sel) {
    return `<div class="grade">${AM.jog.inv.map((it, i) => `<button class="slot ${i === sel ? 'sel' : ''}" data-s="${i}" title="${it ? AM.ITENS[it.id].nome : 'vazio'}">${AM.ui.htmlSlot(it, i < 8 ? i + 1 : 0)}</button>`).join('')}</div>`;
  }
  const P = {};
  P.inventario = (d, re) => {
    if (!re) selInv = null;
    const t = aba.inv || 'itens';
    const el = caixa('Inventário', abas([['itens', 'Itens'], ['criar', 'Criar à mão']], 'inv', 'itens') + (t === 'itens'
      ? `${gradeInv(selInv)}<div class="detalhe">${detalheItem(selInv)}</div>`
      : listaReceitas('mao')));
    ligarAbas(el, 'inv');
    if (t === 'itens') {
      el.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => {
        const i = +b.dataset.s;
        if (selInv != null && selInv !== i) { const inv = AM.jog.inv; [inv[selInv], inv[i]] = [inv[i], inv[selInv]]; selInv = null; AM.ui.atualizarHotbar(); }
        else selInv = selInv === i ? null : i;
        redesenhar();
      }; });
      el.querySelectorAll('[data-ac]').forEach(b => { b.onclick = () => {
        const it = AM.jog.inv[selInv]; if (!it) return;
        if (b.dataset.ac === 'comer') AM.comer(it.id);
        if (b.dataset.ac === 'equipar') { AM.jog.faixa = !AM.jog.faixa; AM.ui.aviso(AM.jog.faixa ? 'Faixa ninja equipada! Aperte J.' : 'Faixa guardada.'); }
        if (b.dataset.ac === 'hotbar') { const vazio = AM.jog.inv.findIndex((s, k) => k < 8 && !s); const k = vazio >= 0 ? vazio : Math.max(0, AM.jog.sel); const inv = AM.jog.inv; [inv[k], inv[selInv]] = [inv[selInv], inv[k]]; selInv = k; }
        if (b.dataset.ac === 'largar') { AM.criaturas.soltarItem(it.id, it.qtd, AM.jog.x, AM.jog.y + 14); AM.jog.inv[selInv] = null; selInv = null; }
        AM.ui.atualizarHotbar(); redesenhar();
      }; });
    } else ligarReceitas(el, 'mao');
  };

  // ---------- criação ----------
  function receitasDe(estacao) {
    const ok = AM.ESTACOES_TRABALHO[estacao] || ['mao'];   // o que cada estação consegue fazer
    return AM.RECEITAS.filter(r => ok.includes(r.em));
  }
  function listaReceitas(estacao) {
    const l = receitasDe(estacao);
    return `<div class="lista">${l.map((r, k) => {
      const def = AM.ITENS[r.res], pode = AM.inv.tem(r.ing);
      return `<div class="linha ${pode ? '' : 'indisponivel'}">${img(r.res)}<div><b>${def.nome}${r.qtd > 1 ? ' × ' + r.qtd : ''}</b><small>${def.desc || ''}</small>${ingHtml(r.ing)}</div><div style="display:grid;gap:4px"><button class="btn" data-r="${AM.RECEITAS.indexOf(r)}" ${pode ? '' : 'disabled'}>Criar</button>${pode && AM.inv.tem(Object.fromEntries(Object.entries(r.ing).map(([a, q]) => [a, q * 5]))) ? `<button class="btn claro" data-r5="${AM.RECEITAS.indexOf(r)}">×5</button>` : ''}</div></div>`;
    }).join('')}</div>${estacao === 'mao' ? '<p><small>Use uma bancada (F perto dela) para receitas de construção, ferramentas e veículos. Fogueira, fogão e forno cozinham.</small></p>' : ''}`;
  }
  function criar(r, vezes, estacao) {
    for (let k = 0; k < vezes; k++) {
      if (!AM.inv.gastar(r.ing)) break;
      AM.inv.dar(r.res, r.qtd || 1);
      AM.sis.ganharXP(estacao === 'mao' ? 1 : 2, 'criar');
      AM.ev.emit('criou', { id: r.res, qtd: r.qtd || 1, estacao });
    }
    AM.som(['fogo', 'fogao', 'forno'].includes(estacao) ? 'fogo' : 'martelo');
  }
  function ligarReceitas(el, estacao) {
    el.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { criar(AM.RECEITAS[+b.dataset.r], 1, estacao); redesenhar(); }; });
    el.querySelectorAll('[data-r5]').forEach(b => { b.onclick = () => { criar(AM.RECEITAS[+b.dataset.r5], 5, estacao); redesenhar(); }; });
  }
  P.criar = d => {
    const titulo = { bancada: 'Bancada', fogo: 'Fogueira: esquentar e cozinhar', fogao: 'Fogão', forno: 'Forno' }[d.estacao] || 'Criar';
    const el = caixa(titulo, listaReceitas(d.estacao));
    ligarReceitas(el, d.estacao);
  };

  // ---------- baú, caixa de vendas, balcão, carga do carrinho ----------
  P.bau = d => {
    const info = d.lista ? null : (AM.m.info(d.x, d.y) || (AM.m.setInfo(d.x, d.y, { itens: [] }), AM.m.info(d.x, d.y)));
    const itens = d.lista || (info.itens ||= []);
    const tam = d.tam || (d.balcao ? 8 : 24);
    while (itens.length < tam) itens.push(null);
    const total = d.venda ? itens.reduce((s, it) => s + (it ? AM.precoVenda(it.id, AM.jog.atrib.carisma) * it.qtd : 0), 0) : 0;
    const dica = d.venda ? `<p>Itens aqui são vendidos durante a noite. Valor: <b>${total}</b> de ouro.</p>` : d.balcao ? '<p>Clientes da vila compram o que está no balcão entre 8h e 20h, por 20% a mais.</p>' : '';
    const el = caixa(d.titulo || 'Baú', `${dica}<h3>${d.titulo || 'Baú'}</h3><div class="grade">${itens.map((it, i) => `<button class="slot" data-b="${i}">${AM.ui.htmlSlot(it)}</button>`).join('')}</div>
      <h3>Seu inventário (clique para mover)</h3>${gradeInv(-1)}`);
    el.querySelectorAll('[data-b]').forEach(b => { b.onclick = () => {
      const i = +b.dataset.b, it = itens[i]; if (!it) return;
      const sobra = AM.inv.adicionar(it.id, it.qtd, true);
      if (sobra) it.qtd = sobra; else itens[i] = null;
      AM.som('pegar'); if (!d.lista) AM.rede.tile(d.x, d.y); redesenhar();
    }; });
    el.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => {
      const i = +b.dataset.s, it = AM.jog.inv[i]; if (!it) return;
      const def = AM.ITENS[it.id];
      if ((d.venda || d.balcao) && (def.cat === 'ferramenta' || it.id === 'retorno_morte')) { AM.ui.aviso('Esse item não dá para vender.'); return; }
      let resto = it.qtd;
      for (let k = 0; k < itens.length && resto; k++) if (itens[k] && itens[k].id === it.id && itens[k].qtd < def.pilha) { const n = Math.min(resto, def.pilha - itens[k].qtd); itens[k].qtd += n; resto -= n; }
      const vazio = itens.findIndex(s => !s);
      if (resto && vazio >= 0) { itens[vazio] = { ...it, qtd: resto }; resto = 0; }
      if (resto) { it.qtd = resto; AM.ui.aviso('Cheio!'); } else AM.jog.inv[i] = null;
      AM.som('colocar'); if (!d.lista) AM.rede.tile(d.x, d.y); AM.ui.atualizarHotbar(); redesenhar();
    }; });
  };
  P.veiculo = d => {
    const v = d.v;
    const el = caixa(AM.ITENS[v.tipo].nome, `<p>${AM.ITENS[v.tipo].desc}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ouro" id="subir">Subir</button>${v.inv ? '<button class="btn claro" id="carga">Abrir a carga</button>' : ''}<button class="btn claro" id="guardar">Guardar no inventário</button></div>`);
    el.querySelector('#subir').onclick = () => { AM.ui.fechar(); AM.criaturas.montar(v); };
    if (v.inv) el.querySelector('#carga').onclick = () => { atual = 'bau'; dadosAtual = { lista: v.inv, tam: 8, titulo: 'Carga do carrinho' }; P.bau(dadosAtual); };
    el.querySelector('#guardar').onclick = () => {
      if (v.inv && v.inv.some(Boolean)) { AM.ui.aviso('Esvazie a carga primeiro.'); return; }
      if (AM.inv.adicionar(v.tipo, 1)) return;
      AM.E.veiculos.splice(AM.E.veiculos.indexOf(v), 1); AM.ents.splice(AM.ents.indexOf(v), 1); AM.ui.fechar();
    };
  };

  // ---------- lojas ----------
  P.loja = d => {
    const loja = AM.LOJAS[d.loja], t = aba.loja || 'comprar';
    const amigo = loja.npc ? AM.npc.descontoAmizade(loja.npc) : 0, car = AM.jog.atrib.carisma + amigo;
    let corpo = abas([['comprar', 'Comprar'], ['vender', 'Vender']], 'loja', 'comprar') + `<p>Seu ouro: <b>${AM.sis.ouro()}</b>${car ? ` · ${amigo ? `amizade com ${loja.npc} e ` : ''}carisma deixam os preços melhores` : ''}</p>`;
    if (t === 'comprar') {
      corpo += `<div class="lista">${loja.vende(AM.tempo.estacao).map(id => {
        const preco = AM.precoCompra(id, car), animal = id.startsWith('animal:');
        const desc = animal ? (AM.ANIMAIS[id.slice(7)].desc || `Precisa de um ${AM.PLANTAS[AM.ANIMAIS[id.slice(7)].abrigo].nome.toLowerCase()}.`) : (AM.ITENS[id].desc || '');
        return `<div class="linha">${img(id)}<div><b>${nome(id)}</b><small>${desc}</small></div><div style="display:grid;gap:4px"><button class="btn" data-c="${id}" ${AM.sis.ouro() < preco ? 'disabled' : ''}>${preco} ●</button>${!animal && AM.ITENS[id].pilha > 1 ? `<button class="btn claro" data-c5="${id}" ${AM.sis.ouro() < preco * 5 ? 'disabled' : ''}>×5</button>` : ''}</div></div>`;
      }).join('')}</div>`;
    } else {
      const meus = [...new Set(AM.jog.inv.filter(it => it && loja.compra.includes(AM.ITENS[it.id].cat) && AM.ITENS[it.id].preco > 0).map(it => it.id))];
      corpo += meus.length ? `<div class="lista">${meus.map(id => { const v = AM.precoVenda(id, car), q = AM.inv.contar(id); return `<div class="linha">${img(id)}<div><b>${AM.ITENS[id].nome}</b><small>Você tem ${q}. ${v} de ouro cada.</small></div><div style="display:grid;gap:4px"><button class="btn" data-v="${id}">Vender 1</button>${q > 1 ? `<button class="btn claro" data-vt="${id}">Todos (${v * q})</button>` : ''}</div></div>`; }).join('')}</div>` : '<p>Você não tem nada que interesse a esta loja.</p>';
    }
    const el = caixa(loja.nome, corpo);
    ligarAbas(el, 'loja');
    const comprar = (id, n) => {
      if (id.startsWith('animal:')) { if (AM.construcao.comprarAnimal(id.slice(7))) redesenhar(); return; }
      for (let k = 0; k < n; k++) { const preco = AM.precoCompra(id, car); if (!AM.sis.gastarOuro(preco)) break; AM.inv.dar(id, 1); }
      AM.som('moeda'); AM.ev.emit('comprou', { id }); redesenhar();
    };
    el.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => comprar(b.dataset.c, 1); });
    el.querySelectorAll('[data-c5]').forEach(b => { b.onclick = () => comprar(b.dataset.c5, 5); });
    const vender = (id, n) => { if (!AM.inv.remover(id, n)) return; const v = AM.precoVenda(id, car) * n; AM.sis.ganharOuro(v); AM.som('moeda'); AM.fx.texto(AM.jog.x, AM.jog.y - 28, `+${v} ouro`, '#ffd23f'); redesenhar(); };
    el.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => vender(b.dataset.v, 1); });
    el.querySelectorAll('[data-vt]').forEach(b => { b.onclick = () => vender(b.dataset.vt, AM.inv.contar(b.dataset.vt)); });
  };

  // ---------- conversa com moradores ----------
  P.npc = (d, re) => {
    const e = d.e, nome = e.nome, info = AM.NPCS[nome] || { titulo: '' };
    if (!re) d.fala = AM.npc.conversar(nome);
    const cor = AM.npc.coracoes(nome);
    const botoes = [];
    if (!d.presente) {
      botoes.push('<button class="btn" data-n="conversar">Conversar</button>');
      if (e.loja === 'guilda') botoes.push('<button class="btn ouro" data-n="guilda">Guilda</button><button class="btn" data-n="quadro">Missões</button><button class="btn claro" data-n="loja">Poções e flechas</button>');
      else if (e.loja) botoes.push('<button class="btn ouro" data-n="loja">Comprar e vender</button>');
      botoes.push('<button class="btn claro" data-n="presente">Dar presente</button><button class="btn claro" data-fechar2>Tchau</button>');
    }
    const presentes = d.presente ? AM.jog.inv.map((it, i) => ({ it, i })).filter(({ it }) => it && !['ferramenta', 'veiculo'].includes(AM.ITENS[it.id].cat) && it.id !== 'retorno_morte') : [];
    const el = caixa(nome, `<div class="npcCaixa"><div class="npcRetrato"><canvas width="64" height="96"></canvas><b>${nome}</b><small>${info.titulo}</small><span class="coracoes" title="Amizade">${'❤'.repeat(cor)}${'♡'.repeat(10 - cor)}</span></div>
      <div class="npcFala"><p class="balaoNpc">${d.fala}</p>
      ${d.presente ? `<h3>Escolha um presente (um por dia)</h3>${presentes.length ? `<div class="grade">${presentes.map(({ it, i }) => `<button class="slot" data-pr="${i}" title="${AM.ITENS[it.id].nome}">${AM.ui.htmlSlot(it)}</button>`).join('')}</div>` : '<p>Você não tem nada para dar agora.</p>'}<button class="btn claro" data-n="voltar">Voltar</button>` : `<div class="npcBotoes">${botoes.join('')}</div>`}</div></div>`, '40em');
    const cv = el.querySelector('canvas'), x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(AM.spr.pessoa(e.paleta, 'baixo', 0), 0, 0, 16, 24, 0, 0, 64, 96);
    el.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => {
      const a = b.dataset.n;
      if (a === 'conversar') { d.fala = AM.npc.fala(nome); AM.som('pop'); redesenhar(); if (Math.random() < .2) AM.bot.comentarNpc(nome); }
      else if (a === 'loja') AM.ui.abrir('loja', { loja: e.loja });
      else if (a === 'guilda') AM.ui.abrir('guilda');
      else if (a === 'quadro') AM.ui.abrir('quadro');
      else if (a === 'presente') { d.presente = true; redesenhar(); }
      else if (a === 'voltar') { d.presente = false; redesenhar(); }
    }; });
    el.querySelectorAll('[data-pr]').forEach(b => { b.onclick = () => {
      const it = AM.jog.inv[+b.dataset.pr]; if (!it) return;
      d.fala = AM.npc.presentear(nome, it.id) || d.fala; d.presente = false;
      AM.ui.atualizarHotbar(); redesenhar();
    }; });
    const f = el.querySelector('[data-fechar2]'); if (f) f.onclick = () => AM.ui.fechar();
  };

  // ---------- Guilda e quadro de missões ----------
  P.guilda = () => {
    const e = AM.E.missoes;
    const corpo = e.registrado
      ? `<p><b>Iara:</b> Bom te ver, ${AM.jog.nome}! Missões concluídas: <b>${e.feitas || 0}</b>. O quadro fica aqui do lado, e as missões mudam todo dia (as semanais, toda semana).</p>
         <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ouro" id="verQuadro">Ver o quadro de missões</button><button class="btn claro" id="lojaGuilda">Comprar poções e flechas</button></div>`
      : `<p><b>Iara:</b> Bem-vindo à Guilda de Aventureiros! Aqui a gente caça criaturas, explora masmorras e ajuda a vila. O registro é de graça. Quer entrar?</p>
         <button class="btn ouro" id="registrar">Registrar na Guilda (grátis)</button>`;
    const el = caixa('Guilda de Aventureiros', corpo);
    const b = el.querySelector('#registrar'); if (b) b.onclick = () => { AM.missoes.registrar(); redesenhar(); };
    const q = el.querySelector('#verQuadro'); if (q) q.onclick = () => AM.ui.abrir('quadro');
    const l = el.querySelector('#lojaGuilda'); if (l) l.onclick = () => AM.ui.abrir('loja', { loja: 'guilda' });
  };
  P.quadro = () => {
    const e = AM.E.missoes;
    if (!e.registrado) { caixa('Quadro de missões', '<p>O quadro é só para membros da Guilda. Fale com a Iara, no centro da vila, para se registrar (é de graça).</p>'); return; }
    const linhaM = (m, ativa) => {
      const prog = AM.missoes.progresso(m), pronto = m.tipo === 'coletar' && prog >= m.n;
      return `<div class="linha"><span style="font-size:1.4em">${m.periodo === 'semanal' ? '★' : '📜'}</span><div><b>${m.titulo}</b><small>${m.periodo === 'semanal' ? 'Semanal' : 'Diária'}${m.coop ? ' · cooperativa' : ''} · Recompensa: ${m.ouro} ouro, ${m.xp} XP${ativa ? ` · Progresso ${prog}/${m.n}` : ''}</small>${ativa ? `<div class="progBarra"><i style="--v:${Math.round(prog / m.n * 100)}%"></i></div>` : ''}</div>
        ${ativa ? (m.tipo === 'coletar' ? `<button class="btn ${pronto ? 'ouro' : ''}" data-ent="${m.id}" ${pronto ? '' : 'disabled'}>Entregar</button>` : '<span></span>') : `<button class="btn" data-ac="${m.id}" ${e.ativas.length >= AM.missoes.MAX_ATIVAS ? 'disabled' : ''}>Aceitar</button>`}</div>`;
    };
    const el = caixa('Quadro de missões', `<h3>Suas missões (${e.ativas.length}/${AM.missoes.MAX_ATIVAS})</h3><div class="lista">${e.ativas.map(m => linhaM(m, true)).join('') || '<p>Nenhuma missão ativa. Aceite uma abaixo!</p>'}</div>
      <h3>Disponíveis</h3><div class="lista">${e.quadro.map(m => linhaM(m, false)).join('') || '<p>Você pegou tudo! Volte amanhã.</p>'}</div>`);
    el.querySelectorAll('[data-ac]').forEach(b => { b.onclick = () => { AM.missoes.aceitar(b.dataset.ac); redesenhar(); }; });
    el.querySelectorAll('[data-ent]').forEach(b => { b.onclick = () => { AM.missoes.entregar(b.dataset.ent); redesenhar(); }; });
  };

  // ---------- construção ----------
  P.construir = () => {
    const t = aba.constr || 'plantas';
    let corpo = abas([['plantas', 'Plantas prontas'], ['blocos', 'Bloco a bloco']], 'constr', 'plantas');
    if (t === 'plantas') {
      corpo += `<p>Escolha um modelo e o lugar: o jogo confere o terreno e a obra sobe sozinha. Seu ouro: <b>${AM.sis.ouro()}</b></p><div class="lista">${Object.entries(AM.PLANTAS).map(([id, p]) => {
        const pode = AM.sis.ouro() >= p.ouro && AM.inv.tem(p.custo);
        return `<div class="linha ${pode ? '' : 'indisponivel'}"><span style="font-family:monospace;font-size:.6em;line-height:1;white-space:pre">${p.planta.join('\n')}</span><div><b>${p.nome}</b> <small>${p.planta[0].length}×${p.planta.length} tiles · ${p.desc}</small><span class="ing"><span class="${AM.sis.ouro() < p.ouro ? 'falta' : ''}">● ${p.ouro} ouro</span></span>${ingHtml(p.custo)}</div><button class="btn" data-pl="${id}">Escolher lugar</button></div>`;
      }).join('')}</div>`;
    } else {
      const blocos = AM.jog.inv.map((it, i) => ({ it, i })).filter(({ it }) => it && (AM.ITENS[it.id].obj || AM.ITENS[it.id].piso != null));
      corpo += `<p>Construa do seu jeito, peça por peça: selecione um bloco ou móvel na hotbar e use num tile vazio. Para desmontar, use o machado (madeira) ou a picareta (pedra).</p>
        <h3>Seus blocos e móveis</h3>${blocos.length ? `<div class="grade">${blocos.map(({ it, i }) => `<button class="slot" data-bl="${i}" title="${AM.ITENS[it.id].nome}">${AM.ui.htmlSlot(it)}</button>`).join('')}</div>` : '<p>Você ainda não tem blocos. Crie alguns abaixo.</p>'}
        <h3>Criar blocos rapidinho</h3>${listaReceitas('mao').replace(/<p>.*<\/p>$/, '')}`;
    }
    const el = caixa('Construção', corpo);
    ligarAbas(el, 'constr');
    el.querySelectorAll('[data-pl]').forEach(b => { b.onclick = () => { AM.ui.fechar(); AM.construcao.iniciar(b.dataset.pl); }; });
    el.querySelectorAll('[data-bl]').forEach(b => { b.onclick = () => {
      const i = +b.dataset.bl, inv = AM.jog.inv;
      const k = AM.jog.sel < 0 ? 0 : AM.jog.sel;
      if (i >= 8) { [inv[k], inv[i]] = [inv[i], inv[k]]; AM.jog.sel = k; } else AM.jog.sel = i;
      AM.ui.atualizarHotbar(); AM.ui.fechar(); AM.ui.aviso('Bloco na mão! Use num tile vazio para colocar.');
    }; });
    ligarReceitas(el, 'mao');
  };

  // ---------- atributos ----------
  const ATRIB = [
    ['forca', 'Força', 'Mais dano com armas e chance de golpe duplo em árvores e pedras.'],
    ['velocidade', 'Velocidade', 'Anda e corre mais rápido.'],
    ['sorte', 'Sorte', 'Mais loot, mais críticos e mais peixes dourados.'],
    ['vitalidade', 'Vitalidade', '+8 de vida máxima e fome e sede caem mais devagar.'],
    ['agilidade', 'Agilidade', 'Ataca mais rápido, esquiva mais e fisga melhor.'],
    ['carisma', 'Carisma', 'Preços melhores, loja vende mais e domestica mais fácil.'],
  ];
  P.atributos = () => {
    const j = AM.jog;
    const el = caixa(`Atributos · nível ${j.nivel}`, `<p>Pontos para distribuir: <b>${j.pontos}</b> · XP ${j.xp}/${AM.sis.xpPara(j.nivel)}</p>
      <div class="atrib">${ATRIB.map(([k, n, d]) => `<div><b>${n}</b><small>${d}</small></div><b>${j.atrib[k]}</b><button class="btn" data-at="${k}" ${j.pontos ? '' : 'disabled'}>+1</button>`).join('')}</div>
      <p><small>Vida máxima ${j.vidaMax} · Velocidade ${Math.round(AM.atrib.velocidade() * 100)}% · Esquiva ${Math.round(AM.atrib.esquiva() * 100)}%${j.eco ? ' · Eco do Retorno pela Morte: Sorte -2 hoje' : ''}</small></p>`);
    el.querySelectorAll('[data-at]').forEach(b => { b.onclick = () => {
      if (!j.pontos) return;
      j.pontos--; j.atrib[b.dataset.at]++;
      if (b.dataset.at === 'vitalidade') { j.vidaMax = AM.atrib.vidaMax(); j.vida += 8; }
      AM.som('pop'); redesenhar();
    }; });
  };

  // ---------- mapa ----------
  P.mapa = () => {
    const M = AM.mapa, el = caixa(M.id === 'mundo' ? 'Mapa de Aethermoor' : 'Mapa da masmorra', `<canvas id="mapaGrande" width="${M.w}" height="${M.h}"></canvas>
      <div class="legenda">${M.id === 'mundo' ? `<span><i style="background:#ff4dd2"></i>Masmorras</span><span><i style="background:#b8473a"></i>Vila (centro)</span><span><i style="background:#ffd23f"></i>Sua fazenda</span><span><i style="background:#fff"></i>Você</span>` : '<span><i style="background:#fff"></i>Você</span><span><i style="background:#ff4040"></i>Chefe</span>'}</div>
      ${M.id === 'mundo' ? `<div class="lista">${AM.MASMORRAS.map(m => `<div class="linha"><span style="color:#ff4dd2">◆</span><div><b>${m.nome}</b><small>${AM.NOME_BIOMA[m.bioma]} · nível ${m.nivel} · chefe: ${AM.MOBS[m.chefe].nome}</small></div><span>${(AM.E.chefes || {})[m.id] ? '✔ derrotado' : ''}</span></div>`).join('')}</div>` : ''}`);
    const cv = el.querySelector('#mapaGrande'), x = cv.getContext('2d');
    for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) { x.fillStyle = AM.ui.corTile(tx, ty); x.fillRect(tx, ty, 1, 1); }
    if (M.id === 'mundo') {
      const f = M.fazenda; x.strokeStyle = '#ffd23f'; x.strokeRect(f.x + .5, f.y + .5, f.w, f.h);
      for (const e of Object.values(M.entradas)) { x.fillStyle = '#ff4dd2'; x.fillRect(e.x - 2, e.y - 2, 5, 5); }
    } else for (const e of AM.ents) if (e.classe === 'mob' && AM.MOBS[e.tipo].chefe) { x.fillStyle = '#ff4040'; x.fillRect(Math.floor(e.x / 16) - 1, Math.floor(e.y / 16) - 1, 3, 3); }
    x.fillStyle = '#fff'; x.fillRect(Math.floor(AM.jog.x / 16) - 2, Math.floor(AM.jog.y / 16) - 2, 5, 5);
    x.fillStyle = '#e8354a'; x.fillRect(Math.floor(AM.jog.x / 16) - 1, Math.floor(AM.jog.y / 16) - 1, 3, 3);
  };

  // ---------- cama e resumo do dia ----------
  P.dormir = d => {
    const el = caixa('Dormir', `<p>Dormir até amanhã? O jogo salva e esta cama vira seu ponto de retorno.${AM.tempo.minuto < 18 * 60 ? ' Ainda é cedo, mas tudo bem: descansar também é produtividade!' : ''}</p><div style="display:flex;gap:8px"><button class="btn ouro" id="sim">Dormir</button><button class="btn claro" data-fechar2>Agora não</button></div>`);
    el.querySelector('#sim').onclick = () => {
      AM.ui.fechar();
      if (AM.rede.conectado()) { AM.jog.checkpoint = { mapa: 'mundo', x: d.x * 16 + 8, y: d.y * 16 + 28 }; AM.jog.vida = AM.jog.vidaMax; AM.rede.dormir(); AM.ui.aviso('Você deitou. O dia passa quando todos da sala dormirem.'); return; }
      AM.jogo.transicao(() => AM.sis.dormir(d));
    };
    el.querySelector('[data-fechar2]').onclick = () => AM.ui.fechar();
  };
  P.resumo = d => {
    const t = AM.tempo;
    const el = caixa(`${AM.ICONE_ESTACAO[t.estacao]} ${AM.ESTACOES[t.estacao]}, dia ${t.diaEstacao}`, `<div class="resumo"><p>${d.dormiu ? 'Bom dia! O jogo foi salvo.' : 'Um novo dia começou.'} Clima de hoje: <b>${{ sol: 'ensolarado', chuva: 'chuva (as plantas se regam sozinhas)', neve: 'neve' }[t.clima]}</b>.</p>${d.linhas.length ? `<ul>${d.linhas.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}</div><button class="btn ouro" data-fechar2>Bora!</button>`, '30em');
    el.querySelector('[data-fechar2]').onclick = () => AM.ui.fechar();
  };

  // ---------- conversa com o Doidobot (chat) ----------
  P.conversa = (d, re) => {
    const h = AM.bot.historico().slice(-14);
    const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const status = AM.ia.ativo ? `<small class="iaOn">● IA ligada (${{ ollama: 'DeepSeek no seu PC', deepseek: 'DeepSeek', claude: 'Claude', gemini: 'Gemini' }[AM.ia.provedor] || AM.ia.provedor}): ele entende e responde de verdade</small>` : '<small>Modo clássico: ele responde por palavras-chave. Para ele entender de verdade, rode o servidor do jogo com o DeepSeek (veja o README).</small>';
    const valor = re ? (document.querySelector('#campoBot') || {}).value || '' : '';
    const el = caixa('Conversar com o Doidobot', `${status}
      <div class="chatBot" id="chatBot">${h.length ? h.map(m => `<p class="msg ${m.papel}">${esc(m.texto)}</p>`).join('') : '<p class="msg doidobot">Oi! Pode falar qualquer coisa. Eu escuto só de um lado, mas presto atenção em dobro!</p>'}${AM.bot.esperando ? '<p class="msg doidobot pensando">digitando…</p>' : ''}</div>
      <form id="formBot" class="formBot"><label for="campoBot" class="so-leitor">Mensagem</label><input id="campoBot" type="text" maxlength="300" autocomplete="off" placeholder="Escreva para o Doidobot" enterkeyhint="send"><button class="btn">Enviar</button></form>
      <div class="sugestoes">${['Me dá uma dica', 'Qual o foco de hoje?', 'Conta uma curiosidade', 'Vira humano!', 'Foi mais fácil fazer o jogo do que fazer você entender'].map(t => `<button class="btn claro" data-t="${t}">${t}</button>`).join('')}</div>`, '36em');
    const campo = el.querySelector('#campoBot');
    campo.value = valor;
    const log = el.querySelector('#chatBot'); log.scrollTop = log.scrollHeight;
    const enviar = t => { if (!t.trim()) return; campo.value = ''; AM.bot.conversar(t); redesenhar(); };
    el.querySelector('#formBot').onsubmit = e => { e.preventDefault(); enviar(campo.value); };
    el.querySelectorAll('[data-t]').forEach(b => { b.onclick = () => enviar(b.dataset.t); });
    if (!AM.toqueAtivo || !re) setTimeout(() => campo.focus({ preventScroll: true }), 50);
  };

  // ---------- opções ----------
  P.opcoes = () => {
    const o = AM.opc, t = aba.opc || 'jogo';
    const sel = (id, valor, ops) => `<select id="${id}">${ops.map(([v, r]) => `<option value="${v}" ${String(valor) === String(v) ? 'selected' : ''}>${r}</option>`).join('')}</select>`;
    const chk = (id, v) => `<input type="checkbox" id="${id}" ${v ? 'checked' : ''}>`;
    let corpo = abas([['jogo', 'Jogo'], ['acess', 'Acessibilidade'], ['teclas', 'Teclas'], ['multi', 'Multijogador']], 'opc', 'jogo');
    if (t === 'jogo') corpo += `<div class="opcoes">
      <div class="op"><span>Velocidade do jogo<small>Quanto o relógio e o mundo andam</small></span>${sel('oVel', o.velocidade, [[.5, 'Bem devagar (0,5×)'], [.75, 'Devagar (0,75×)'], [1, 'Normal'], [1.25, 'Rápido (1,25×)']])}</div>
      <div class="op"><span>Doidobot fala<small>Com que frequência ele aparece sozinho</small></span>${sel('oFreq', o.freqDoidobot, [['sempre', 'Sempre (emocionado)'], ['normal', 'Normal'], ['pouco', 'Só no importante'], ['chamado', 'Só quando eu chamar (H)']])}</div>
      <div class="op"><span>Som</span>${chk('oSom', o.som)}</div>
      <div class="op"><span>Música</span>${chk('oMus', o.musica)}</div>
      <div class="op"><span>Tutorial</span><button class="btn claro" id="oTut">Refazer o tutorial</button></div>
      <div class="op"><span>Jogo salvo<small>O jogo também salva sozinho ao dormir e a cada poucos minutos</small></span><button class="btn" id="oSalvar">Salvar agora</button></div>
      <div class="op"><span>Voltar à tela de título</span><button class="btn claro" id="oSair">Sair</button></div></div>`;
    if (t === 'acess') corpo += `<div class="opcoes">
      <div class="op"><span>Modo Lerdo<small>Textos ficam até você fechar, mundo mais devagar, avisos mais longos</small></span>${chk('oLerdo', o.lerdo)}</div>
      <div class="op"><span>Modo Sem Pressa<small>O jogo pausa enquanto um menu está aberto</small></span>${chk('oPressa', o.semPressa)}</div>
      <div class="op"><span>Destaque no tile alvo<small>Mostra onde a ferramenta vai agir</small></span>${chk('oDest', o.destaques !== false)}</div>
      <div class="op"><span>Modo daltônico<small>Troca as cores das barras por cores mais distintas</small></span>${chk('oDalt', o.daltonico)}</div>
      <div class="op"><span>Tamanho do texto</span>${sel('oEsc', o.escalaTexto, [[.85, 'Pequeno'], [1, 'Normal'], [1.2, 'Grande'], [1.4, 'Bem grande']])}</div>
      <div class="op"><span>Zoom do mundo<small>Perto deixa tudo maior (bom no celular)</small></span>${sel('oZoom', o.zoom || 'normal', [['perto', 'Perto'], ['normal', 'Normal'], ['longe', 'Longe']])}</div></div>`;
    if (t === 'teclas') corpo += `<p>Clique numa ação e aperte a nova tecla.</p><div class="teclas">${Object.keys(AM.NOMES_ACOES).map(a => `<span>${AM.NOMES_ACOES[a]}</span><button data-tecla="${a}">${AM.input.nomeTecla(AM.input.tecla(a))}</button>`).join('')}</div><button class="btn claro" id="oTeclasPadrao">Voltar ao padrão</button>`;
    if (t === 'multi') corpo += AM.rede ? AM.rede.painelHtml() : '<p>Multijogador indisponível.</p>';
    const el = caixa('Opções', corpo);
    ligarAbas(el, 'opc');
    const salvar = () => { AM.salvarOpcoes(); AM.jogo.aplicarOpcoes(); };
    const on = (id, fn) => { const e = el.querySelector('#' + id); if (e) e.onchange = () => { fn(e); salvar(); }; };
    on('oVel', e => { o.velocidade = +e.value; }); on('oFreq', e => { o.freqDoidobot = e.value; });
    on('oSom', e => { o.som = e.checked; }); on('oMus', e => { o.musica = e.checked; });
    on('oLerdo', e => { o.lerdo = e.checked; if (o.lerdo) AM.bot.falarDe('lerdo', true); });
    on('oPressa', e => { o.semPressa = e.checked; }); on('oDest', e => { o.destaques = e.checked; });
    on('oDalt', e => { o.daltonico = e.checked; }); on('oEsc', e => { o.escalaTexto = +e.value; });
    on('oZoom', e => { o.zoom = e.value; AM.render.ajustar(); });
    const b = id => el.querySelector('#' + id);
    if (b('oTut')) b('oTut').onclick = () => { AM.ui.fechar(); AM.tutorial.refazer(); };
    if (b('oSalvar')) b('oSalvar').onclick = () => { AM.jogo.salvar(); AM.ui.aviso('Jogo salvo!'); };
    if (b('oSair')) b('oSair').onclick = () => { AM.jogo.salvar(); location.reload(); };
    el.querySelectorAll('[data-tecla]').forEach(bt => { bt.onclick = () => {
      bt.classList.add('esperando'); bt.textContent = 'Aperte...';
      AM.input.ligar(true);
      AM.input.capturando = code => { o.teclas = Object.assign({}, o.teclas, { [bt.dataset.tecla]: [code] }); AM.input.ligar(false); salvar(); redesenhar(); };
    }; });
    if (b('oTeclasPadrao')) b('oTeclasPadrao').onclick = () => { o.teclas = null; salvar(); redesenhar(); };
    if (t === 'multi' && AM.rede) AM.rede.ligarPainel(el);
  };

  // abrir registra o painel atual
  const api = {};
  for (const k of Object.keys(P)) api[k] = d => { atual = k; dadosAtual = d; P[k](d); };
  api.redesenhar = redesenhar;
  api.definirAba = (chave, valor) => { aba[chave] = valor; };
  api.aoFechar = () => { atual = null; dadosAtual = null; };
  return api;
})();
