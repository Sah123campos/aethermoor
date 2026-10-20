// Dados do mundo: terrenos, objetos, itens, plantações, receitas e plantas prontas.
'use strict';

AM.ESTACOES = ['Primavera', 'Verão', 'Outono', 'Inverno'];
AM.ICONE_ESTACAO = ['✿', '☀', '❦', '❄'];
AM.DIAS_ESTACAO = 7;

// ---------- terrenos (chão) ----------
AM.CH = { GRAMA: 0, TERRA: 1, ARADA: 2, MOLHADA: 3, AREIA: 4, NEVE: 5, AGUA: 6, FUNDA: 7, PEDRA: 8, LAMA: 9, CAMINHO: 10,
  P_MADEIRA: 11, P_PEDRA: 12, P_ESTUFA: 13, PONTE: 14, GELO: 15, P_MASMORRA: 16, MATA: 17 };
AM.CHAO = [];
[
  [0, 'Grama', true], [1, 'Terra', true], [2, 'Terra arada', true], [3, 'Terra molhada', true], [4, 'Areia', true],
  [5, 'Neve', true], [6, 'Água', false], [7, 'Água funda', false], [8, 'Pedra', true], [9, 'Lama', true], [10, 'Estrada', true],
  [11, 'Piso de madeira', true], [12, 'Piso de pedra', true], [13, 'Piso de estufa', true], [14, 'Ponte', true], [15, 'Gelo', true],
  [16, 'Chão da masmorra', true], [17, 'Mata', true],
].forEach(([id, nome, andavel]) => { AM.CHAO[id] = { nome, andavel }; });
AM.ehAgua = c => c === AM.CH.AGUA || c === AM.CH.FUNDA;
AM.aravel = c => [AM.CH.GRAMA, AM.CH.TERRA, AM.CH.MATA, AM.CH.AREIA, AM.CH.LAMA].includes(c);

