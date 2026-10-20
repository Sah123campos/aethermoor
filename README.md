# Aethermoor

## Jogo completo (versão 1)

- **Solo:** abra `index.html` e clique em **Novo jogo** (abertura + jogo) ou em **Continuar**.
- **Cooperativo (até 8):** `node servidor/servidor.js` e abra `http://localhost:8080`. Em Opções → Multijogador, crie uma sala e passe o código; os amigos usam "Entrar numa sala".
- Controles: WASD anda, Espaço/clique usa, F/clique direito interage, 1–8 hotbar, E inventário, B construção, Q missões, C atributos, M mapa, H Doidobot, J jutsu, T chat, Esc opções (todos remapeáveis).
- Código do jogo em `jogo/` (mundo, jogador, criaturas, sistemas, missões, construção, masmorras, render, UI, rede) e servidor em `servidor/`.

### No celular
Funciona em pé e deitado. Direcional aparece onde o dedão encosta (empurre até a borda para correr), botão **Usar** mostra o item da mão, e o botão de ação muda sozinho (Falar, Colher, Dormir, Abrir...). Toque num quadrado do lado para agir, toque longe para andar até lá, toque num morador para ir conversar. Menu ☰ tem tela cheia; em Opções → Acessibilidade dá para aproximar o mundo (Zoom).

### Moradores
Fale com qualquer um (F, botão de ação ou toque). Cada um tem personalidade e falas que mudam com a hora, o clima e a estação. Dê presentes (um por dia): cada um ama, gosta ou odeia certas coisas. Amizade dá corações, desconto na loja e presentes de volta.

### Doidobot com inteligência artificial
Com o servidor (`node servidor/servidor.js`), o Doidobot conversa de verdade: entende o que você escreve, sabe o que está acontecendo no jogo e lembra do que você conta. Sem IA, ele responde por palavras-chave.

- **DeepSeek no seu PC, de graça** (padrão): instale o Ollama (`curl -fsSL https://ollama.com/install.sh | sh`), baixe o modelo (`ollama pull deepseek-r1:7b`, ou `deepseek-r1:1.5b` se o PC for mais fraco) e rode o servidor. Ele acha o modelo sozinho. Sem placa de vídeo, cada resposta leva alguns segundos.
- **API do DeepSeek** (paga, barata): `DEEPSEEK_API_KEY=sua_chave node servidor/servidor.js`
- Também aceita Claude (`ANTHROPIC_API_KEY`, depois de `npm install` na pasta servidor) ou Gemini (`GEMINI_API_KEY`). `DOIDOBOT_IA=...` força uma.
- A chave fica só no servidor. Limites: 12 mensagens por minuto por pessoa e 600 por dia (mude com `DOIDOBOT_POR_MINUTO` e `DOIDOBOT_POR_DIA`).

### Roadmap
- Feito: mundo com 6 biomas, estações e clima, fome e sede, plantio e estufa, construção bloco a bloco e plantas prontas, animais com abrigo e calor, criaturas, 5 masmorras com chefes, Guilda e missões, níveis e atributos, lojas e loja própria, carrinho e balão, tutorial, Doidobot, acessibilidade, multijogador e salvamento na nuvem (servidor).
- Próximo: masmorras compartilhadas no cooperativo, criaturas sincronizadas entre jogadores, mais NPCs com rotina, escolha da aparência do personagem, mais andares de masmorra.

Jogo web de mundo aberto (fazenda + construção + RPG) com o assistente Doidobot.
Este é o **prólogo**: a animação em que você acorda numa campina e o Doidobot cai
do céu direto numa moita.

**Por que "Aethermoor"?** *Aether* é o éter, o céu acima das nuvens (onde passa o
Balão); *moor* é a charneca, uma terra selvagem e aberta para cultivar e construir.
Céu e terra: explorar lá em cima, criar raízes aqui embaixo.

## Como abrir

Abra `index.html` no navegador (funciona direto do arquivo, sem servidor).
Clique em **Acordar**. Espaço, Enter, clique ou toque avançam as falas; Esc abre as opções.

Parâmetros úteis para testar:

- `index.html?demo`: começa sozinho, sem som, e as falas avançam sozinhas
- `index.html?demo&ate=120&parar`: pula 120 segundos e congela a cena
- `index.html?pular`: vai direto para a tela de título

## O que tem na cena

- Madrugada virando manhã (estrelas, lua, sol nascendo, nuvens, balão), câmera descendo até a campina
- Você dormindo debaixo da árvore, passarinho pousando, olhos abrindo embaçados
- O Doidobot (uma cabeça amarela flutuante) cai do céu dando loopings, faz POF! na moita
- Diálogo com retrato expressivo: tonto, susto, apaixonado, chorando, nerd 🤓, sério...
- Piadas do ouvido ("o direito é só enfeite"), a história de que ele era humano e o raro
  **modo humano**: ele tenta virar gente, ganha cabelo cacheado e jaqueta de couro, mas não aguenta muito
- Você escolhe seu nome, ele aponta a Guilda de Aventureiros e a primeira missão aparece no rolo
- Tela de título: clique no Doidobot para ouvir curiosidades (e, bem raramente, ver ele virar humano)

Acessibilidade: Modo Lerdo (texto devagar e sem pressa), avanço automático das falas,
tamanho do texto, botão de som e respeito a "reduzir movimento" do sistema.
O menu de opções pausa a cena.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `js/motor.js` | resolução em pixels, cores, esperas e animações do roteiro |
| `js/som.js` | efeitos, voz de bipes do Doidobot e trilha que muda com a cena (Web Audio) |
| `js/cenario.js` | céu, serras, Guilda, floresta, campina, árvore e moita |
| `js/personagens.js` | jogador, sprite do Doidobot (e modo humano), passarinhos, partículas |
| `js/rosto.js` | retrato grande do Doidobot em SVG, com todas as expressões |
| `js/interface.js` | tela, laço do jogo, diálogo, opções, título |
| `js/roteiro.js` | o roteiro da abertura, cena por cena |
