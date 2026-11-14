#!/usr/bin/env node
// Sammelserver fuer die anonyme Lernstatistik des DB-Trainers.
// Eine Datei, keine Abhaengigkeiten (Node.js 18+).
//
//   TOKEN=geheimes-passwort DATA_FILE=./events.jsonl FEEDBACK_FILE=./feedback.jsonl PORT=8787 node server/collector.mjs
//
// POST /events   nimmt Ereignisse der Lernenden an (ohne Anmeldung)
// GET  /events   liefert alle Ereignisse an das Dashboard (nur mit "Authorization: Bearer <TOKEN>")
// POST /feedback  nimmt einen Feedbackbogen an (ohne Anmeldung, frei formulierter Text, keine Kennung)
// GET  /feedback  liefert alle Feedbackboegen (nur mit Token)
// GET  /health   Lebenszeichen
//
// Datenschutz: Es werden nur die geprueften Felder gespeichert (siehe validate), keine
// IP-Adressen, keine Header, keine Logs. Betrieb hinter HTTPS (z. B. nginx, Caddy).

import { createServer } from 'node:http';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';

const ID = /^[\w:.-]{1,80}$/;
const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/** Prueft ein Ereignis und gibt nur bekannte Felder zurueck (sonst null). */
export function validate(e) {
  if (!e || typeof e !== 'object') return null;
  if (!num(e.t, 1_600_000_000, 4_000_000_000) || typeof e.u !== 'string' || !/^[0-9a-f]{1,32}$|^x$/.test(e.u)) return null;
  const base = { t: Math.floor(e.t), u: e.u };
  if (e.k === 'i') {
    if (!ID.test(e.i ?? '') || !ID.test(e.tp ?? '') || !ID.test(e.ch ?? '')) return null;
    if (!(e.ok === 0 || e.ok === 1) || !num(e.s, 0, 3600) || !num(e.a, 1, 1000) || !num(e.h, 0, 50)) return null;
    if (!['u', 'l', 'k'].includes(e.src)) return null;
    const out = { ...base, k: 'i', i: e.i, tp: e.tp, ch: e.ch, ok: e.ok, s: Math.round(e.s), a: e.a, h: e.h, src: e.src };
    if (e.o !== undefined) {
      if (!Array.isArray(e.o) || e.o.length > 10 || !e.o.every((x) => Number.isInteger(x) && x >= 0 && x < 20)) return null;
      out.o = e.o;
    }
    if (e.lv !== undefined) {
      if (!num(e.lv, 1, 3)) return null;
      out.lv = e.lv;
    }
    return out;
  }
  if (e.k === 'e') {
    if (!num(e.p, 0, 10000) || !num(e.x, 1, 10000) || !num(e.m, 1, 600)) return null;
    if (!Array.isArray(e.ch) || e.ch.length > 30 || !e.ch.every((c) => ID.test(c))) return null;
    if (!e.kc || typeof e.kc !== 'object') return null;
    const kc = {};
    for (const [c, v] of Object.entries(e.kc)) {
      if (!ID.test(c) || !Array.isArray(v) || v.length !== 2 || !num(v[0], 0, 10000) || !num(v[1], 0, 10000)) return null;
      kc[c] = v;
    }
    return { ...base, k: 'e', p: e.p, x: e.x, m: e.m, ch: e.ch, kc };
  }
  return null;
}

const RATING_KEYS = ['verstaendlich', 'rueckmeldung', 'bedienung', 'nutzen'];
const text = (v, max) => (typeof v === 'string' && v.length <= max ? v.trim() : null);

