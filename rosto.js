// Retrato grande do Doidobot (SVG) para o diálogo: cabeça amarela flutuante,
// óculos escuros com olhos de LED e o "ferro no ouvido". Também tem o raro
// modo humano: cabelo cacheado, pele morena e jaqueta de couro.
'use strict';

const Rosto = (() => {
  const OL = { x: 64, y: 102 }, OR = { x: 136, y: 102 };   // centro das lentes
  const BRANCO = '#fffbe6';

  const coracao = (cx, cy, s) =>
    `M${cx} ${cy + s * .9} C${cx - s * 1.6} ${cy - s * .2} ${cx - s * .8} ${cy - s * 1.3} ${cx} ${cy - s * .45} ` +
    `C${cx + s * .8} ${cy - s * 1.3} ${cx + s * 1.6} ${cy - s * .2} ${cx} ${cy + s * .9}Z`;
  const estrela = (cx, cy, R, r) => {
    let d = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 - Math.PI / 2, k = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * k).toFixed(1) + ' ' + (cy + Math.sin(a) * k).toFixed(1);
    }
    return d + 'Z';
  };
  const espiral = (cx, cy) => {
    let d = '';
    for (let a = 0; a <= Math.PI * 4.2; a += .25) {
      const k = 1.5 + a * 1.05;
      d += (a ? 'L' : 'M') + (cx + Math.cos(a) * k).toFixed(1) + ' ' + (cy + Math.sin(a) * k).toFixed(1);
    }
    return d;
  };
  const arco = (o, sobe = true) => `M${o.x - 14} ${o.y + 6} Q${o.x} ${o.y + (sobe ? -14 : 18)} ${o.x + 14} ${o.y + 6}`;
  const traco = (d, w = 6, cor = BRANCO) => `<path d="${d}" stroke="${cor}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

  const olhoNormal = (o, rx = 12, ry = 15, pupila = 6) =>
    `<g class="pisca"><ellipse cx="${o.x}" cy="${o.y}" rx="${rx}" ry="${ry}" fill="${BRANCO}"/>` +
    `<circle cx="${o.x + 2}" cy="${o.y + 2}" r="${pupila}" fill="#15151f"/><circle cx="${o.x + 4}" cy="${o.y - 3}" r="2.2" fill="#fff"/></g>`;

  const OLHOS = {
    normal: olhoNormal(OL) + olhoNormal(OR),
    arregalado: [OL, OR].map(o => `<ellipse cx="${o.x}" cy="${o.y}" rx="17" ry="19" fill="${BRANCO}"/><circle cx="${o.x}" cy="${o.y}" r="3.5" fill="#15151f"/>`).join(''),
    coracao: [OL, OR].map(o => `<path class="pulsa" d="${coracao(o.x, o.y, 13)}" fill="#ff4d8d" stroke="#ffd0e0" stroke-width="2"/>`).join(''),
    espiral: [OL, OR].map(o => `<path class="gira" d="${espiral(o.x, o.y)}" stroke="${BRANCO}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join(''),
    feliz: traco(arco(OL)) + traco(arco(OR)),
    choro: traco(arco(OL)) + traco(arco(OR)),
    apertado: traco(`M54 92 L74 102 L54 112`) + traco(`M146 92 L126 102 L146 112`),
    brilho: [OL, OR].map(o => `<path class="cintila" d="${estrela(o.x, o.y, 15, 5)}" fill="#fff3a0"/>`).join(''),
    determinado: [OL, OR].map(o => `<ellipse cx="${o.x}" cy="${o.y + 4}" rx="13" ry="11" fill="${BRANCO}"/><circle cx="${o.x + (o === OL ? 3 : -3)}" cy="${o.y + 6}" r="5" fill="#15151f"/>`).join('') +
      `<path d="M40 86 L86 101 L86 82 L40 82Z" fill="#1a1a2a"/><path d="M160 86 L114 101 L114 82 L160 82Z" fill="#1a1a2a"/>`,
    piscada: olhoNormal(OL) + traco(arco(OR)),
    confuso: olhoNormal(OL, 15, 18, 6) + olhoNormal({ x: OR.x, y: OR.y - 4 }, 8, 9, 4),
    nerd: '',
  };

  const M = '#5a3a00', BOCA = '#5a1a1a';
  const BOCAS = {
    sorriso: traco('M80 150 Q100 168 120 150', 6, M),
    aberta: `<path d="M76 146 Q100 182 124 146Z" fill="${BOCA}" stroke="${M}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="163" rx="10" ry="5" fill="#ff7a8a"/>`,
    o: `<ellipse cx="100" cy="156" rx="9" ry="11" fill="${BOCA}" stroke="${M}" stroke-width="3"/>`,
    onda: `<g class="pisca">${traco('M76 156 q6 -7 12 0 t12 0 t12 0 t12 0', 5, M)}</g>`,
    reta: traco('M86 156 H114', 6, M),
    risada: `<path d="M72 144 H128 Q100 188 72 144Z" fill="${BOCA}" stroke="${M}" stroke-width="3" stroke-linejoin="round"/><path d="M78 145 H122 L119 152 H81Z" fill="#fff"/><ellipse cx="100" cy="171" rx="12" ry="6" fill="#ff7a8a"/>`,
    dentinhos: traco('M80 148 Q100 166 120 148', 6, M) + `<rect x="92" y="156" width="7" height="10" rx="1" fill="#fff" stroke="${M}" stroke-width="2"/><rect x="101" y="156" width="7" height="10" rx="1" fill="#fff" stroke="${M}" stroke-width="2"/>`,
    torta: traco('M82 160 Q96 150 120 152', 6, M),
  };

  const mao = (x, y) => `<circle cx="${x}" cy="${y}" r="12" fill="#ffd23f" stroke="#7a5600" stroke-width="3"/>`;
  const EXTRAS = {
    blush: `<ellipse cx="52" cy="144" rx="13" ry="7" fill="#ff7a9a" opacity=".55"/><ellipse cx="148" cy="144" rx="13" ry="7" fill="#ff7a9a" opacity=".55"/>`,
    sardas: [[46, 138], [54, 144], [44, 148], [154, 138], [146, 144], [156, 148]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#b5651d"/>`).join(''),
    lagrimas: [52, 76, 124, 148].map(x => `<path class="escorre" d="M${x} 118 V200" stroke="#7cc7ff" stroke-width="8" stroke-dasharray="10 6" stroke-linecap="round" opacity=".9"/>`).join('') +
      `<circle class="sobe" cx="30" cy="112" r="5" fill="#9fdcff"/><circle class="sobe" cx="170" cy="112" r="5" fill="#9fdcff"/><circle class="sobe" cx="24" cy="132" r="4" fill="#9fdcff"/>`,
    suor: `<path d="M168 46 Q177 62 168 69 Q159 62 168 46Z" fill="#9fd8ff" stroke="#3a7ab0" stroke-width="2"/>`,
    estrelinhas: `<g class="orbita">${[[64, 36], [136, 36], [100, 24]].map(([x, y]) => `<path d="${estrela(x, y, 9, 3.5)}" fill="#fff3a0" stroke="#b8860b" stroke-width="1.5"/>`).join('')}</g>`,
    brilhos: [[28, 58], [174, 56], [166, 176]].map(([x, y]) => `<path class="cintila" d="${estrela(x, y, 11, 3)}" fill="#fff3a0"/>`).join(''),
    coracoes: [[34, 72], [168, 76], [150, 34]].map(([x, y]) => `<path class="sobe" d="${coracao(x, y, 7)}" fill="#ff4d8d"/>`).join(''),
    'mao-oi': `<g class="acena">${mao(26, 172)}<rect x="17" y="146" width="7" height="18" rx="3.5" fill="#ffd23f" stroke="#7a5600" stroke-width="2.5"/><rect x="26" y="142" width="7" height="20" rx="3.5" fill="#ffd23f" stroke="#7a5600" stroke-width="2.5"/></g>`,
    dedo: `<g class="materializa"><rect x="171" y="112" width="10" height="30" rx="5" fill="#ffd23f" stroke="#7a5600" stroke-width="3"/>${mao(178, 150)}</g>`,
    reflexo: '',
    'oculos-grau': `<g class="materializa">` +
      [OL, OR].map(o => `<circle cx="${o.x + 2}" cy="${o.y + 2}" r="25" fill="#e6f6ff" fill-opacity=".45" stroke="#4a2c14" stroke-width="7"/>` +
        `<circle cx="${o.x + 2}" cy="${o.y + 4}" r="8" fill="#1d1d2b"/><circle cx="${o.x + 5}" cy="${o.y}" r="2.6" fill="#fff"/>`).join('') +
      traco('M91 100 Q100 91 109 100', 6, '#4a2c14') + `</g>`,
  };

  const ROBO = `<g data-modo="robo">
    <line x1="100" y1="48" x2="100" y2="20" stroke="#4a4a5a" stroke-width="6" stroke-linecap="round"/>
    <circle class="bulbo" cx="100" cy="15" r="9" fill="#ff4d6d" stroke="#7a1a30" stroke-width="3"/>
    <rect x="22" y="96" width="16" height="34" rx="6" fill="#e0a800" stroke="#7a5600" stroke-width="4"/>
    <rect x="160" y="91" width="20" height="44" rx="5" fill="url(#gMetal)" stroke="#4d5363" stroke-width="4"/>
    <circle cx="170" cy="102" r="3" fill="#4d5363"/><circle cx="170" cy="124" r="3" fill="#4d5363"/>
    <circle cx="100" cy="112" r="68" fill="url(#gCabeca)" stroke="#7a5600" stroke-width="5"/>
    <ellipse cx="70" cy="64" rx="18" ry="8" fill="#fff8c8" opacity=".55" transform="rotate(-28 70 64)"/>
    ${Object.entries(EXTRAS).filter(([k]) => ['blush', 'sardas'].includes(k)).map(([k, v]) => `<g data-extra="${k}">${v}</g>`).join('')}
    <g data-oculos="escuro">
      ${traco('M30 92 H170', 7, '#15151f')}
      <rect x="34" y="78" width="60" height="48" rx="15" fill="url(#gLente)" stroke="#000" stroke-width="3"/>
      <rect x="106" y="78" width="60" height="48" rx="15" fill="url(#gLente)" stroke="#000" stroke-width="3"/>
      <rect x="92" y="89" width="16" height="7" fill="#15151f"/>
      <g clip-path="url(#cLentes)">
        <path d="M42 124 L62 80 L70 80 L50 124Z M114 124 L134 80 L142 80 L122 124Z" fill="#fff" opacity=".09"/>
        <g data-extra="reflexo"><path class="reflexo" d="M40 130 L58 74 L72 74 L54 130Z" fill="#fff" opacity=".5"/></g>
        ${Object.entries(OLHOS).map(([k, v]) => `<g data-olhos="${k}">${v}</g>`).join('')}
      </g>
    </g>
    ${Object.entries(BOCAS).map(([k, v]) => `<g data-boca="${k}">${v}</g>`).join('')}
    ${Object.entries(EXTRAS).filter(([k]) => !['blush', 'sardas', 'reflexo'].includes(k)).map(([k, v]) => `<g data-extra="${k}">${v}</g>`).join('')}
  </g>`;

  // cachos do cabelo (sempre os mesmos)
  const cachos = (() => {
    const s = sorteador(42);
    let out = '';
    for (let y = 30; y <= 80; y += 7) {
      const meia = Math.sqrt(Math.max(0, 1 - Math.pow((y - 70) / 44, 2))) * 58;
      for (let x = 100 - meia; x <= 100 + meia; x += 9) {
        if (y > 66 && Math.abs(x - 100) < 34) continue; // a testa aparece
        const cx = x + s() * 5 - 2.5, cy = y + s() * 4 - 2, r = 8 + s() * 3;
        out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#17110d"/>` +
          `<path d="M${(cx - r * .5).toFixed(1)} ${(cy - r * .2).toFixed(1)} q${(r * .5).toFixed(1)} ${(-r * .6).toFixed(1)} ${r.toFixed(1)} 0" stroke="#3a2a20" stroke-width="2" fill="none"/>`;
      }
    }
    // cachinhos menores na linha da testa, para não ficar reta
    for (let x = 66; x <= 134; x += 7) {
      const cx = x + s() * 3, cy = 72 + s() * 4 - Math.abs(x - 100) * .05, r = 4.5 + s() * 1.5;
      out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="#17110d"/>`;
    }
    return out;
  })();

  const HUMANO = `<g data-modo="humano">
    <path d="M36 200 L58 166 L100 186 L142 166 L164 200Z" fill="#121212"/>
    <path d="M58 166 L82 200 L100 186Z" fill="#2a2a2a"/><path d="M142 166 L118 200 L100 186Z" fill="#1f1f1f"/>
    <rect x="86" y="156" width="28" height="30" fill="#a8703f"/>
    <ellipse cx="40" cy="118" rx="10" ry="15" fill="#b9804f"/><ellipse cx="160" cy="118" rx="10" ry="15" fill="#b9804f"/>
    <ellipse cx="100" cy="116" rx="60" ry="66" fill="url(#gPele)"/>
    <path d="M42 100 Q40 72 58 56 L62 100Z" fill="#1d1510" opacity=".9"/><path d="M158 100 Q160 72 142 56 L138 100Z" fill="#1d1510" opacity=".9"/>
    ${cachos}
    ${traco('M62 96 Q76 88 90 96', 6, '#1a120c')}${traco('M110 96 Q124 88 138 96', 6, '#1a120c')}
    <ellipse cx="76" cy="112" rx="11" ry="7" fill="#fff"/><circle cx="77" cy="112" r="5.5" fill="#2a1a10"/><circle cx="79" cy="110" r="1.8" fill="#fff"/>
    <ellipse cx="124" cy="112" rx="11" ry="7" fill="#fff"/><circle cx="125" cy="112" r="5.5" fill="#2a1a10"/><circle cx="127" cy="110" r="1.8" fill="#fff"/>
    ${traco('M100 118 Q93 135 99 139 Q106 140 108 135', 3.5, '#8a5232')}
    ${traco('M84 154 Q100 162 116 151', 4.5, '#6b2f22')}
  </g>`;

  function criar(alvo) {
    alvo.innerHTML = `<svg class="rosto flutua" viewBox="0 0 200 200" aria-hidden="true"><g class="anima">${ROBO}${HUMANO}</g></svg>`;
    const svg = alvo.firstElementChild;
    const robo = svg.querySelector('[data-modo="robo"]'), humano = svg.querySelector('[data-modo="humano"]');
    const escuros = svg.querySelector('[data-oculos="escuro"]');
    let atual = null;
    function expressao(nome) {
      if (nome === atual) return;
      atual = nome;
      const e = EXPR[nome] || EXPR.normal;
      robo.style.display = e.humano ? 'none' : '';
      humano.style.display = e.humano ? '' : 'none';
      if (!e.humano) {
        escuros.style.display = e.olhos === 'nerd' ? 'none' : '';
        svg.querySelectorAll('[data-olhos]').forEach(el => { el.style.display = el.dataset.olhos === e.olhos ? '' : 'none'; });
        svg.querySelectorAll('[data-boca]').forEach(el => { el.style.display = el.dataset.boca === e.boca ? '' : 'none'; });
        svg.querySelectorAll('[data-extra]').forEach(el => { el.style.display = e.extras.includes(el.dataset.extra) ? '' : 'none'; });
      }
      svg.setAttribute('class', 'rosto ' + e.anim);
    }
    const glitch = on => svg.classList.toggle('glitch', on);
    expressao('normal');
    return { expressao, glitch };
  }

  return { criar };
})();