// ---------- objetos sobre o chão ----------
// solido: bloqueia; alto: desenhado com altura; ferr: ferramenta que derruba; vida: golpes; drop: [item, min, max]
AM.OB = {};
AM.OBJ = [];
function defObj(id, chave, nome, p = {}) { AM.OB[chave.toUpperCase()] = id; AM.OBJ[id] = Object.assign({ id, chave, nome, solido: false }, p); }
defObj(0, 'nada', '');
defObj(1, 'arvore', 'Árvore', { solido: true, alto: true, ferr: 'machado', vida: 5, drop: [['madeira', 4, 6], ['semente_arvore', 0, 1]], toco: true });
defObj(2, 'pinheiro', 'Pinheiro', { solido: true, alto: true, ferr: 'machado', vida: 5, drop: [['madeira', 4, 6], ['semente_pinheiro', 0, 1]], toco: true });
defObj(3, 'cacto', 'Cacto', { solido: true, ferr: 'machado', vida: 2, drop: [['polpa_cacto', 1, 2]] });
defObj(4, 'arbusto', 'Arbusto de frutinhas', { solido: true, ferr: 'machado', vida: 2, drop: [['fibra', 1, 2]], colhe: 'frutinha' });
defObj(5, 'pedra', 'Pedra', { solido: true, ferr: 'picareta', vida: 3, drop: [['pedra', 2, 3]] });
defObj(6, 'ferro', 'Minério de ferro', { solido: true, ferr: 'picareta', vida: 4, drop: [['minerio_ferro', 1, 2], ['pedra', 0, 1]] });
defObj(7, 'ouro', 'Minério de ouro', { solido: true, ferr: 'picareta', vida: 5, drop: [['minerio_ouro', 1, 2]] });
defObj(8, 'cristal', 'Cristal', { solido: true, ferr: 'picareta', vida: 6, drop: [['cristal', 1, 2]], luz: 2 });
defObj(9, 'flor', 'Flor', { ferr: 'mao', vida: 1, drop: [['flor', 1, 1]] });
defObj(10, 'capim', 'Capim', { ferr: 'mao', vida: 1, drop: [['fibra', 1, 1], ['feno', 0, 1]] });
defObj(11, 'junco', 'Junco', { ferr: 'mao', vida: 1, drop: [['fibra', 1, 2]] });
defObj(12, 'tronco', 'Tronco caído', { solido: true, ferr: 'machado', vida: 3, drop: [['madeira', 2, 3]] });
defObj(13, 'cogumelo', 'Cogumelo', { ferr: 'mao', vida: 1, drop: [['cogumelo', 1, 1]] });
defObj(14, 'toco', 'Toco', { solido: true, ferr: 'machado', vida: 2, drop: [['madeira', 1, 2]] });
defObj(15, 'muda', 'Muda de árvore', { ferr: 'mao', vida: 1, drop: [['semente_arvore', 1, 1]], cresce: 'arvore' });
defObj(16, 'muda_pinheiro', 'Muda de pinheiro', { ferr: 'mao', vida: 1, drop: [['semente_pinheiro', 1, 1]], cresce: 'pinheiro' });
defObj(17, 'murcha', 'Planta murcha', { ferr: 'mao', vida: 1, drop: [['fibra', 1, 1]] });
// colocados pelo jogador (o item tem o mesmo nome)
defObj(20, 'parede_madeira', 'Parede de madeira', { solido: true, bloco: true, ferr: 'machado', vida: 2, drop: [['parede_madeira', 1, 1]] });
defObj(21, 'parede_pedra', 'Parede de pedra', { solido: true, bloco: true, ferr: 'picareta', vida: 3, drop: [['parede_pedra', 1, 1]] });
defObj(22, 'porta', 'Porta', { porta: true, ferr: 'machado', vida: 2, drop: [['porta', 1, 1]] });
defObj(23, 'janela', 'Janela', { solido: true, bloco: true, ferr: 'machado', vida: 2, drop: [['janela', 1, 1]] });
defObj(24, 'cerca', 'Cerca', { solido: true, ferr: 'machado', vida: 1, drop: [['cerca', 1, 1]] });
defObj(25, 'portao', 'Portão', { porta: true, ferr: 'machado', vida: 1, drop: [['portao', 1, 1]] });
defObj(26, 'tocha', 'Tocha', { luz: 4, ferr: 'mao', vida: 1, drop: [['tocha', 1, 1]] });
defObj(27, 'fogueira', 'Fogueira', { solido: true, luz: 5, calor: true, estacao: 'fogo', ferr: 'mao', vida: 1, drop: [['fogueira', 1, 1]] });
defObj(28, 'fogao', 'Fogão', { solido: true, luz: 2, calor: true, estacao: 'fogao', ferr: 'picareta', vida: 2, drop: [['fogao', 1, 1]] });
defObj(29, 'forno', 'Forno', { solido: true, luz: 3, calor: true, estacao: 'forno', ferr: 'picareta', vida: 2, drop: [['forno', 1, 1]] });
defObj(30, 'aquecedor', 'Aquecedor', { solido: true, luz: 2, calor: true, ferr: 'picareta', vida: 2, drop: [['aquecedor', 1, 1]] });
defObj(31, 'cama', 'Cama', { solido: true, cama: true, ferr: 'machado', vida: 2, drop: [['cama', 1, 1]] });
defObj(32, 'bau', 'Baú', { solido: true, bau: true, ferr: 'machado', vida: 2, drop: [['bau', 1, 1]] });
defObj(33, 'bancada', 'Bancada', { solido: true, estacao: 'bancada', ferr: 'machado', vida: 2, drop: [['bancada', 1, 1]] });
defObj(34, 'cocho', 'Cocho', { solido: true, cocho: true, ferr: 'machado', vida: 2, drop: [['cocho', 1, 1]] });
defObj(35, 'palha', 'Palha', { calor: true, ferr: 'mao', vida: 1, drop: [['palha', 1, 1]] });
defObj(36, 'colmeia', 'Colmeia', { solido: true, colmeia: true, ferr: 'machado', vida: 2, drop: [['colmeia', 1, 1]] });
defObj(37, 'caixa_venda', 'Caixa de vendas', { solido: true, venda: true, ferr: 'machado', vida: 2, drop: [['caixa_venda', 1, 1]] });
defObj(38, 'espantalho', 'Espantalho', { solido: true, ferr: 'machado', vida: 1, drop: [['espantalho', 1, 1]] });
defObj(39, 'mesa', 'Mesa', { solido: true, ferr: 'machado', vida: 1, drop: [['mesa', 1, 1]] });
defObj(40, 'cadeira', 'Cadeira', { ferr: 'machado', vida: 1, drop: [['cadeira', 1, 1]] });
defObj(41, 'vaso', 'Vaso de flores', { solido: true, ferr: 'mao', vida: 1, drop: [['vaso', 1, 1]] });
defObj(42, 'balcao', 'Balcão da loja', { solido: true, balcao: true, ferr: 'machado', vida: 2, drop: [['balcao', 1, 1]] });
defObj(43, 'quadro', 'Quadro de missões', { solido: true, quadro: true });
defObj(44, 'placa', 'Placa', { solido: true });
defObj(45, 'vidro', 'Parede de vidro', { solido: true, bloco: true, ferr: 'picareta', vida: 1, drop: [['vidro', 1, 1]] });
defObj(46, 'poco', 'Poço', { solido: true, agua: true });
// fixos (vila e masmorras): não quebram
defObj(50, 'parede_vila', 'Parede', { solido: true, bloco: true, fixo: true });
defObj(51, 'telhado', 'Telhado', { solido: true, bloco: true, fixo: true });
defObj(52, 'entrada', 'Entrada da masmorra', { solido: true, entrada: true, fixo: true });
defObj(53, 'saida', 'Escada para a superfície', { saida: true, fixo: true });
defObj(54, 'rocha', 'Parede da masmorra', { solido: true, bloco: true, fixo: true });
defObj(55, 'tesouro', 'Baú do tesouro', { solido: true, tesouro: true, fixo: true });
defObj(56, 'barraca', 'Barraca', { solido: true, fixo: true });
defObj(57, 'lampiao', 'Lampião', { solido: true, luz: 5, fixo: true });
defObj(58, 'porta_vila', 'Porta', { solido: true, fixo: true });

