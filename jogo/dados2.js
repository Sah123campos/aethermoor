// Mais dados: receitas, plantas prontas, criaturas, animais, lojas, masmorras e
// as falas do Doidobot.
'use strict';

// ---------- receitas ----------
// em: mao (qualquer lugar), bancada, fogo (fogueira/fogão/forno), fogao (fogão/forno), forno
AM.RECEITAS = [
  { res: 'bancada', ing: { madeira: 10 }, em: 'mao' },
  { res: 'fogueira', ing: { madeira: 5, pedra: 3 }, em: 'mao' },
  { res: 'tocha', qtd: 2, ing: { madeira: 1, fibra: 1 }, em: 'mao' },
  { res: 'parede_madeira', qtd: 2, ing: { madeira: 2 }, em: 'mao' },
  { res: 'piso_madeira', qtd: 2, ing: { madeira: 1 }, em: 'mao' },
  { res: 'porta', ing: { madeira: 4 }, em: 'mao' },
  { res: 'cerca', qtd: 2, ing: { madeira: 2 }, em: 'mao' },
  { res: 'caminho', qtd: 4, ing: { pedra: 1 }, em: 'mao' },
  { res: 'bau', ing: { madeira: 12 }, em: 'mao' },
  { res: 'parede_pedra', qtd: 2, ing: { pedra: 3 }, em: 'bancada' },
  { res: 'piso_pedra', qtd: 2, ing: { pedra: 1 }, em: 'bancada' },
  { res: 'portao', ing: { madeira: 4 }, em: 'bancada' },
  { res: 'janela', ing: { madeira: 2, vidro: 1 }, em: 'bancada' },
  { res: 'piso_estufa', qtd: 2, ing: { pedra: 1, fibra: 2, vidro: 1 }, em: 'bancada' },
  { res: 'cama', ing: { madeira: 10, fibra: 10 }, em: 'bancada' },
  { res: 'cocho', ing: { madeira: 8 }, em: 'bancada' },
  { res: 'palha', qtd: 2, ing: { feno: 3 }, em: 'bancada' },
  { res: 'colmeia', ing: { madeira: 12, flor: 3 }, em: 'bancada' },
  { res: 'caixa_venda', ing: { madeira: 15 }, em: 'bancada' },
  { res: 'espantalho', ing: { madeira: 5, fibra: 10, feno: 2 }, em: 'bancada' },
  { res: 'mesa', ing: { madeira: 6 }, em: 'bancada' },
  { res: 'cadeira', ing: { madeira: 4 }, em: 'bancada' },
  { res: 'vaso', ing: { pedra: 3, flor: 2 }, em: 'bancada' },
  { res: 'balcao', ing: { madeira: 12, barra_ferro: 1 }, em: 'bancada' },
  { res: 'forno', ing: { pedra: 25, minerio_ferro: 2 }, em: 'bancada' },
  { res: 'fogao', ing: { pedra: 15, barra_ferro: 2 }, em: 'bancada' },
  { res: 'aquecedor', ing: { barra_ferro: 3, carvao: 5 }, em: 'bancada' },
  { res: 'arco', ing: { madeira: 8, fibra: 6 }, em: 'bancada' },
  { res: 'flecha', qtd: 5, ing: { madeira: 1, pedra: 1 }, em: 'bancada' },
  { res: 'espada_ferro', ing: { barra_ferro: 4, madeira: 2 }, em: 'bancada' },
  { res: 'espada_cristal', ing: { cristal: 5, barra_ouro: 2 }, em: 'bancada' },
  { res: 'vara', ing: { madeira: 6, fibra: 8 }, em: 'bancada' },
  { res: 'cantil', ing: { couro: 2 }, em: 'bancada' },
  { res: 'tecido', ing: { la: 2 }, em: 'bancada' },
  { res: 'faixa_ninja', ing: { tecido: 1, barra_ferro: 1 }, em: 'bancada' },
  { res: 'pocao', ing: { flor: 2, mel: 1, cogumelo: 1 }, em: 'bancada' },
  { res: 'carrinho', ing: { madeira: 30, barra_ferro: 4 }, em: 'bancada' },
  { res: 'balao', ing: { tecido: 6, madeira: 20, barra_ferro: 4, fibra: 20 }, em: 'bancada' },
  { res: 'retorno_morte', ing: { cristal_inveja: 1, barra_ouro: 1 }, em: 'bancada' },
  { res: 'sopa_abobora', ing: { abobora: 1, leite: 1 }, em: 'fogao' },
  { res: 'couve_refogada', ing: { couve: 1 }, em: 'fogao' },
  { res: 'pao', ing: { trigo: 3 }, em: 'forno' },
  { res: 'torta_morango', ing: { morango: 3, trigo: 2, ovo: 1 }, em: 'forno' },
  { res: 'carvao', ing: { madeira: 3 }, em: 'forno' },
  { res: 'barra_ferro', ing: { minerio_ferro: 2, carvao: 1 }, em: 'forno' },
  { res: 'barra_ouro', ing: { minerio_ouro: 2, carvao: 1 }, em: 'forno' },
  { res: 'vidro', ing: { pedra: 2, carvao: 1 }, em: 'forno' },
];
// esquentar/cozinhar: todo alimento cru com "cozinha" vira receita de fogo
for (const it of Object.values(AM.ITENS)) {
  if (it.cozinha && !AM.RECEITAS.some(r => r.res === it.cozinha && r.ing[it.id]))
    AM.RECEITAS.push({ res: it.cozinha, ing: { [it.id]: 1 }, em: it.cozinha === 'couve_refogada' ? 'fogao' : 'fogo' });
}
// o que cada estação de trabalho consegue fazer
AM.ESTACOES_TRABALHO = { mao: ['mao'], bancada: ['mao', 'bancada'], fogo: ['fogo'], fogao: ['fogo', 'fogao'], forno: ['fogo', 'fogao', 'forno'] };
AM.NOME_ESTACAO = { mao: 'À mão', bancada: 'Bancada', fogo: 'Fogueira', fogao: 'Fogão', forno: 'Forno' };

