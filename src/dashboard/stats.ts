// Auswertung der anonymen Lernstatistik fuer das Dozenten-Dashboard.
// Reine Funktionen ohne Oberflaeche, damit sie testbar sind.
//
// Datenschutz: Auswertungen mit weniger als `minGroup` verschiedenen Lernenden werden
// unterdrueckt (suppressed), damit einzelne Personen nicht erkennbar werden.

import type { Stored } from '../analytics';

type ItemEv = Extract<Stored, { k: 'i' }>;
type ExamEv = Extract<Stored, { k: 'e' }>;

export interface Group {
  /** verschiedene Lernende */
  learners: number;
  /** Anteil der Lernenden, die beim ERSTEN Versuch richtig lagen (0..1) */
  firstTry: number;
  /** Anteil der Lernenden, die die Aufgabe irgendwann geloest haben (0..1) */
  solved: number;
  /** Median der Sekunden bis zur ersten richtigen Antwort (nur Gelöste) */
  medianSeconds: number | null;
  /** Durchschnittliche Versuche bis zur Loesung (nur Gelöste) */
  avgAttempts: number | null;
  /** Anteil der Lernenden, die mindestens einen Tipp aufgedeckt haben */
  hintShare: number;
  /** zu wenig Lernende: Werte sind ausgeblendet */
  suppressed: boolean;
}

export interface ItemStat extends Group {
  id: string;
  topicId: string;
  chapter: string;
  /** Wissensfragen: wie oft wurde welche falsche Antwort gewaehlt (Index -> Anzahl) */
  wrongOptions: Record<number, number>;
}

export interface TopicStat extends Group {
  topicId: string;
  chapter: string;
  items: number;
}

export interface ExamStats {
  count: number;
  learners: number;
  passRate: number;
  avgPercent: number;
  /** Histogramm in 10-%-Schritten (0-9 %, …, 100 %) */
  histogram: number[];
  byChapter: { chapter: string; avgPercent: number; n: number }[];
}

export interface WeekStat {
  /** Montag der Woche (Unix-Sekunden) */
  week: number;
  learners: number;
  attempts: number;
  successRate: number;
}

export interface Stats {
  learners: number;
  active7d: number;
  events: number;
  attempts: number;
  successRate: number;
  topics: TopicStat[];
  items: ItemStat[];
  exams: ExamStats;
  weeks: WeekStat[];
  /** Fruehester und spaetester Zeitpunkt der Daten */
  range: [number, number] | null;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Montag 00:00 UTC der Woche */
export const weekStart = (t: number) => {
  const d = new Date(t * 1000);
  const day = (d.getUTCDay() + 6) % 7;
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day) / 1000);
};

/** Kennzahlen einer Menge von Ereignissen (alle zu derselben Aufgabe bzw. demselben Thema) */
function group(events: ItemEv[], minGroup: number): Group {
  // je Lernender und Aufgabe: Ereignisse nach Zeit
  const per = new Map<string, ItemEv[]>();
  for (const e of events) {
    const k = `${e.u}|${e.i}`;
    per.set(k, [...(per.get(k) ?? []), e]);
  }
  const learners = new Set(events.map((e) => e.u));
  let first = 0;
  let solved = 0;
  const secs: number[] = [];
  const attempts: number[] = [];
  const hinted = new Set<string>();
  for (const [key, list] of per) {
    list.sort((a, b) => a.t - b.t || a.a - b.a);
    if (list[0].ok === 1 && list[0].a === 1) first++;
    const ok = list.find((e) => e.ok === 1);
    if (ok) {
      solved++;
      if (ok.src !== 'k') secs.push(ok.s); // in der Klausur wird keine Zeit je Aufgabe gemessen
      attempts.push(ok.a);
    }
    if (list.some((e) => e.h > 0)) hinted.add(key);
  }
  const n = per.size || 1;
  return {
    learners: learners.size,
    firstTry: first / n,
    solved: solved / n,
    medianSeconds: median(secs),
    avgAttempts: avg(attempts),
    hintShare: hinted.size / n,
    suppressed: learners.size < minGroup,
  };
}