// ---------- itens ----------
// cat: ferramenta, arma, municao, semente, colheita, comida, bebida, material, bloco, movel, veiculo, cosmetico, especial
// ic: como desenhar o ícone (ver sprites.js)
AM.ITENS = {};
function item(id, nome, cat, preco, p = {}) { AM.ITENS[id] = Object.assign({ id, nome, cat, preco, pilha: 99 }, p); }
const FERR = { pilha: 1 };
item('enxada', 'Enxada', 'ferramenta', 0, { ...FERR, ferr: 'enxada', ic: ['enxada'], desc: 'Ara a terra para plantar.' });
item('regador', 'Regador', 'ferramenta', 0, { ...FERR, ferr: 'regador', ic: ['regador'], cargaMax: 25, desc: 'Rega as plantas. Encha na água.' });
item('machado', 'Machado', 'ferramenta', 0, { ...FERR, ferr: 'machado', ic: ['machado'], desc: 'Corta árvores, troncos e desmonta móveis.' });
item('picareta', 'Picareta', 'ferramenta', 0, { ...FERR, ferr: 'picareta', ic: ['picareta'], desc: 'Quebra pedras e minérios.' });
item('vara', 'Vara de pesca', 'ferramenta', 120, { ...FERR, ferr: 'vara', ic: ['vara'], desc: 'Use virado para a água e espere o peixe morder.' });
item('cantil', 'Cantil', 'ferramenta', 60, { ...FERR, ferr: 'cantil', ic: ['cantil'], cargaMax: 3, desc: 'Guarda água. Encha num rio, lago ou poço.' });
item('espada_madeira', 'Espada de madeira', 'arma', 10, { ...FERR, dano: 5, ic: ['espada', '#b98552'] });
item('espada_ferro', 'Espada de ferro', 'arma', 150, { ...FERR, dano: 10, ic: ['espada', '#c9d1dc'] });
item('espada_cristal', 'Espada de cristal', 'arma', 600, { ...FERR, dano: 18, ic: ['espada', '#8ff0ff'] });
item('arco', 'Arco', 'arma', 120, { ...FERR, distancia: true, dano: 7, ic: ['arco'], desc: 'Atira flechas na direção do mouse.' });
item('flecha', 'Flecha', 'municao', 2, { ic: ['flecha'] });