// ---------- plantas prontas ----------
// W madeira, S pedra, V vidro, J janela, D porta, b cama, c cocho, h palha, k bancada, o forno,
// f fogão, t tocha, x baú, l balcão, '.' só piso
AM.PLANTAS = {
  casa: { nome: 'Casa pequena', ouro: 200, custo: { madeira: 40, pedra: 20 }, piso: AM.CH.P_MADEIRA,
    planta: ['WWJJWW', 'Wb..xW', 'W....W', 'W..t.W', 'WWDWWW'], desc: 'Uma casa com cama e baú. A cama vira seu ponto de retorno.' },
  galinheiro: { nome: 'Galinheiro', ouro: 150, custo: { madeira: 30 }, piso: AM.CH.P_MADEIRA, abrigo: 'galinheiro', cap: 4,
    planta: ['WWWWW', 'Wc.hW', 'W...W', 'WWDWW'], desc: 'Abrigo para até 4 galinhas.' },
  celeiro: { nome: 'Celeiro', ouro: 400, custo: { madeira: 60, pedra: 30 }, piso: AM.CH.P_MADEIRA, abrigo: 'celeiro', cap: 6,
    planta: ['WWWJWWW', 'Wc...hW', 'W.....W', 'W.....W', 'W.....W', 'WWWDWWW'], desc: 'Abrigo para até 6 vacas, ovelhas ou cavalos.' },
  estufa: { nome: 'Estufa', ouro: 600, custo: { madeira: 20, vidro: 12, barra_ferro: 4 }, piso: AM.CH.P_ESTUFA,
    planta: ['VVVVVV', 'V....V', 'V....V', 'V....V', 'V....V', 'VVDVVV'], desc: 'Plantas aqui dentro crescem em qualquer estação.' },
  loja: { nome: 'Loja', ouro: 500, custo: { madeira: 50, pedra: 20 }, piso: AM.CH.P_MADEIRA,
    planta: ['WWJJWW', 'W.l..W', 'W....W', 'W.t.xW', 'WWDWWW'], desc: 'Sua própria loja: ponha itens no balcão e clientes compram.' },
  oficina: { nome: 'Oficina', ouro: 300, custo: { madeira: 30, pedra: 40 }, piso: AM.CH.P_PEDRA,
    planta: ['SSSSS', 'Sk.oS', 'S...S', 'S.t.S', 'SSDSS'], desc: 'Bancada e forno prontos para usar.' },
};
AM.LEGENDA_PLANTA = { W: 'parede_madeira', S: 'parede_pedra', V: 'vidro', J: 'janela', D: 'porta', b: 'cama', c: 'cocho', h: 'palha',
  k: 'bancada', o: 'forno', f: 'fogao', t: 'tocha', x: 'bau', l: 'balcao' };

