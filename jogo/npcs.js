// Moradores da vila: personalidade, falas que mudam com a hora, o clima, a
// estação e a amizade; presentes (o que cada um ama ou odeia) e agrados
// quando a amizade cresce.
'use strict';

AM.NPCS = {
  Iara: {
    titulo: 'Mestra da Guilda', ama: ['cristal', 'barra_ouro', 'flor'], gosta: ['pocao', 'mel', 'peixe_dourado'], odeia: ['gosma', 'osso'],
    agrados: { 3: ['pocao', 2], 6: ['flecha', 20], 10: ['espada_cristal', 1] },
    falas: {
      geral: ['Toda grande jornada começa com uma missão pequena. Até matar slime conta!', 'A Guilda existe para que ninguém enfrente o perigo sozinho.', 'Vi seu nome no quadro de novo. Isso me deixa orgulhosa.', 'Dizem que o Rei Esqueleto guarda um cristal que sussurra. Eu não chegaria perto... mas você é você.'],
      manha: ['Bom dia! O quadro de missões acabou de ser atualizado.', 'Cedo assim e já de pé? Gosto de aventureiros disciplinados.'],
      noite: ['À noite as criaturas ficam ousadas. Leve tochas.', 'Eu fico aqui até tarde, caso alguém volte ferido.'],
      chuva: ['Chuva é bom pra lavar o sangue de slime da armadura. Brincadeira. Mais ou menos.'],
      inverno: ['No inverno os lobos descem da tundra. Cuidado na estrada do norte.'],
      amiga: ['Sabe, você me lembra de quando eu comecei. Só que você é mais teimoso(a).', 'Se precisar de qualquer coisa, a Guilda é sua casa também.'],
    },
  },
  Bento: {
    titulo: 'Dono do mercado', ama: ['torta_morango', 'abobora', 'melancia'], gosta: ['pao', 'mel', 'morango', 'batata_assada'], odeia: ['pedra', 'gosma'],
    agrados: { 3: ['semente_morango', 5], 6: ['semente_melancia', 4], 10: ['torta_morango', 3] },
    falas: {
      geral: ['Comida boa é metade da aventura. A outra metade é sobremesa!', 'Plantou nabo? Nabo é o começo de toda fortuna. Confia.', 'Se a colheita sair grande, me traz que eu pago bem!', 'O segredo da batata assada é paciência. E sal. Mais sal do que paciência.'],
      manha: ['Chegaram sementes fresquinhas! Cheira essa terra, cheira!'],
      noite: ['Já tô fechando o caixa, mas pra você eu abro uma exceção.'],
      chuva: ['Chuva é a melhor amiga do fazendeiro. Hoje ninguém precisa regar!'],
      inverno: ['No inverno só a couve aguenta lá fora. Ou faz uma estufa, que é mais esperto.'],
      amiga: ['Guardei um pãozinho pra você. Não conta pros outros!', 'Você virou meu cliente favorito. Mas não espalha, os outros ficam com ciúme.'],
    },
  },
  Brasa: {
    titulo: 'Ferreira', ama: ['minerio_ouro', 'barra_ouro'], gosta: ['barra_ferro', 'carvao', 'minerio_ferro', 'carne_assada'], odeia: ['flor', 'vaso'],
    agrados: { 3: ['carvao', 10], 6: ['barra_ferro', 5], 10: ['espada_ferro', 1] },
    falas: {
      geral: ['Aço bom não se faz com pressa. Gente boa também não.', 'Traga minério que eu transformo em coisa útil.', 'Sua espada tá cega. Brincadeira. Tá péssima mesmo.', 'Golem de Cristal? Se derrubar um, me traz um pedaço. Quero estudar.'],
      manha: ['A forja já tá quente. Fala logo que o ferro esfria.'],
      noite: ['Ainda acordado? Eu também. O martelo não dorme.'],
      chuva: ['Chuva e forja não combinam. Ficou tudo chiando.'],
      inverno: ['Inverno é a melhor época pra ferreira. Pelo menos aqui dentro tá quente.'],
      amiga: ['Não sou de falar muito, mas... valeu por aparecer.', 'Fiz um desconto pra você. Não sou mole, só sou justa.'],
    },
  },
  'Tião': {
    titulo: 'Carpinteiro', ama: ['madeira', 'pao', 'cadeira'], gosta: ['mesa', 'carvao', 'milho_assado'], odeia: ['gosma', 'osso'],
    agrados: { 3: ['madeira', 30], 6: ['bancada', 1], 10: ['cama', 1] },
    falas: {
      geral: ['Sabe por que a árvore não usa celular? Porque ela já tem muitos galhos. Hehe.', 'Uma casa começa com uma parede. E muita paciência.', 'Com uma planta pronta você constrói rapidinho. Mas bloco a bloco tem mais alma.', 'Madeira boa range, mas não quebra. Igual gente.'],
      manha: ['Café, serragem e bom dia! Nessa ordem.'],
      noite: ['A essa hora eu só lixo madeira e penso na vida.'],
      chuva: ['Madeira molhada empena. Cubra suas construções!'],
      inverno: ['Celeiro sem aquecedor no inverno é maldade com os bichinhos.'],
      amiga: ['Você tem jeito pra construção. Já pensou em ser carpinteiro?', 'Separei umas tábuas bonitas pra você.'],
    },
  },
  Cida: {
    titulo: 'Cuidadora do estábulo', ama: ['feno', 'leite', 'flor'], gosta: ['frutinha', 'mel', 'ovo_frito'], odeia: ['carne_crua'],
    agrados: { 3: ['feno', 15], 6: ['palha', 4], 10: ['colmeia', 1] },
    falas: {
      geral: ['Bicho bem cuidado é bicho feliz. E bicho feliz dá ovo, leite e lã!', 'Dá um carinho todo dia nos seus animais. Eles sentem.', 'Esse gatinho da praça vive com fome. Um peixinho e ele vira seu.', 'No meu tempo a gente conversava com as vacas. Ainda converso, aliás.'],
      manha: ['Bom dia, meu bem! Já deu comida pros bichos?'],
      noite: ['Os bichinhos já tão dormindo. Fala baixinho.'],
      chuva: ['Dia de chuva o galinheiro fica cheiroso. Cheiro de lar.'],
      inverno: ['Palha e aquecedor no abrigo, viu? Bicho com frio fica doente.'],
      amiga: ['Você cuida tão bem dos seus animais. Fico emocionada.', 'Pode me chamar de vó. Todo mundo chama.'],
    },
  },
  Lia: {
    titulo: 'Sonha em ser aventureira', ama: ['cristal', 'faixa_ninja'], gosta: ['flor', 'frutinha', 'pao'], odeia: ['gosma'],
    agrados: { 3: ['flor', 3], 6: ['pocao', 1], 10: ['tecido', 2] },
    falas: {
      geral: ['Quando eu crescer vou derrotar o Slime Rei! Você já derrotou?', 'Dizem que tem uma cripta no pântano... Me conta como é?', 'O Doidobot me ensinou a fazer joinha. Olha: 👍', 'Eu treino com espada de madeira todo dia. Um dia eu chego lá!'],
      noite: ['Minha mãe falou pra eu não sair de noite. Mas eu sou corajosa!'],
      amiga: ['Você é minha heroína! Ou herói! Os dois!'],
    },
  },
  Caio: {
    titulo: 'Sabe de tudo na vila', ama: ['carne_assada', 'sopa_abobora'], gosta: ['peixe_assado', 'pao', 'mel'], odeia: ['pedra'],
    agrados: { 3: ['pao', 3], 6: ['carne_assada', 2], 10: ['peixe_dourado', 1] },
    falas: {
      geral: ['Você soube? O Doidobot chorou vendo o pôr do sol. De novo.', 'Dizem que a Brasa já derrotou um golem na mão. Não sei se acredito.', 'A Iara tá de olho em você. No bom sentido! Acho.', 'O Bento jura que nabo dá sorte. Eu juro que não.'],
      noite: ['A essa hora é que saem as melhores fofocas.'],
      amiga: ['Pra você eu conto o segredo: o Tião faz piada ruim de propósito.'],
    },
  },
  Nina: {
    titulo: 'Desenha a vila', ama: ['flor', 'tecido', 'vaso'], gosta: ['frutinha', 'mel', 'cristal'], odeia: ['gosma', 'osso'],
    agrados: { 3: ['flor', 5], 6: ['vaso', 1], 10: ['balao', 1] },
    falas: {
      geral: ['Tô desenhando o pôr do sol. As cores daqui são diferentes, já reparou?', 'Já viu o balão que passa no céu de manhã? Quero desenhar ele de perto.', 'Desenhei você e o Doidobot. Ele chorou quando viu.', 'Arte é pegar um pedaço do mundo e guardar.'],
      chuva: ['A chuva deixa tudo com cara de aquarela.'],
      amiga: ['Posso pintar a sua fazenda um dia? Ela é linda.'],
    },
  },
};