// colheitas e sementes
AM.CULTURAS = {
  nabo:      { nome: 'Nabo', estacoes: [0], dias: 4, preco: 35, cor: '#f2f0ff', cor2: '#b36ad6', forma: 'raiz' },
  batata:    { nome: 'Batata', estacoes: [0], dias: 6, preco: 70, cor: '#c9a06a', cor2: '#8a6a3a', forma: 'redonda' },
  morango:   { nome: 'Morango', estacoes: [0], dias: 8, rebrota: 4, preco: 45, cor: '#e8354a', cor2: '#ffe066', forma: 'morango' },
  trigo:     { nome: 'Trigo', estacoes: [0, 1, 2], dias: 4, preco: 20, cor: '#e8c25a', cor2: '#b8902a', forma: 'trigo' },
  tomate:    { nome: 'Tomate', estacoes: [1], dias: 7, rebrota: 3, preco: 50, cor: '#e8402a', cor2: '#3a9a3a', forma: 'redonda' },
  milho:     { nome: 'Milho', estacoes: [1, 2], dias: 9, rebrota: 4, preco: 45, cor: '#ffd84a', cor2: '#7ab84a', forma: 'comprida' },
  melancia:  { nome: 'Melancia', estacoes: [1], dias: 11, preco: 220, cor: '#3a9a3a', cor2: '#1f6a2a', forma: 'listrada' },
  abobora:   { nome: 'Abóbora', estacoes: [2], dias: 12, preco: 280, cor: '#f0882a', cor2: '#b85a1a', forma: 'abobora' },
  berinjela: { nome: 'Berinjela', estacoes: [2], dias: 5, rebrota: 5, preco: 55, cor: '#6a3a9a', cor2: '#3a9a3a', forma: 'comprida' },
  couve:     { nome: 'Couve-de-inverno', estacoes: [3], dias: 10, preco: 160, cor: '#5aa84a', cor2: '#2f7a3a', forma: 'folha', inverno: true },
};
for (const [id, c] of Object.entries(AM.CULTURAS)) {
  const est = c.estacoes.map(e => AM.ESTACOES[e]).join(', ');
  item('semente_' + id, 'Semente de ' + c.nome.toLowerCase(), 'semente', Math.round(c.preco * .25), { cultura: id, ic: ['semente', c.cor], desc: `Plante em terra arada. Estação: ${est}. Pronta em ${c.dias} dias.` });
  item(id, c.nome, 'colheita', c.preco, { ic: ['fruta', c.forma, c.cor, c.cor2] });
}
AM.ITENS.semente_couve.desc += ' Cresce ao ar livre mesmo no inverno.';
item('semente_arvore', 'Bolota', 'semente', 5, { muda: 'muda', ic: ['semente', '#8a5a32'], desc: 'Plante na grama para nascer uma árvore.' });
item('semente_pinheiro', 'Pinha', 'semente', 5, { muda: 'muda_pinheiro', ic: ['semente', '#6b4226'], desc: 'Plante na grama para nascer um pinheiro.' });