// ---------- criaturas ----------
// ia: pula (slime), persegue, atira, voa; hora: dia, noite ou qualquer
AM.MOBS = {
  slime:        { nome: 'Slime', vida: 12, dano: 4, vel: 26, xp: 5, ouro: [1, 4], loot: [['gosma', .7]], ia: 'pula', cor: '#6cd36c', hora: 'qualquer' },
  slime_azul:   { nome: 'Slime do pântano', vida: 18, dano: 5, vel: 28, xp: 7, ouro: [2, 6], loot: [['gosma', .8], ['cogumelo', .2]], ia: 'pula', cor: '#5a9ad6', hora: 'qualquer' },
  slime_gelo:   { nome: 'Slime de gelo', vida: 22, dano: 6, vel: 24, xp: 9, ouro: [3, 8], loot: [['gosma', .8], ['cristal', .05]], ia: 'pula', cor: '#bfe8ff', hora: 'qualquer' },
  goblin:       { nome: 'Goblin', vida: 24, dano: 6, vel: 42, xp: 10, ouro: [4, 12], loot: [['couro', .3], ['madeira', .3]], ia: 'persegue', cor: '#7ab04a', hora: 'qualquer' },
  esqueleto:    { nome: 'Esqueleto', vida: 20, dano: 5, vel: 30, xp: 12, ouro: [3, 9], loot: [['osso', .7], ['flecha', .3]], ia: 'atira', cor: '#e8e4d8', hora: 'noite' },
  lobo_selvagem:{ nome: 'Lobo selvagem', vida: 22, dano: 6, vel: 56, xp: 12, ouro: [0, 3], loot: [['carne_crua', .7], ['couro', .4]], ia: 'persegue', cor: '#8a8a96', hora: 'noite', domar: 'carne_crua' },
  escorpiao:    { nome: 'Escorpião', vida: 26, dano: 7, vel: 34, xp: 13, ouro: [4, 10], loot: [['osso', .3]], ia: 'persegue', cor: '#c9853a', hora: 'qualquer' },
  morcego:      { nome: 'Morcego', vida: 10, dano: 3, vel: 58, xp: 6, ouro: [1, 3], loot: [['couro', .15]], ia: 'voa', cor: '#5a4a6a', hora: 'qualquer' },
  fantasma:     { nome: 'Fantasma', vida: 16, dano: 6, vel: 30, xp: 14, ouro: [5, 12], loot: [['tecido', .05]], ia: 'voa', cor: '#d8e4ff', hora: 'noite' },
  // chefes
  slime_rei:    { nome: 'Slime Rei', vida: 160, dano: 9, vel: 22, xp: 120, ouro: [120, 180], loot: [['gosma', 1], ['barra_ouro', 1]], ia: 'pula', cor: '#4ac04a', chefe: true, tam: 2.4, divide: 'slime' },
  rei_esqueleto:{ nome: 'Rei Esqueleto', vida: 220, dano: 10, vel: 26, xp: 180, ouro: [180, 260], loot: [['cristal_inveja', 1], ['barra_ouro', 1]], ia: 'atira', cor: '#f0ead8', chefe: true, tam: 1.8, invoca: 'esqueleto', leque: true },
  golem:        { nome: 'Golem de Cristal', vida: 300, dano: 14, vel: 20, xp: 240, ouro: [220, 320], loot: [['cristal', 1, 5], ['barra_ouro', 1]], ia: 'investida', cor: '#8ff0ff', chefe: true, tam: 2.2 },
  escorpiao_rei:{ nome: 'Escorpião Imperador', vida: 260, dano: 12, vel: 32, xp: 220, ouro: [200, 300], loot: [['barra_ouro', 2]], ia: 'investida', cor: '#e0a040', chefe: true, tam: 2 },
  lobo_alfa:    { nome: 'Lobo Alfa de Gelo', vida: 240, dano: 12, vel: 48, xp: 220, ouro: [200, 280], loot: [['couro', 4], ['cristal', 1, 2]], ia: 'persegue', cor: '#cfe6ff', chefe: true, tam: 1.9, invoca: 'lobo_selvagem' },
};
// onde cada criatura aparece no mundo
AM.MOBS_BIOMA = {
  planicie: ['slime', 'slime', 'goblin', 'esqueleto'], floresta: ['goblin', 'slime', 'esqueleto', 'lobo_selvagem'],
  pantano: ['slime_azul', 'fantasma', 'esqueleto'], deserto: ['escorpiao', 'esqueleto'], tundra: ['lobo_selvagem', 'slime_gelo', 'esqueleto'],
  montanha: ['morcego', 'esqueleto', 'goblin'],
};