/** Prueft einen Feedbackbogen; speichert nur bekannte Felder. Der Zeitpunkt kommt vom Server, es gibt keine Kennung. */
export function validateFeedback(f) {
  if (!f || typeof f !== 'object') return null;
  const ratings = {};
  for (const [k, v] of Object.entries(f.ratings ?? {})) {
    if (!RATING_KEYS.includes(k) || !Number.isInteger(v) || v < 1 || v > 5) return null;
    ratings[k] = v;
  }
  const area = text(f.area ?? '', 60);
  const problem = text(f.problem ?? '', 4000);
  const wish = text(f.wish ?? '', 4000);
  const liked = text(f.liked ?? '', 4000);
  const device = text(f.device ?? '', 30);
  const version = text(f.version ?? '', 20);
  if ([area, problem, wish, liked, device, version].includes(null)) return null;
  if (!Object.keys(ratings).length && !problem && !wish && !liked) return null;
  return { t: Math.floor(Date.now() / 1000), ratings, area, problem, wish, liked, device, version };
}

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function createCollector({ token, file, feedbackFile = file.replace(/(\.jsonl)?$/, '.feedback.jsonl'), allowOrigin = '*' }) {
  if (!token || token.length < 8) throw new Error('TOKEN fehlt oder ist zu kurz (mindestens 8 Zeichen).');
  const hits = new Map(); // IP -> Anzahl, nur im Arbeitsspeicher, wird stuendlich geleert
  const reset = setInterval(() => hits.clear(), 3600_000);
  reset.unref();

  const server = createServer((req, res) => {
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-store',
    };
    const send = (code, body) => {
      res.writeHead(code, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    const url = new URL(req.url ?? '/', 'http://x');

    if (req.method === 'OPTIONS') return send(204, {});
    if (url.pathname === '/health') return send(200, { ok: true });

    if (url.pathname === '/events' && req.method === 'GET') {
      const auth = req.headers.authorization ?? '';
      if (!auth.startsWith('Bearer ') || !safeEqual(auth.slice(7), token)) return send(401, { error: 'unauthorized' });
      const since = Number(url.searchParams.get('since') ?? 0) || 0;
      const lines = existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
      const events = [];
      for (const l of lines) {
        try {
          const e = JSON.parse(l);
          if (e.t >= since) events.push(e);
        } catch {
          /* defekte Zeile ueberspringen */
        }
      }
      return send(200, { events });
    }

    if (url.pathname === '/feedback' && req.method === 'GET') {
      const auth = req.headers.authorization ?? '';
      if (!auth.startsWith('Bearer ') || !safeEqual(auth.slice(7), token)) return send(401, { error: 'unauthorized' });
      const lines = existsSync(feedbackFile) ? readFileSync(feedbackFile, 'utf8').split('\n').filter(Boolean) : [];
      const feedback = [];
      for (const l of lines) {
        try {
          feedback.push(JSON.parse(l));
        } catch {
          /* defekte Zeile ueberspringen */
        }
      }
      return send(200, { feedback });
    }

    if (url.pathname === '/feedback' && req.method === 'POST') {
      const ip = req.socket.remoteAddress ?? '';
      const n = (hits.get(ip) ?? 0) + 1;
      hits.set(ip, n);
      if (n > 600) return send(429, { error: 'zu viele Anfragen' });
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > 32 * 1024) {
          send(413, { error: 'zu gross' });
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        if (res.writableEnded) return;
        try {
          const f = validateFeedback(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          if (!f) return send(400, { error: 'ungueltig' });
          appendFileSync(feedbackFile, JSON.stringify(f) + '\n');
          send(200, { ok: true });
        } catch {
          send(400, { error: 'ungueltig' });
        }
      });
      return;
    }

    if (url.pathname === '/events' && req.method === 'POST') {
      const ip = req.socket.remoteAddress ?? '';
      const n = (hits.get(ip) ?? 0) + 1;
      hits.set(ip, n);
      if (n > 600) return send(429, { error: 'zu viele Anfragen' });
      let size = 0;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > 64 * 1024) {
          send(413, { error: 'zu gross' });
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        if (res.writableEnded) return;
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const list = Array.isArray(body.events) ? body.events.slice(0, 100) : [];
          const ok = list.map(validate).filter(Boolean);
          if (ok.length) appendFileSync(file, ok.map((e) => JSON.stringify(e)).join('\n') + '\n');
          send(200, { accepted: ok.length, rejected: list.length - ok.length });
        } catch {
          send(400, { error: 'ungueltig' });
        }
      });
      return;
    }
    send(404, { error: 'nicht gefunden' });
  });
  server.on('close', () => clearInterval(reset));
  return server;
}

// Direktstart
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8787);
  const server = createCollector({
    token: process.env.TOKEN ?? '',
    file: process.env.DATA_FILE ?? './events.jsonl',
    feedbackFile: process.env.FEEDBACK_FILE ?? './feedback.jsonl',
    allowOrigin: process.env.ALLOW_ORIGIN ?? '*',
  });
  // Standard: nur lokal erreichbar, HTTPS macht der Reverse-Proxy davor (HOST=0.0.0.0 zum Aendern)
  server.listen(port, process.env.HOST ?? '127.0.0.1', () => console.log(`DB-Trainer-Sammelserver läuft auf Port ${port}. Daten: ${process.env.DATA_FILE ?? './events.jsonl'}`));
}
