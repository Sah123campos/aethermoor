#!/usr/bin/env node
// Servidor de Aethermoor: entrega os arquivos do jogo e cuida das salas
// cooperativas por WebSocket (sem dependências: só o Node).
//
//   node servidor/servidor.js        (porta 8080; mude com PORT=3000)
//
// Abra http://localhost:8080 e mande para os amigos o seu endereço na rede
// (ex.: http://192.168.0.10:8080) junto com o código da sala.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const PASTA_SALAS = path.join(__dirname, 'salas');
const PORTA = Number(process.env.PORT) || 8080;
const MAX_JOGADORES = 8;
const MAX_MSG = 16 * 1024 * 1024;
const ia = require('./ia');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };

fs.mkdirSync(PASTA_SALAS, { recursive: true });

// ---------- IA do Doidobot ----------
// Jogo aberto direto do arquivo manda Origin "null"; do próprio servidor, o mesmo endereço.
function origemOk(req) {
  const o = req.headers.origin;
  return !o || o === 'null' || o === `http://${req.headers.host}` || o === `https://${req.headers.host}`;
}
function apiDoidobot(req, res) {
  const cab = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (req.headers.origin) Object.assign(cab, { 'Access-Control-Allow-Origin': req.headers.origin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
  if (!origemOk(req)) { res.writeHead(403, cab); return res.end('{"erro":"origem"}'); }
  if (req.method === 'OPTIONS') { res.writeHead(204, cab); return res.end(); }
  if (req.method === 'GET') return ia.status().then(s => { res.writeHead(200, cab); res.end(JSON.stringify(s)); });
  if (req.method !== 'POST') { res.writeHead(405, cab); return res.end(); }
  let corpo = '';
  req.on('data', d => { corpo += d; if (corpo.length > 64 * 1024) req.destroy(); });
  req.on('end', async () => {
    let entrada;
    try { entrada = JSON.parse(corpo); } catch { res.writeHead(400, cab); return res.end('{"erro":"json"}'); }
    const r = await ia.responder(entrada, req.socket.remoteAddress);
    res.writeHead(200, cab); res.end(JSON.stringify(r));
  });
}

// ---------- arquivos do jogo ----------
const servidor = http.createServer((req, res) => {
  if (req.url.split('?')[0] === '/api/doidobot') return apiDoidobot(req, res);
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (url === '/') url = '/index.html';
  const arq = path.normalize(path.join(RAIZ, url));
  // nada fora do jogo nem dentro da pasta do servidor (onde ficam as salas salvas)
  if (!arq.startsWith(RAIZ + path.sep) || arq.startsWith(path.join(RAIZ, 'servidor') + path.sep) || path.basename(arq).startsWith('.')) { res.writeHead(403); return res.end(); }
  fs.readFile(arq, (erro, dados) => {
    if (erro) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(dados);
  });
});

// ---------- WebSocket (RFC 6455, o básico) ----------
let proximoId = 0;
servidor.on('upgrade', (req, socket) => {
  if (req.url.split('?')[0] !== '/ws' || !req.headers['sec-websocket-key']) return socket.destroy();
  const aceite = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${aceite}\r\n\r\n`);
  socket.setNoDelay(true);
  const c = { id: ++proximoId, socket, buf: Buffer.alloc(0), partes: [], sala: null, nome: 'Viajante' };
  socket.on('data', d => { c.buf = Buffer.concat([c.buf, d]); if (c.buf.length > MAX_MSG + 16) return socket.destroy(); lerQuadros(c); });
  socket.on('close', () => sair(c));
  socket.on('error', () => sair(c));
});

function lerQuadros(c) {
  while (c.buf.length >= 2) {
    const b0 = c.buf[0], b1 = c.buf[1], fin = b0 & 0x80, op = b0 & 0x0f, mascara = b1 & 0x80 ? 4 : 0;
    let tam = b1 & 0x7f, off = 2;
    if (tam === 126) { if (c.buf.length < 4) return; tam = c.buf.readUInt16BE(2); off = 4; }
    else if (tam === 127) { if (c.buf.length < 10) return; tam = Number(c.buf.readBigUInt64BE(2)); off = 10; }
    if (tam > MAX_MSG) return c.socket.destroy();
    if (c.buf.length < off + mascara + tam) return;
    let dados = Buffer.from(c.buf.subarray(off + mascara, off + mascara + tam));
    if (mascara) { const m = c.buf.subarray(off, off + 4); for (let i = 0; i < dados.length; i++) dados[i] ^= m[i & 3]; }
    c.buf = c.buf.subarray(off + mascara + tam);
    if (op === 8) { c.socket.end(); return; }
    if (op === 9) { quadro(c, dados, 10); continue; }
    if (op === 0 || op === 1) {
      c.partes.push(dados);
      if (fin) {
        const texto = Buffer.concat(c.partes).toString('utf8');
        c.partes = [];
        let msg;
        try { msg = JSON.parse(texto); } catch { continue; }
        try { tratar(c, msg); } catch (e) { console.error('Erro tratando mensagem:', e.message); }
      }
    }
  }
}
function quadro(c, dados, op = 1) {
  if (c.socket.destroyed) return;
  const n = dados.length;
  let cab;
  if (n < 126) cab = Buffer.from([0x80 | op, n]);
  else if (n < 65536) { cab = Buffer.alloc(4); cab[0] = 0x80 | op; cab[1] = 126; cab.writeUInt16BE(n, 2); }
  else { cab = Buffer.alloc(10); cab[0] = 0x80 | op; cab[1] = 127; cab.writeBigUInt64BE(BigInt(n), 2); }
  c.socket.write(Buffer.concat([cab, dados]));
}
const enviar = (c, obj) => quadro(c, Buffer.from(JSON.stringify(obj)));
const paraTodos = (sala, obj, exceto) => { const d = Buffer.from(JSON.stringify(obj)); for (const o of sala.clientes.values()) if (o !== exceto) quadro(o, d); };

// ---------- salas ----------
const salas = new Map();
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function novoCodigo() {
  let k;
  do k = Array.from({ length: 5 }, () => LETRAS[crypto.randomInt(LETRAS.length)]).join(''); while (salas.has(k) || fs.existsSync(arqSala(k)));
  return k;
}
const arqSala = k => path.join(PASTA_SALAS, k.replace(/[^A-Z0-9]/g, '') + '.json');
function salvarDisco(sala) {
  fs.writeFile(arqSala(sala.codigo), JSON.stringify({ codigo: sala.codigo, config: sala.config, ouro: sala.ouro, save: sala.save, atualizado: Date.now() }), e => { if (e) console.error('Não salvei a sala', sala.codigo, e.message); });
}
function lerDisco(k) {
  try { const s = JSON.parse(fs.readFileSync(arqSala(k), 'utf8')); return { codigo: s.codigo, config: s.config, ouro: s.ouro || 0, save: s.save, clientes: new Map(), anfitriao: null, dormindo: new Set() }; }
  catch { return null; }
}
const jogadores = sala => [...sala.clientes.values()].map(o => ({ id: o.id, nome: o.nome, anfitriao: o.id === sala.anfitriao }));

function tratar(c, m) {
  const sala = c.sala;
  switch (m.t) {
    case 'criar': {
      if (sala) return;
      const s = { codigo: novoCodigo(), anfitriao: c.id, clientes: new Map([[c.id, c]]), config: m.config || {}, ouro: Number(m.ouro) || 0, save: m.save || null, dormindo: new Set() };
      salas.set(s.codigo, s); c.sala = s; c.nome = String(m.nome || 'Viajante').slice(0, 14);
      enviar(c, { t: 'sala', codigo: s.codigo, id: c.id, anfitriao: true, jogadores: jogadores(s), ouro: s.ouro, config: s.config });
      if (s.save) salvarDisco(s);
      console.log(`Sala ${s.codigo} criada por ${c.nome}`);
      break;
    }
    case 'entrar': {
      if (sala) return;
      const k = String(m.codigo || '').toUpperCase().trim();
      let s = salas.get(k);
      if (!s) { s = lerDisco(k); if (s) salas.set(k, s); }
      if (!s) return enviar(c, { t: 'erro', msg: 'Sala não encontrada. Confira o código.' });
      if (s.clientes.size >= MAX_JOGADORES) return enviar(c, { t: 'erro', msg: 'A sala está cheia (8 jogadores).' });
      c.sala = s; c.nome = String(m.nome || 'Viajante').slice(0, 14);
      s.clientes.set(c.id, c);
      clearTimeout(s.limpeza);
      const souAnfitriao = !s.anfitriao || !s.clientes.has(s.anfitriao);
      if (souAnfitriao) s.anfitriao = c.id;
      enviar(c, { t: 'sala', codigo: s.codigo, id: c.id, anfitriao: souAnfitriao, jogadores: jogadores(s), ouro: s.ouro, config: s.config });
      if (souAnfitriao) { if (s.save) enviar(c, { t: 'estado', dados: s.save, retomar: true }); }
      else enviar(s.clientes.get(s.anfitriao), { t: 'pedeEstado', para: c.id });
      paraTodos(s, { t: 'entrou', id: c.id, nome: c.nome }, c);
      console.log(`${c.nome} entrou na sala ${s.codigo}`);
      break;
    }
    case 'estado':
      if (!sala || c.id !== sala.anfitriao) return;
      sala.save = m.dados;
      if (m.todos) paraTodos(sala, { t: 'estado', dados: m.dados, novoDia: !!m.novoDia }, c);
      else if (sala.clientes.has(m.para)) enviar(sala.clientes.get(m.para), { t: 'estado', dados: m.dados });
      break;
    case 'salvar':
      if (sala && c.id === sala.anfitriao && typeof m.dados === 'string') { sala.save = m.dados; salvarDisco(sala); }
      break;
    case 'pos': case 'tiles': case 'missao': case 'construcao': case 'tempo':
      if (sala) paraTodos(sala, { ...m, id: c.id }, c);
      break;
    case 'chat':
      if (sala) paraTodos(sala, { t: 'chat', nome: c.nome, texto: String(m.texto || '').slice(0, 200) });
      break;
    case 'ouro':
      if (!sala) return;
      sala.ouro = Math.max(0, sala.ouro + (Number(m.delta) || 0));
      paraTodos(sala, { t: 'ouro', total: sala.ouro });
      break;
    case 'dormir': case 'acordar': {
      if (!sala) return;
      if (m.t === 'dormir') sala.dormindo.add(c.id); else sala.dormindo.delete(c.id);
      if (sala.dormindo.size >= sala.clientes.size) {
        sala.dormindo.clear();
        enviar(sala.clientes.get(sala.anfitriao), { t: 'novoDia' });
      } else paraTodos(sala, { t: 'dormindo', n: sala.dormindo.size, total: sala.clientes.size });
      break;
    }
  }
}

function sair(c) {
  const s = c.sala;
  if (!s) return;
  c.sala = null;
  s.clientes.delete(c.id); s.dormindo.delete(c.id);
  paraTodos(s, { t: 'saiu', id: c.id, nome: c.nome });
  if (s.anfitriao === c.id) {
    const novo = s.clientes.values().next().value;
    s.anfitriao = novo ? novo.id : null;
    if (novo) enviar(novo, { t: 'anfitriao' });
  }
  if (!s.clientes.size) {
    if (s.save) salvarDisco(s);
    s.limpeza = setTimeout(() => salas.delete(s.codigo), 10 * 60 * 1000);
  }
  console.log(`${c.nome} saiu da sala ${s.codigo}`);
}

servidor.listen(PORTA, () => {
  const ips = Object.values(require('os').networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log(`Aethermoor rodando em http://localhost:${PORTA}`);
  ia.status().then(st => console.log(st.ativo ? `IA do Doidobot: ${st.provedor} (${st.modelo})` : `IA do Doidobot desligada: ${st.motivo}`));
  ips.forEach(ip => console.log(`Na sua rede: http://${ip}:${PORTA}`));
});
