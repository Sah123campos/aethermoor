// Som feito na hora com Web Audio: efeitos, a "voz" de bipes do Doidobot e uma
// trilha que muda com a cena (noite, amanhecer, Doidobot, título).
'use strict';

const Som = (() => {
  let ctx = null, mestre, efeitosBus, musica, musicaBus, eco, ruidoBuf;
  let ligado = true, modo = 'nada', proxima = 0, passo = 0;

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const COLCHEIA = 60 / 84 / 2;
  // Fmaj7, Em7, Dm7, Cmaj7: um ciclo calmo de fazenda ao amanhecer
  const ACORDES = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  const ARPEJO = [0, 2, 1, 3, 2, 1, 3, 2];
  // Am, F, Dm, E: masmorra
  const ACORDES_MENOR = [[57, 60, 64, 69], [53, 57, 60, 65], [50, 53, 57, 62], [52, 56, 59, 64]];

  function iniciar() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    mestre = ctx.createGain(); mestre.gain.value = ligado ? .7 : 0; mestre.connect(ctx.destination);
    efeitosBus = ctx.createGain(); efeitosBus.gain.value = .9; efeitosBus.connect(mestre);
    musica = ctx.createGain(); musica.gain.value = 0; musica.connect(mestre);
    // eco suave só para a melodia
    eco = ctx.createDelay(1); eco.delayTime.value = .36;
    const volta = ctx.createGain(); volta.gain.value = .3;
    const filtro = ctx.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 2200;
    eco.connect(filtro); filtro.connect(volta); volta.connect(eco); filtro.connect(musica);
    musicaBus = ctx.createGain(); musicaBus.connect(musica); musicaBus.connect(eco);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(agendar, 60);
  }

  function tom({ f, f2, dur, tipo = 'sine', vol = .2, ataque = .005, destino, quando = 0, vib = 0 }) {
    const t = ctx.currentTime + Math.max(0, quando);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    if (vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = 7; lg.gain.value = vib;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur);
    }
    o.connect(g); g.connect(destino || efeitosBus);
    o.start(t); o.stop(t + dur + .05);
  }

  function ruido({ dur, vol = .2, freq = 1200, q = 1, tipo = 'bandpass', quando = 0 }) {
    const t = ctx.currentTime + quando;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruidoBuf; s.loop = true;
    f.type = tipo; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(efeitosBus);
    s.start(t); s.stop(t + dur + .05);
  }

  const EFEITOS = {
    piar() {
      const n = 2 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) tom({ f: 2600 + Math.random() * 900, f2: 3900 + Math.random() * 800, dur: .07, vol: .05, quando: i * .1 });
    },
    assobio() { tom({ f: 1900, f2: 240, dur: 1.8, vol: .1, vib: 30 }); },
    impacto() {
      ruido({ dur: .4, vol: .45, freq: 700, tipo: 'lowpass' });
      tom({ f: 150, f2: 38, dur: .4, vol: .5 });
    },
    folhas() { ruido({ dur: .28, vol: .12, freq: 3200, q: .6 }); },
    pop() { tom({ f: 320, f2: 1000, dur: .13, vol: .16, tipo: 'triangle' }); },
    boing() { tom({ f: 180, f2: 520, dur: .3, vol: .14, tipo: 'triangle', vib: 40 }); },
    brilho() { [1047, 1319, 1568, 2093].forEach((f, i) => tom({ f, dur: .3, vol: .06, tipo: 'triangle', quando: i * .06 })); },
    missao() { [523, 659, 784, 1047].forEach((f, i) => tom({ f, dur: i === 3 ? .55 : .16, vol: .09, tipo: 'square', quando: i * .12 })); },
    passo() { ruido({ dur: .05, vol: .05, freq: 900 }); },
    pano() { ruido({ dur: .35, vol: .08, freq: 1800, q: .5 }); },
    glitch() {
      for (let i = 0; i < 9; i++) tom({ f: 120 + Math.random() * 1400, dur: .05, vol: .06, tipo: 'square', quando: i * .045 });
    },
    lagrima() { tom({ f: 900, f2: 600, dur: .18, vol: .06, vib: 60 }); },
    // sons do jogo
    enxada() { ruido({ dur: .12, vol: .18, freq: 500, tipo: 'lowpass' }); tom({ f: 180, f2: 90, dur: .1, vol: .1 }); },
    machado() { tom({ f: 220, f2: 120, dur: .09, vol: .18, tipo: 'triangle' }); ruido({ dur: .08, vol: .12, freq: 1400 }); },
    picareta() { tom({ f: 1200, f2: 900, dur: .07, vol: .1, tipo: 'square' }); ruido({ dur: .06, vol: .1, freq: 3000 }); },
    mato() { ruido({ dur: .15, vol: .1, freq: 2600, q: .6 }); },
    agua() { ruido({ dur: .3, vol: .1, freq: 900, q: .4 }); tom({ f: 600, f2: 1200, dur: .12, vol: .03 }); },
    plantar() { ruido({ dur: .08, vol: .1, freq: 700, tipo: 'lowpass' }); tom({ f: 500, f2: 700, dur: .08, vol: .05, tipo: 'triangle' }); },
    colher() { [660, 880].forEach((f, i) => tom({ f, dur: .12, vol: .07, tipo: 'triangle', quando: i * .07 })); },
    colocar() { tom({ f: 160, f2: 110, dur: .1, vol: .14, tipo: 'triangle' }); },
    erro() { tom({ f: 180, dur: .12, vol: .06, tipo: 'square' }); },
    moeda() { [988, 1319].forEach((f, i) => tom({ f, dur: .12, vol: .06, tipo: 'square', quando: i * .06 })); },
    pegar() { tom({ f: 700, f2: 1100, dur: .07, vol: .05, tipo: 'triangle' }); },
    golpe() { ruido({ dur: .08, vol: .2, freq: 900, tipo: 'lowpass' }); tom({ f: 140, f2: 70, dur: .1, vol: .15 }); },
    espada() { ruido({ dur: .1, vol: .1, freq: 4000, q: .4 }); },
    arco() { tom({ f: 400, f2: 900, dur: .1, vol: .06, tipo: 'triangle' }); },
    dano() { tom({ f: 300, f2: 120, dur: .2, vol: .14, tipo: 'square' }); },
    nivel() { [523, 659, 784, 1047, 1319].forEach((f, i) => tom({ f, dur: .22, vol: .07, tipo: 'triangle', quando: i * .08 })); },
    comer() { for (let i = 0; i < 3; i++) ruido({ dur: .05, vol: .1, freq: 1200, quando: i * .09 }); },
    beber() { for (let i = 0; i < 3; i++) tom({ f: 300 + i * 60, f2: 500, dur: .07, vol: .05, quando: i * .1 }); },
    porta() { tom({ f: 120, f2: 80, dur: .3, vol: .12, tipo: 'triangle' }); ruido({ dur: .2, vol: .06, freq: 400 }); },
    jutsu() { ruido({ dur: .4, vol: .15, freq: 1000, q: .3 }); [392, 523, 784].forEach((f, i) => tom({ f, dur: .2, vol: .07, tipo: 'square', quando: .1 + i * .07 })); },
    fogo() { ruido({ dur: .35, vol: .08, freq: 600, q: .3 }); },
    martelo() { tom({ f: 260, f2: 200, dur: .06, vol: .12, tipo: 'square' }); },
    morte() { [392, 330, 262, 196].forEach((f, i) => tom({ f, dur: .35, vol: .08, tipo: 'triangle', quando: i * .22 })); },
  };

  // bipes da fala: tom muda com a emoção
  const TOM_VOZ = { chorando: 360, apaixonado: 720, susto: 820, tonto: 430, nerd: 610, serio: 400, humano: 250, gargalhada: 680 };
  function voz(expr) {
    const base = TOM_VOZ[expr] || 560;
    tom({ f: base * (.85 + Math.random() * .35), dur: .055, vol: .045, tipo: expr === 'humano' ? 'triangle' : 'square', vib: expr === 'chorando' ? 30 : 0 });
  }

  function agendar() {
    if (!ctx || modo === 'nada') return;
    if (proxima < ctx.currentTime) proxima = ctx.currentTime + .05;
    while (proxima < ctx.currentTime + .25) {
      const quando = proxima - ctx.currentTime;
      const lista = modo === 'masmorra' ? ACORDES_MENOR : ACORDES;
      const acorde = lista[Math.floor(passo / 8) % 4], i = passo % 8;
      if (i === 0) acorde.forEach(n => tom({ f: midi(n), dur: COLCHEIA * 8.6, vol: .03, ataque: .7, destino: musica, quando }));
      const esparso = modo === 'amanhecer' || modo === 'inverno' || modo === 'masmorra';
      if (modo !== 'noite' && modo !== 'noitejogo' && (!esparso || i % 2 === 0)) {
        const nota = acorde[ARPEJO[i]] + 12 + (i === 6 && passo % 32 > 16 ? 12 : 0);
        tom({ f: midi(nota), dur: .45, vol: .028, tipo: 'triangle', destino: musicaBus, quando });
      }
      if ((modo === 'doido' || modo === 'titulo') && [0, 3, 4, 6].includes(i))
        tom({ f: midi(acorde[0] - 12), dur: .2, vol: .07, tipo: 'triangle', destino: musica, quando });
      proxima += COLCHEIA; passo++;
    }
  }

  function trilha(novo) {
    modo = novo;
    if (!ctx) return;
    const alvo = novo === 'nada' ? 0 : novo === 'noite' || novo === 'noitejogo' ? .55 : novo === 'masmorra' ? .8 : 1;
    musica.gain.setTargetAtTime(alvo, ctx.currentTime, 1.2);
  }

  function alternar(on) {
    ligado = on;
    if (ctx) mestre.gain.setTargetAtTime(on ? .7 : 0, ctx.currentTime, .05);
  }

  return {
    iniciar, trilha, alternar,
    get ligado() { return ligado; },
    efeito(n) { if (ctx && ligado && EFEITOS[n]) EFEITOS[n](); },
    voz(e) { if (ctx && ligado) voz(e); },
  };
})();