AM.npc = (() => {
  const E = nome => (AM.E.amizade ||= {})[nome] ||= { pontos: 0, conversa: 0, presente: 0, agrados: [] };
  const coracoes = nome => Math.min(10, Math.floor(E(nome).pontos / 10));
  const descontoAmizade = nome => Math.floor(coracoes(nome) / 2);

  function fala(nome) {
    const d = AM.NPCS[nome];
    if (!d) return 'Olá!';
    const t = AM.tempo, f = d.falas, op = [...f.geral];
    if (t.minuto < 11 * 60 && f.manha) op.push(...f.manha, ...f.manha);
    if (AM.sis.ehNoite() && f.noite) op.push(...f.noite, ...f.noite);
    if (t.clima === 'chuva' && f.chuva) op.push(...f.chuva, ...f.chuva);
    if (t.estacao === 3 && f.inverno) op.push(...f.inverno, ...f.inverno);
    if (coracoes(nome) >= 4 && f.amiga) op.push(...f.amiga, ...f.amiga);
    return AM.u.escolha(op);
  }

  // conversar dá amizade uma vez por dia
  function conversar(nome) {
    const e = E(nome);
    if (e.conversa !== AM.tempo.dia) { e.conversa = AM.tempo.dia; ganhar(nome, 2); }
    return fala(nome);
  }

  function ganhar(nome, n) {
    const e = E(nome), antes = coracoes(nome);
    e.pontos = limitar(e.pontos + n, 0, 100);
    const depois = coracoes(nome);
    if (depois > antes) {
      AM.fx.coracao(AM.jog.x, AM.jog.y - 30);
      const ag = AM.NPCS[nome].agrados[depois];
      if (ag && !e.agrados.includes(depois)) {
        e.agrados.push(depois);
        AM.inv.dar(ag[0], ag[1]);
        AM.ui.aviso(`${nome} gosta muito de você (${depois} ❤) e te deu ${ag[1]} × ${AM.ITENS[ag[0]].nome}!`, 'ouro');
      }
    }
  }

  // presente: uma vez por dia por pessoa
  function presentear(nome, idItem) {
    const e = E(nome), d = AM.NPCS[nome];
    if (e.presente === AM.tempo.dia) return `${nome} já ganhou um presente hoje. Volte amanhã!`;
    if (!AM.inv.remover(idItem, 1)) return '';
    e.presente = AM.tempo.dia;
    const it = AM.ITENS[idItem].nome.toLowerCase(), It = AM.ITENS[idItem].nome;
    let resp;
    if (d.ama.includes(idItem)) { ganhar(nome, 10); resp = `${It}?! Eu AMO isso! Como você sabia? Muito obrigado(a)!`; AM.som('nivel'); }
    else if (d.gosta.includes(idItem)) { ganhar(nome, 5); resp = `Que gentileza! Eu gosto bastante de ${it}.`; AM.som('pop'); }
    else if (d.odeia.includes(idItem)) { ganhar(nome, -4); resp = `Hã... ${it}? Obrigado(a)... eu acho.`; }
    else { ganhar(nome, 2); resp = `Obrigado(a) pelo presente! ${It}, que legal.`; }
    AM.ev.emit('presente', { nome, id: idItem });
    return resp;
  }

  return { fala, conversar, presentear, coracoes, descontoAmizade, estado: E };
})();