// comida e bebida: fome, sede, vida
const C = (fome, sede = 0, vida = 0) => ({ comida: { fome, sede, vida } });
Object.assign(AM.ITENS.nabo, C(10, 2), { cozinha: 'nabo_assado' });
Object.assign(AM.ITENS.batata, C(6), { cozinha: 'batata_assada' });
Object.assign(AM.ITENS.morango, C(8, 4));
Object.assign(AM.ITENS.tomate, C(10, 10));
Object.assign(AM.ITENS.milho, C(8), { cozinha: 'milho_assado' });
Object.assign(AM.ITENS.melancia, C(15, 30));
Object.assign(AM.ITENS.abobora, C(12));
Object.assign(AM.ITENS.berinjela, C(8), { cozinha: 'berinjela_grelhada' });
Object.assign(AM.ITENS.couve, C(12, 4), { cozinha: 'couve_refogada' });
item('frutinha', 'Frutinhas', 'comida', 8, { ...C(8, 4), ic: ['fruta', 'cacho', '#7a3ad6', '#3a9a3a'] });
item('cogumelo', 'Cogumelo', 'comida', 20, { ...C(6), cozinha: 'cogumelo_grelhado', ic: ['cogumelo'] });
item('peixe', 'Peixe', 'comida', 40, { ...C(8, 0, -2), cozinha: 'peixe_assado', ic: ['peixe', '#7ab0d6'] });
item('peixe_dourado', 'Peixe dourado', 'comida', 160, { ...C(10), cozinha: 'peixe_assado', ic: ['peixe', '#ffc83a'] });
item('carne_crua', 'Carne crua', 'comida', 30, { ...C(10, 0, -5), cozinha: 'carne_assada', ic: ['carne'] });
item('ovo', 'Ovo', 'comida', 30, { ...C(5), cozinha: 'ovo_frito', ic: ['ovo'] });
item('leite', 'Leite', 'bebida', 60, { ...C(5, 30, 2), ic: ['garrafa', '#f8f8f0'] });
item('mel', 'Mel', 'comida', 90, { ...C(10, 0, 12), ic: ['pote', '#ffb52a'] });
item('polpa_cacto', 'Polpa de cacto', 'bebida', 12, { ...C(2, 22), ic: ['fruta', 'redonda', '#7ac25a', '#4a8a3a'] });
item('agua', 'Água do cantil', 'bebida', 0, { ...C(0, 40) });
item('pocao', 'Poção de vida', 'bebida', 80, { ...C(0, 10, 60), ic: ['garrafa', '#ff5a7a'] });
const PRATO = (id, nome, preco, cor, fome, sede, vida) => item(id, nome, 'comida', preco, { ...C(fome, sede, vida), ic: ['prato', cor] });
PRATO('nabo_assado', 'Nabo assado', 60, '#e8d8f0', 24, 0, 6);
PRATO('batata_assada', 'Batata assada', 110, '#d9a85a', 32, 0, 10);
PRATO('milho_assado', 'Milho assado', 80, '#ffd84a', 26, 0, 6);
PRATO('berinjela_grelhada', 'Berinjela grelhada', 90, '#7a4aa8', 26, 0, 10);
PRATO('couve_refogada', 'Couve refogada', 240, '#4a9a3a', 30, 4, 20);
PRATO('cogumelo_grelhado', 'Cogumelo grelhado', 45, '#c9a888', 20, 0, 10);
PRATO('peixe_assado', 'Peixe assado', 90, '#e0a070', 36, 0, 16);
PRATO('carne_assada', 'Carne assada', 80, '#a0522d', 45, 0, 20);
PRATO('ovo_frito', 'Ovo frito', 60, '#fff3a0', 25, 0, 8);
item('pao', 'Pão', 'comida', 70, { ...C(35, 0, 6), ic: ['pao'] });
item('torta_morango', 'Torta de morango', 'comida', 260, { ...C(45, 5, 25), ic: ['torta', '#e8354a'] });
item('sopa_abobora', 'Sopa de abóbora', 'comida', 420, { ...C(50, 20, 30), ic: ['sopa', '#f0882a'] });

// materiais
const M = (id, nome, preco, ic) => item(id, nome, 'material', preco, { ic });
M('madeira', 'Madeira', 4, ['madeira']);
M('pedra', 'Pedra', 3, ['pedra']);
M('fibra', 'Fibra', 2, ['fibra']);
M('feno', 'Feno', 5, ['feno']);
M('flor', 'Flor', 15, ['flor']);
M('minerio_ferro', 'Minério de ferro', 12, ['minerio', '#c98a6a']);
M('minerio_ouro', 'Minério de ouro', 30, ['minerio', '#ffd23f']);
M('barra_ferro', 'Barra de ferro', 50, ['barra', '#c9d1dc']);
M('barra_ouro', 'Barra de ouro', 130, ['barra', '#ffd23f']);
M('cristal', 'Cristal', 80, ['cristal', '#8ff0ff']);
M('carvao', 'Carvão', 10, ['carvao']);
M('couro', 'Couro', 25, ['couro']);
M('la', 'Lã', 70, ['la']);
M('tecido', 'Tecido', 160, ['tecido']);
M('osso', 'Osso', 10, ['osso']);
M('gosma', 'Gosma de slime', 6, ['gosma']);

