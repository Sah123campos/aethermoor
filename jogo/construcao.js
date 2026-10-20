// Construção com plantas prontas: escolher o modelo, validar o terreno,
// pagar e ver a obra subir sozinha, tile por tile. Também cuida dos abrigos
// (comida no cocho, calor no inverno, capacidade) e da compra de animais.
'use strict';

AM.construcao = (() => {
  let modo = null;      // { planta, x, y, ok, motivo } enquanto escolhe o lugar
  const obras = [];     // construções subindo

  const porId = id => AM.E.construcoes.find(c => c.id === id);
  // área interna em pixels (sem as paredes)
  function area(id) {
    const c = typeof id === 'object' ? id : porId(id);
    if (!c) return null;
    return { x0: (c.x + 1) * 16, x1: (c.x + c.w - 1) * 16, y0: (c.y + 1) * 16, y1: (c.y + c.h - 1) * 16 };
  }
  function tilesDe(c, fn) { for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) fn(x, y); }

  // ---------- escolher o lugar ----------
  function iniciar(plantaId) {
    if (AM.mapa.id !== 'mundo') { AM.ui.aviso('Só dá para construir na superfície.'); return; }
    modo = { planta: plantaId, x: 0, y: 0, ok: false, fixo: null };
    AM.ui.aviso(AM.toqueAtivo ? 'Toque onde quer construir e depois em "Construir aqui".' : 'Escolha o lugar. Usar/clique confirma, Esc cancela.');
  }
  // no celular o lugar fica onde você tocou
  function fixar(tx, ty) { if (modo) modo.fixo = { x: tx, y: ty }; }
  const cancelar = () => { modo = null; };
  const ativo = () => modo;

  function validar(p, x0, y0) {
    const pl = AM.PLANTAS[p], h = pl.planta.length, w = pl.planta[0].length;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (!AM.m.dentro(x, y)) return 'Fora do mapa.';
      if (AM.ehAgua(AM.m.ch(x, y))) return 'Tem água no caminho.';
      if (AM.naVila(x, y)) return 'Não dá para construir dentro da vila.';
      const ob = AM.OBJ[AM.m.ob(x, y)];
      if (ob && ob.id && !['flor', 'capim', 'junco', 'cogumelo'].includes(ob.chave)) return `Tem ${ob.nome.toLowerCase()} no caminho.`;
      if (AM.m.planta(x, y)) return 'Tem plantação no caminho.';
      if (AM.criaturas.ocupado(x, y)) return 'Tem alguém no caminho.';
      if (AM.E.construcoes.some(c => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h)) return 'Já tem uma construção aqui.';
    }
    const jx = Math.floor(AM.jog.x / 16), jy = Math.floor((AM.jog.y - 4) / 16);
    if (jx >= x0 && jx < x0 + w && jy >= y0 && jy < y0 + h) return 'Saia de dentro da área.';
    return null;
  }

  function atualizarModo() {
    if (!modo) return;
    const pl = AM.PLANTAS[modo.planta], w = pl.planta[0].length, h = pl.planta.length;
    const ms = AM.input.mouse;
    let cx, cy;
    if (modo.fixo) { cx = modo.fixo.x; cy = modo.fixo.y; }
    else if (ms.dentro && !AM.toqueAtivo) { cx = Math.floor(ms.mundoX / 16); cy = Math.floor(ms.mundoY / 16); }
    else { const a = AM.alvo(); cx = a.x; cy = a.y + (AM.jog.dir === 'cima' ? -Math.floor(h / 2) : AM.jog.dir === 'baixo' ? Math.floor(h / 2) : 0); }
    modo.x = cx - Math.floor(w / 2); modo.y = cy - Math.floor(h / 2);
    modo.motivo = validar(modo.planta, modo.x, modo.y);
    modo.ok = !modo.motivo;
  }

  function confirmar() {
    if (!modo) return;
    const p = modo.planta, pl = AM.PLANTAS[p];
    if (!modo.ok) { AM.ui.aviso(modo.motivo); AM.som('erro'); return; }
    if (AM.sis.ouro() < pl.ouro) { AM.ui.aviso(`Faltam ${pl.ouro - AM.sis.ouro()} de ouro.`); AM.som('erro'); return; }
    if (!AM.inv.tem(pl.custo)) {
      const falta = Object.entries(pl.custo).filter(([id, q]) => AM.inv.contar(id) < q).map(([id, q]) => `${q - AM.inv.contar(id)} ${AM.ITENS[id].nome.toLowerCase()}`);
      AM.ui.aviso('Faltam: ' + falta.join(', ') + '.'); AM.som('erro'); return;
    }
    AM.sis.gastarOuro(pl.ouro); AM.inv.gastar(pl.custo);
    const c = { id: Date.now() % 1e9 + Math.floor(Math.random() * 1000), planta: p, x: modo.x, y: modo.y, w: pl.planta[0].length, h: pl.planta.length, dono: AM.jog.nome, privada: false };
    AM.E.construcoes.push(c);
    // a obra sobe tile por tile, do chão para cima
    const fila = [];
    pl.planta.forEach((linha, dy) => [...linha].forEach((ch, dx) => fila.push({ x: c.x + dx, y: c.y + dy, ch })));
    obras.push({ c, fila, t: 0 });
    modo = null;
    AM.som('colocar');
    AM.ui.aviso(`Construindo: ${pl.nome}!`);
  }

  function atualizar(dt) {
    atualizarModo();
    for (const o of [...obras]) {
      o.t += dt;
      while (o.t > .05 && o.fila.length) {
        o.t -= .05;
        const { x, y, ch } = o.fila.shift(), pl = AM.PLANTAS[o.c.planta];
        AM.m.setOb(x, y, 0, null);
        AM.m.setCh(x, y, pl.piso);
        const nome = AM.LEGENDA_PLANTA[ch];
        if (nome) {
          const id = AM.OB[nome.toUpperCase()];
          AM.m.setOb(x, y, id, nome === 'bau' || nome === 'balcao' ? { itens: [] } : undefined);
        }
        AM.fx.fumaca(x * 16 + 8, y * 16 + 8, 2);
        if (o.fila.length % 4 === 0) AM.som('martelo');
      }
      if (!o.fila.length) {
        obras.splice(obras.indexOf(o), 1);
        AM.sis.ganharXP(25, 'construcao');
        AM.som('nivel');
        AM.bot.falarDe('construiu');
        AM.ev.emit('construiu', { planta: o.c.planta });
        AM.rede && AM.rede.construcao(o.c);
      }
    }
  }

  // ---------- abrigos ----------
  function objetosDe(c, filtro) {
    const achados = [];
    tilesDe(c, (x, y) => { const id = AM.mundo.obj[y * AM.mundo.w + x], ob = AM.OBJ[id]; if (ob && filtro(ob)) achados.push({ x, y, ob }); });
    return achados;
  }
  function alimentar(c) {
    for (const { x, y } of objetosDe(c, ob => ob.cocho)) {
      const i = y * AM.mundo.w + x, info = AM.mundo.info.get(i);
      if (info && info.feno > 0) { info.feno--; return true; }
    }
    return false;
  }
  function aquecida(c) {
    const fontes = objetosDe(c, ob => ob.calor);
    return fontes.some(f => f.ob.chave !== 'palha') || fontes.filter(f => f.ob.chave === 'palha').length >= 2;
  }
  function vagas(c) { return (AM.PLANTAS[c.planta].cap || 0) - AM.E.animais.filter(a => a.casa === c.id).length; }

  function comprarAnimal(tipo) {
    const def = AM.ANIMAIS[tipo];
    const casa = AM.E.construcoes.find(c => AM.PLANTAS[c.planta].abrigo === def.abrigo && vagas(c) > 0);
    if (!casa) { AM.ui.aviso(`Você precisa de um ${AM.PLANTAS[def.abrigo].nome.toLowerCase()} com vaga. Construa pelo menu B.`); AM.som('erro'); return false; }
    const preco = AM.precoCompra('animal:' + tipo, AM.jog.atrib.carisma);
    if (!AM.sis.gastarOuro(preco)) { AM.ui.aviso('Ouro insuficiente.'); AM.som('erro'); return false; }
    const ar = area(casa);
    const nomes = { galinha: ['Pipoca', 'Cocó', 'Penélope', 'Galinhola'], vaca: ['Mimosa', 'Malhada', 'Estrela'], ovelha: ['Nuvem', 'Algodão', 'Fofinha'], cavalo: ['Relâmpago', 'Trovão', 'Pé de Pano'] }[tipo];
    const a = { classe: 'animal', id: AM.criaturas.novoId(), tipo, nome: AM.u.escolha(nomes), x: (ar.x0 + ar.x1) / 2, y: (ar.y0 + ar.y1) / 2 + 4, dir: 1, casa: casa.id, felicidade: 70, comeu: true, diasProd: 0, pronto: false };
    AM.E.animais.push(a);
    if (AM.mapa.id === 'mundo') AM.ents.push(a);
    AM.som('moeda'); AM.ui.aviso(`${a.nome} (${def.nome.toLowerCase()}) chegou ao seu ${AM.PLANTAS[casa.planta].nome.toLowerCase()}!`, 'ouro');
    AM.ev.emit('novoAnimal', { tipo });
    return true;
  }
  const temCavalo = () => AM.E.animais.some(a => a.tipo === 'cavalo');
  function verificarRuina() { /* as construções continuam registradas mesmo com paredes quebradas */ }

  return { iniciar, fixar, cancelar, ativo, confirmar, atualizar, validar, porId, area, alimentar, aquecida, vagas, comprarAnimal, temCavalo, verificarRuina, obras };
})();