export function computeStats(all: Stored[], opts: { minGroup: number; now?: number }): Stats {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const items = all.filter((e): e is ItemEv => e.k === 'i');
  const exams = all.filter((e): e is ExamEv => e.k === 'e');
  const learners = new Set(all.map((e) => e.u));
  const active = new Set(all.filter((e) => e.t >= now - 7 * 86400).map((e) => e.u));

  const byItem = new Map<string, ItemEv[]>();
  const byTopic = new Map<string, ItemEv[]>();
  for (const e of items) {
    byItem.set(e.i, [...(byItem.get(e.i) ?? []), e]);
    byTopic.set(e.tp, [...(byTopic.get(e.tp) ?? []), e]);
  }

  const itemStats: ItemStat[] = [...byItem].map(([id, evs]) => {
    const wrong: Record<number, number> = {};
    for (const e of evs)
      if (e.ok === 0 && e.o) for (const o of e.o) wrong[o] = (wrong[o] ?? 0) + 1;
    return { ...group(evs, opts.minGroup), id, topicId: evs[0].tp, chapter: evs[0].ch, wrongOptions: wrong };
  });

  const topicStats: TopicStat[] = [...byTopic].map(([topicId, evs]) => ({
    ...group(evs, opts.minGroup),
    topicId,
    chapter: evs[0].ch,
    items: new Set(evs.map((e) => e.i)).size,
  }));

  // Probeklausuren: je Lernender zaehlt jede Abgabe
  const percent = (e: ExamEv) => (e.x ? (100 * e.p) / e.x : 0);
  const chap = new Map<string, number[]>();
  for (const e of exams)
    for (const [c, [p, x]] of Object.entries(e.kc)) if (x > 0) chap.set(c, [...(chap.get(c) ?? []), (100 * p) / x]);
  const hist = Array.from({ length: 11 }, () => 0);
  for (const e of exams) hist[Math.min(10, Math.floor(percent(e) / 10))]++;
  const examStats: ExamStats = {
    count: exams.length,
    learners: new Set(exams.map((e) => e.u)).size,
    passRate: exams.length ? exams.filter((e) => percent(e) >= 50).length / exams.length : 0,
    avgPercent: avg(exams.map(percent)) ?? 0,
    histogram: hist,
    byChapter: [...chap].map(([chapter, xs]) => ({ chapter, avgPercent: avg(xs) ?? 0, n: xs.length })),
  };

  const wk = new Map<number, ItemEv[]>();
  for (const e of items) wk.set(weekStart(e.t), [...(wk.get(weekStart(e.t)) ?? []), e]);
  const weeks: WeekStat[] = [...wk]
    .map(([week, evs]) => ({
      week,
      learners: new Set(evs.map((e) => e.u)).size,
      attempts: evs.length,
      successRate: evs.filter((e) => e.ok === 1).length / evs.length,
    }))
    .sort((a, b) => a.week - b.week);

  const times = all.map((e) => e.t);
  return {
    learners: learners.size,
    active7d: active.size,
    events: all.length,
    attempts: items.length,
    successRate: items.length ? items.filter((e) => e.ok === 1).length / items.length : 0,
    topics: topicStats,
    items: itemStats,
    exams: examStats,
    weeks,
    range: times.length ? [Math.min(...times), Math.max(...times)] : null,
  };
}

/** Schwierigste zuerst: niedrige Quote beim ersten Versuch, dann viele Tipps */
export const hardest = <T extends Group>(xs: T[]) =>
  xs.filter((x) => !x.suppressed).sort((a, b) => a.firstTry - b.firstTry || b.hintShare - a.hintShare);

export const easiest = <T extends Group>(xs: T[]) => [...hardest(xs)].reverse();

/** CSV fuer Auswertungen in Excel/R (nur aggregierte Werte, keine Kennungen) */
export function itemsToCsv(items: ItemStat[], titleOf: (id: string) => string): string {
  const head = ['Aufgabe', 'Titel', 'Thema', 'Kapitel', 'Lernende', 'Erster Versuch richtig %', 'Geloest %', 'Median Sekunden', 'Versuche bis Loesung', 'Tipp genutzt %'];
  const rows = items.map((i) =>
    i.suppressed
      ? [i.id, titleOf(i.id), i.topicId, i.chapter, `<${i.learners}`, '', '', '', '', '']
      : [
          i.id,
          titleOf(i.id),
          i.topicId,
          i.chapter,
          i.learners,
          Math.round(i.firstTry * 100),
          Math.round(i.solved * 100),
          i.medianSeconds ?? '',
          i.avgAttempts?.toFixed(1) ?? '',
          Math.round(i.hintShare * 100),
        ],
  );
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return [head, ...rows].map((r) => r.map(esc).join(';')).join('\n');
}