// ---------- animais ----------
AM.ANIMAIS = {
  galinha: { nome: 'Galinha', preco: 300, abrigo: 'galinheiro', produto: 'ovo', cada: 1, vel: 16, comida: 'feno' },
  vaca:    { nome: 'Vaca', preco: 900, abrigo: 'celeiro', produto: 'leite', cada: 1, vel: 10, comida: 'feno' },
  ovelha:  { nome: 'Ovelha', preco: 750, abrigo: 'celeiro', produto: 'la', cada: 2, vel: 12, comida: 'feno' },
  cavalo:  { nome: 'Cavalo', preco: 1300, abrigo: 'celeiro', produto: null, vel: 26, comida: 'feno', desc: 'Puxa o carrinho: ele fica 30% mais rápido.' },
  gato:    { nome: 'Gato', pet: true, domar: 'peixe', vel: 34, desc: 'Segue você e espanta o tédio.' },
  lobo:    { nome: 'Lobo', pet: true, domar: 'carne_crua', vel: 56, luta: true, desc: 'Segue você e ataca criaturas.' },
};

// ---------- lojas da vila ----------
AM.LOJAS = {
  mercado:     { nome: 'Mercado do Bento', npc: 'Bento', compra: ['colheita', 'comida', 'bebida', 'semente'],
    vende: est => [...Object.keys(AM.CULTURAS).filter(c => AM.CULTURAS[c].estacoes.includes(est)).map(c => 'semente_' + c), 'pao', 'feno', 'cantil', 'vara', 'semente_arvore'] },
  ferreiro:    { nome: 'Forja da Brasa', npc: 'Brasa', compra: ['material', 'arma', 'municao'],
    vende: () => ['espada_ferro', 'arco', 'flecha', 'barra_ferro', 'carvao', 'vidro', 'faixa_ninja'] },
  carpintaria: { nome: 'Carpintaria do Tião', npc: 'Tião', compra: ['material', 'bloco', 'movel'],
    vende: () => ['madeira', 'pedra', 'bancada', 'bau', 'cama', 'forno', 'fogao', 'aquecedor', 'colmeia', 'balcao', 'caixa_venda', 'piso_estufa', 'carrinho', 'balao'] },
  estabulo:    { nome: 'Estábulo da Dona Cida', npc: 'Cida', compra: ['colheita'],
    vende: () => ['animal:galinha', 'animal:vaca', 'animal:ovelha', 'animal:cavalo', 'feno', 'palha', 'cocho'] },
  guilda:      { nome: 'Guilda de Aventureiros', npc: 'Iara', compra: ['material'], vende: () => ['pocao', 'flecha', 'espada_madeira'] },
};
AM.precoCompra = (id, carisma = 0) => {
  const base = id.startsWith('animal:') ? AM.ANIMAIS[id.slice(7)].preco : (AM.ITENS[id].compra || Math.max(4, Math.ceil(AM.ITENS[id].preco * 2.2)));
  return Math.max(1, Math.round(base * (1 - Math.min(.3, carisma * .02))));
};
AM.precoVenda = (id, carisma = 0) => Math.round((AM.ITENS[id]?.preco || 0) * (1 + Math.min(.4, carisma * .03)));

// ---------- masmorras ----------
AM.MASMORRAS = [
  { id: 'slimes', nome: 'Caverna dos Slimes', bioma: 'planicie', chefe: 'slime_rei', mobs: ['slime', 'slime_azul', 'morcego'], chao: '#5e4c3c', parede: '#3a2e24', nivel: 1 },
  { id: 'cripta', nome: 'Cripta Esquecida', bioma: 'pantano', chefe: 'rei_esqueleto', mobs: ['esqueleto', 'morcego', 'fantasma'], chao: '#4a4a56', parede: '#2a2a36', nivel: 2 },
  { id: 'mina', nome: 'Mina de Cristal', bioma: 'montanha', chefe: 'golem', mobs: ['morcego', 'goblin', 'slime_gelo'], chao: '#4c4c5c', parede: '#30304a', nivel: 3, minerios: true },
  { id: 'templo', nome: 'Templo das Areias', bioma: 'deserto', chefe: 'escorpiao_rei', mobs: ['escorpiao', 'esqueleto', 'morcego'], chao: '#b8955a', parede: '#7a5a32', nivel: 3 },
  { id: 'gruta', nome: 'Gruta Gélida', bioma: 'tundra', chefe: 'lobo_alfa', mobs: ['lobo_selvagem', 'slime_gelo', 'morcego'], chao: '#9ab8d0', parede: '#5a7a9a', nivel: 4 },
];
