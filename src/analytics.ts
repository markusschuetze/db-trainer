// Anonyme Lernstatistik (freiwillig, nur mit Einwilligung).
//
// Gesendet werden nur: Aufgaben-ID, Thema, richtig/falsch, Sekunden, Versuche, Tipps,
// bei Wissensfragen die gewaehlten Antwortnummern, bei Probeklausuren die Punkte je Kapitel.
// NICHT gesendet werden: Namen, Login, Texte oder SQL-Eingaben, IP-Adressen (der
// Sammelserver speichert sie nicht). Die zufaellige Kennung wird im Browser erzeugt und
// ist keiner Person zugeordnet; sie dient nur dazu, Lernende zu zaehlen.

import { config } from './config';

export type TrackEvent =
  | {
      k: 'i';
      /** Aufgabe, z. B. "sql:group-by", "mc:acid" */
      i: string;
      tp: string;
      ch: string;
      /** richtig (1) oder nicht (0) */
      ok: 0 | 1;
      /** Sekunden seit Oeffnen der Aufgabe (max. 3600) */
      s: number;
      /** wievielter Versuch */
      a: number;
      /** aufgedeckte Tipps */
      h: number;
      /** gewaehlte Antworten (Wissensfragen) */
      o?: number[];
      lv?: number;
      /** u = Uebung, l = Lernmodus, k = Probeklausur */
      src: 'u' | 'l' | 'k';
    }
  | {
      k: 'e';
      p: number;
      x: number;
      m: number;
      ch: string[];
      kc: Record<string, [number, number]>;
    };

export type Stored = TrackEvent & { t: number; u: string };

const CONSENT_KEY = 'dbt:analytics-consent';
const ID_KEY = 'dbt:analytics-id';

export const analyticsAvailable = () => !!config.analyticsUrl;

export function getConsent(): 'ja' | 'nein' | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === 'ja' || v === 'nein' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: 'ja' | 'nein') {
  try {
    localStorage.setItem(CONSENT_KEY, v);
    if (v === 'nein') {
      localStorage.removeItem(ID_KEY);
      queue = [];
    }
  } catch {
    /* ignorieren */
  }
  listeners.forEach((l) => l());
}

const listeners = new Set<() => void>();
export const onConsentChange = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function learnerId(): string {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      const b = new Uint8Array(8);
      crypto.getRandomValues(b);
      id = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return 'x';
  }
}

let queue: Stored[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

export function track(ev: TrackEvent) {
  if (!analyticsAvailable() || getConsent() !== 'ja') return;
  queue.push({ ...ev, t: Math.floor(Date.now() / 1000), u: learnerId() });
  if (queue.length >= 10) void flush();
  else timer ??= setTimeout(() => void flush(), 15000);
}

export async function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (!queue.length || !analyticsAvailable()) return;
  const batch = queue.splice(0, 100);
  try {
    // text/plain vermeidet eine CORS-Vorabanfrage; der Server liest den Text als JSON
    await fetch(`${config.analyticsUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Server nicht erreichbar: verwerfen statt endlos wiederholen
  }
}

if (typeof window !== 'undefined') window.addEventListener('pagehide', () => void flush());