// blocos e móveis (viram objetos ao colocar)
const COLOCA = (id, nome, preco, cat = 'bloco', extra = {}) => item(id, nome, cat, preco, Object.assign({ obj: AM.OB[id.toUpperCase()], ic: ['obj', id] }, extra));
COLOCA('parede_madeira', 'Parede de madeira', 6);
COLOCA('parede_pedra', 'Parede de pedra', 8);
COLOCA('vidro', 'Parede de vidro', 20);
COLOCA('janela', 'Janela', 25);
COLOCA('porta', 'Porta', 15);
COLOCA('cerca', 'Cerca', 3);
COLOCA('portao', 'Portão', 8);
item('piso_madeira', 'Piso de madeira', 'bloco', 3, { piso: AM.CH.P_MADEIRA, ic: ['piso', '#b98552'] });
item('piso_pedra', 'Piso de pedra', 'bloco', 4, { piso: AM.CH.P_PEDRA, ic: ['piso', '#9a9aa8'] });
item('piso_estufa', 'Piso de estufa', 'bloco', 10, { piso: AM.CH.P_ESTUFA, ic: ['piso', '#7ab06a'], desc: 'Plantas sobre ele crescem em qualquer estação.' });
item('caminho', 'Pedras de caminho', 'bloco', 2, { piso: AM.CH.CAMINHO, ic: ['piso', '#c9a46a'], desc: 'O carrinho anda mais rápido na estrada.' });
COLOCA('tocha', 'Tocha', 5, 'movel');
COLOCA('fogueira', 'Fogueira', 10, 'movel', { desc: 'Cozinha e esquenta comida. Também aquece e ilumina.' });
COLOCA('fogao', 'Fogão', 120, 'movel', { desc: 'Cozinha pratos melhores.' });
COLOCA('forno', 'Forno', 150, 'movel', { desc: 'Assa pães e tortas e funde minérios.' });
COLOCA('aquecedor', 'Aquecedor', 200, 'movel', { desc: 'Mantém um abrigo de animais quente no inverno.' });
COLOCA('cama', 'Cama', 80, 'movel', { desc: 'Durma para passar o dia e salvar. Vira seu ponto de retorno.' });
COLOCA('bau', 'Baú', 30, 'movel');
COLOCA('bancada', 'Bancada', 20, 'movel', { desc: 'Libera receitas de construção e ferramentas.' });
COLOCA('cocho', 'Cocho', 40, 'movel', { desc: 'Ponha feno para os animais do abrigo comerem.' });
COLOCA('palha', 'Palha', 10, 'movel', { desc: 'Forra o abrigo e ajuda a aquecer os animais.' });
COLOCA('colmeia', 'Colmeia', 120, 'movel', { desc: 'Dá mel a cada 3 dias (menos no inverno).' });
COLOCA('caixa_venda', 'Caixa de vendas', 50, 'movel', { desc: 'O que você puser aqui é vendido de noite.' });
COLOCA('espantalho', 'Espantalho', 40, 'movel');
COLOCA('mesa', 'Mesa', 30, 'movel');
COLOCA('cadeira', 'Cadeira', 15, 'movel');
COLOCA('vaso', 'Vaso de flores', 25, 'movel');
COLOCA('balcao', 'Balcão da loja', 60, 'movel', { desc: 'Ponha itens à venda: clientes da vila compram ao longo do dia.' });

// veículos, cosméticos e especiais
item('carrinho', 'Carrinho', 'veiculo', 400, { pilha: 1, veiculo: 'carrinho', ic: ['carrinho'], desc: 'Coloque no chão e suba. Mais rápido na estrada e leva 8 itens a mais.' });
item('balao', 'Balão', 'veiculo', 1500, { pilha: 1, veiculo: 'balao', ic: ['balao'], desc: 'Voa por cima de rios e montanhas. Pouse num lugar livre.' });
item('faixa_ninja', 'Faixa ninja', 'cosmetico', 120, { pilha: 1, ic: ['faixa'], desc: 'Use para ficar estiloso. Libera o Jutsu Clone das Sombras (J).' });
item('cristal_inveja', 'Cristal da Inveja', 'especial', 999, { pilha: 1, ic: ['cristal', '#b06aff'], desc: 'Um cristal roxo e frio. Sussurra coisas... Leve à bancada.' });
item('retorno_morte', 'Retorno pela Morte', 'especial', 0, { pilha: 1, ic: ['ampulheta'], desc: 'Se você morrer, volta ao começo do dia com tudo que tinha. Deixa um "eco": Sorte -2 por um dia. Some depois de usar.' });