/** Beispieldaten fuer die Demo-Ansicht ohne Server (frei erfunden, deterministisch) */
export function demoEvents(items: { id: string; topicId: string; chapter: string; level?: number; options?: number; correct?: number[] }[], now = Math.floor(Date.now() / 1000)): Stored[] {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out: Stored[] = [];
  const students = Array.from({ length: 40 }, (_, i) => `d${i.toString(16).padStart(4, '0')}`);
  for (const it of items) {
    const hard = it.level ? it.level / 3 : rnd();
    const take = students.filter(() => rnd() < 0.7);
    for (const u of take) {
      let a = 1;
      let t = now - Math.floor(rnd() * 28 * 86400);
      for (;;) {
        const ok = rnd() > 0.15 + hard * 0.55 - (a - 1) * 0.2 ? 1 : 0;
        const wrongPick = it.options ? Math.floor(rnd() * it.options) : -1;
        out.push({
          k: 'i', t, u, i: it.id, tp: it.topicId, ch: it.chapter, ok: ok as 0 | 1,
          s: Math.round(20 + hard * 240 * (0.5 + rnd()) * (1 + (a - 1) * 0.3)), a, h: rnd() < hard * 0.5 ? 1 : 0, src: 'u',
          ...(it.options && !ok && !(it.correct ?? []).includes(wrongPick) ? { o: [wrongPick] } : {}),
        } as Stored);
        if (ok || a >= 4) break;
        a++;
        t += 60;
      }
    }
  }
  for (const u of students.slice(0, 25)) {
    const p = Math.round(14 + rnd() * 22);
    out.push({ k: 'e', t: now - Math.floor(rnd() * 20 * 86400), u, p, x: 40, m: 60, ch: ['02', '05', '06', 'SQL'], kc: { '05': [Math.round(rnd() * 5), 5], '06': [Math.round(rnd() * 6), 6], SQL: [Math.round(rnd() * 8), 12] } });
  }
  return out;
}

export const fmtDuration = (sec: number | null) => (sec === null ? '–' : sec < 90 ? `${sec} s` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} min`);

/**
 * Auffaelligkeiten in Klartext fuer Lehrende: wo hakt es, welche Aufgabe ist unfair oder
 * missverstaendlich, was laeuft gut. Nur Gruppen ab `minGroup` Lernenden.
 */
export function insights(
  s: Stats,
  names: { item: (id: string) => string; topic: (id: string) => string; option: (id: string, i: number) => string | undefined; chapter?: (id: string) => string },
): string[] {
  const out: string[] = [];
  const topics = hardest(s.topics);
  const worst = topics[0];
  if (worst && worst.firstTry < 0.6)
    out.push(
      `Schwächstes Thema: „${names.topic(worst.topicId)}“. Nur ${Math.round(worst.firstTry * 100)} % lagen beim ersten Versuch richtig, ${Math.round(worst.hintShare * 100)} % brauchten einen Tipp. Hier lohnt sich mehr Erklärung oder Übung in der Veranstaltung.`,
    );
  const best = topics.length > 1 ? topics[topics.length - 1] : undefined;
  if (best && best !== worst && best.firstTry >= 0.75)
    out.push(`Stärkstes Thema: „${names.topic(best.topicId)}“ (${Math.round(best.firstTry * 100)} % beim ersten Versuch richtig).`);

  // Aufgaben, bei denen fast alle scheitern: moeglicherweise missverstaendlich formuliert
  const hopeless = hardest(s.items).filter((i) => i.solved < 0.5 && i.learners >= 1)[0];
  if (hopeless)
    out.push(
      `Nur ${Math.round(hopeless.solved * 100)} % haben „${names.item(hopeless.id)}“ überhaupt gelöst. Das spricht für eine missverständliche Aufgabe oder eine Lücke im Stoff. Aufgabentext und Tipps prüfen.`,
    );

  // Falsche Antwortoption, die mehr als die Haelfte der Fehlversuche auf sich zieht
  for (const i of s.items) {
    if (i.suppressed) continue;
    const total = Object.values(i.wrongOptions).reduce((a, b) => a + b, 0);
    const top = Object.entries(i.wrongOptions).sort((a, b) => b[1] - a[1])[0];
    if (top && total >= 5 && top[1] / total >= 0.5) {
      const text = names.option(i.id, Number(top[0]));
      out.push(`Typischer Denkfehler bei „${names.item(i.id)}“: ${Math.round((100 * top[1]) / total)} % der falschen Antworten wählen ${text ? `„${text}“` : `Antwort ${Number(top[0]) + 1}`}. Dieses Missverständnis in der Veranstaltung ansprechen.`);
      break;
    }
  }

  // sehr lange Bearbeitungszeit trotz hoher Erfolgsquote
  const slow = s.items.filter((i) => !i.suppressed && i.medianSeconds !== null && i.solved >= 0.7).sort((a, b) => (b.medianSeconds ?? 0) - (a.medianSeconds ?? 0))[0];
  if (slow && (slow.medianSeconds ?? 0) >= 300)
    out.push(`„${names.item(slow.id)}“ wird meist gelöst, braucht aber im Median ${fmtDuration(slow.medianSeconds)}. Eine Vorlage oder ein Beispiel könnte Zeit sparen.`);

  if (s.exams.count >= 5) {
    const weak = [...s.exams.byChapter].sort((a, b) => a.avgPercent - b.avgPercent)[0];
    if (weak && weak.avgPercent < 50)
      out.push(`In den Probeklausuren ist „${names.chapter?.(weak.chapter) ?? weak.chapter}“ das schwächste Kapitel (Ø ${Math.round(weak.avgPercent)} % der Punkte). Bestehensquote insgesamt: ${Math.round(s.exams.passRate * 100)} %.`);
  }
  return out.slice(0, 6);
}
