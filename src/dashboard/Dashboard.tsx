import { Fragment, useMemo, useRef, useState } from 'react';
import type { Stored } from '../analytics';
import { config } from '../config';
import { mcQuestions } from '../content/mcQuestions';
import { computeStats, demoEvents, easiest, fmtDuration, hardest, insights, itemsToCsv, type ItemStat, type Stats } from './stats';
import { chapterTitle, demoItems, itemTitle, kindOf, optionText, topicTitle } from './titles';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold disabled:opacity-50';
const pct = (v: number) => `${Math.round(v * 100)} %`;
const TOKEN_KEY = 'dbt:dash-token';

type Source = 'keine' | 'server' | 'datei' | 'demo';

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

/** Balken 0..1, Farbe aus dem Datenton, Wert als Text daneben (Text nie in Datenfarbe) */
function Bar({ value, good = true }: { value: number; good?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="h-2 flex-1 rounded-full bg-bg">
        <div className={`h-2 rounded-full ${good ? 'bg-data' : 'bg-bad'}`} style={{ width: `${Math.max(2, Math.round(value * 100))}%` }} />
      </div>
    </div>
  );
}

function TopicList({ title, note, rows, good }: { title: string; note: string; rows: Stats['topics']; good: boolean }) {
  return (
    <section className="rounded-card border border-line bg-surface p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="mb-3 text-sm text-muted">{note}</p>
      {rows.length === 0 && <p className="text-sm text-muted">Noch nicht genug Daten (mindestens {config.analyticsMinGroup} Lernende je Thema).</p>}
      <ul className="space-y-3">
        {rows.map((t) => (
          <li key={t.topicId}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">{topicTitle(t.topicId)}</span>
              <span className="tabular-nums text-muted">
                {pct(t.firstTry)} im 1. Versuch · Median {fmtDuration(t.medianSeconds)} · {t.learners} Lernende
              </span>
            </div>
            <Bar value={t.firstTry} good={good} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Histogram({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const W = 440,
    H = 120,
    pad = 20,
    slot = (W - pad) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="h-auto w-full max-w-lg" role="img" aria-label="Verteilung der Klausurergebnisse in 10-Prozent-Schritten">
      {values.map((v, i) => {
        const h = (H - 16) * (v / max);
        const x = pad + i * slot + 3;
        return (
          <g key={i}>
            <rect x={x} y={H - h} width={slot - 6} height={h} rx={3} className={i >= 5 ? 'fill-data' : 'fill-muted'} />
            {v > 0 && (
              <text x={x + (slot - 6) / 2} y={H - h - 4} textAnchor="middle" fontSize="10" className="fill-ink">
                {v}
              </text>
            )}
            <text x={x + (slot - 6) / 2} y={H + 12} textAnchor="middle" fontSize="9" className="fill-muted">
              {i === 10 ? '100' : `${i * 10}`}
            </text>
          </g>
        );
      })}
      <line x1={pad + 5 * slot} x2={pad + 5 * slot} y1={0} y2={H} className="stroke-ink" strokeWidth={1.5} />
    </svg>
  );
}

function ItemDetail({ item }: { item: ItemStat }) {
  const q = item.id.startsWith('mc:') ? mcQuestions.find((m) => m.id === item.id.slice(3)) : undefined;
  const wrongTotal = Object.values(item.wrongOptions).reduce((a, b) => a + b, 0);
  return (
    <div className="mt-3 rounded-lg bg-bg p-4 text-sm">
      <p className="font-semibold">{q?.question ?? itemTitle(item.id)}</p>
      {q ? (
        <>
          <p className="mt-1 text-muted">Welche falschen Antworten wurden gewählt?</p>
          <ul className="mt-2 space-y-2">
            {q.options.map((o, i) => {
              const n = item.wrongOptions[i] ?? 0;
              const right = q.correct.includes(i);
              return (
                <li key={i}>
                  <div className="flex justify-between gap-3">
                    <span>
                      {right && <span className="mr-1 text-ok" aria-label="richtig">✓</span>}
                      {o}
                    </span>
                    <span className="tabular-nums text-muted">{right ? 'richtig' : `${n}× falsch gewählt`}</span>
                  </div>
                  {!right && wrongTotal > 0 && <Bar value={n / wrongTotal} good={false} />}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-muted">
          {item.learners} Lernende, im Schnitt {item.avgAttempts?.toFixed(1) ?? '–'} Versuche bis zur Lösung, {pct(item.hintShare)} nutzten einen Tipp.
        </p>
      )}
    </div>
  );
}

export function Dashboard() {
  const [events, setEvents] = useState<Stored[]>([]);
  const [source, setSource] = useState<Source>('keine');
  const [msg, setMsg] = useState('');
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [days, setDays] = useState(0);
  const [sort, setSort] = useState<{ key: 'firstTry' | 'solved' | 'medianSeconds' | 'learners' | 'hintShare'; dir: 1 | -1 }>({ key: 'firstTry', dir: 1 });
  const [open, setOpen] = useState<string | null>(null);
  const [kind, setKind] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!days) return events;
    const from = Math.floor(Date.now() / 1000) - days * 86400;
    return events.filter((e) => e.t >= from);
  }, [events, days]);
  const stats = useMemo(() => computeStats(filtered, { minGroup: config.analyticsMinGroup }), [filtered]);
  const names = { item: itemTitle, topic: topicTitle, option: optionText, chapter: chapterTitle };
  const notes = useMemo(() => insights(stats, names), [stats]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const list = stats.items.filter((i) => !kind || kindOf(i.id) === kind);
    return [...list].sort((a, b) => {
      if (a.suppressed !== b.suppressed) return a.suppressed ? 1 : -1;
      const av = a[sort.key] ?? Infinity;
      const bv = b[sort.key] ?? Infinity;
      return ((av as number) - (bv as number)) * sort.dir;
    });
  }, [stats, sort, kind]);

  const load = async () => {
    setMsg('Lade …');
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignorieren */
    }
    try {
      const res = await fetch(`${config.analyticsUrl}/events`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) throw new Error('Das Passwort (Token) ist falsch.');
      if (!res.ok) throw new Error(`Der Server antwortet mit Fehler ${res.status}.`);
      const j = (await res.json()) as { events: Stored[] };
      setEvents(j.events);
      setSource('server');
      setMsg(`${j.events.length} Ereignisse vom Server geladen.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Der Server ist nicht erreichbar.');
    }
  };

  const kinds = [...new Set(stats.items.map((i) => kindOf(i.id)))];
  const th = (key: typeof sort.key, label: string) => (
    <th scope="col" className="px-2 py-2 text-right">
      <button
        className="font-semibold underline-offset-2 hover:underline"
        aria-label={`Nach ${label} sortieren`}
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }))}
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Datenquelle */}
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Datenquelle</h2>
        <p className="mt-1 text-sm text-muted">
          Die Auswertung zeigt nur zusammengefasste, anonyme Werte. Gruppen mit weniger als {config.analyticsMinGroup} Lernenden werden ausgeblendet.
          Dieser Bereich ist nicht passwortgeschützt, geschützt sind die Daten auf dem Server (Token).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {config.analyticsUrl ? (
            <>
              <label className="text-sm">
                <span className="block font-semibold">Token des Sammelservers</span>
                <input type="password" autoComplete="off" className="mt-1 rounded-lg border border-line bg-surface px-3 py-2" value={token} onChange={(e) => setToken(e.target.value)} />
              </label>
              <button className={btn} onClick={load} disabled={!token}>
                Vom Server laden
              </button>
            </>
          ) : (
            <p className="text-sm">
              Kein Sammelserver eingerichtet (<code>analyticsUrl</code> in config.json). Du kannst eine Datenexport-Datei laden oder die Demo ansehen.
            </p>
          )}
          <input
            ref={file}
            type="file"
            accept=".jsonl,.json,.txt"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              const lines = text.trim().startsWith('{"events"') ? (JSON.parse(text) as { events: Stored[] }).events : text.split('\n').filter(Boolean).map((l) => JSON.parse(l) as Stored);
              setEvents(lines);
              setSource('datei');
              setMsg(`${lines.length} Ereignisse aus ${f.name} geladen.`);
              e.target.value = '';
            }}
          />
          <button className={btnGhost} onClick={() => file.current?.click()}>
            Datei laden (events.jsonl)
          </button>
          <button
            className={btnGhost}
            onClick={() => {
              setEvents(demoEvents(demoItems()));
              setSource('demo');
              setMsg('Demo mit erfundenen Daten (40 fiktive Lernende).');
            }}
          >
            Demo ansehen
          </button>
        </div>
        {msg && (
          <p role="status" className="mt-2 text-sm">
            {msg}
          </p>
        )}
      </section>

      {source === 'keine' ? (
        <p className="text-muted">Lade Daten oder sieh dir die Demo an, um die Auswertung zu sehen.</p>
      ) : (
        <>
          {source === 'demo' && (
            <p className="rounded-lg border border-accent p-3 text-sm" role="note">
              <strong>Demo:</strong> Alle Zahlen sind erfunden und zeigen nur, wie die Auswertung aussieht.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">
              Zeitraum{' '}
              <select className="ml-1 rounded-lg border border-line bg-surface px-2 py-1" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                <option value={0}>alles</option>
                <option value={7}>letzte 7 Tage</option>
                <option value={30}>letzte 30 Tage</option>
                <option value={90}>letzte 90 Tage</option>
              </select>
            </label>
            <button
              className={`${btnGhost} ml-auto`}
              onClick={() => {
                const blob = new Blob(['﻿' + itemsToCsv(stats.items, itemTitle)], { type: 'text/csv;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `db-trainer-auswertung-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Auswertung als CSV
            </button>
          </div>

          {/* Kennzahlen */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-6" aria-label="Kennzahlen">
            <Tile label="Lernende" value={String(stats.learners)} note="verschiedene Geräte" />
            <Tile label="Aktiv, letzte 7 Tage" value={String(stats.active7d)} />
            <Tile label="Bearbeitungen" value={String(stats.attempts)} />
            <Tile label="Erfolgsquote" value={pct(stats.successRate)} note="alle Versuche" />
            <Tile label="Probeklausuren" value={String(stats.exams.count)} note={`${stats.exams.learners} Lernende`} />
            <Tile label="Klausur bestanden" value={stats.exams.count ? pct(stats.exams.passRate) : '–'} note={stats.exams.count ? `Ø ${Math.round(stats.exams.avgPercent)} %` : undefined} />
          </section>

          {/* Auffaelligkeiten */}
          <section className="rounded-card border-2 border-data bg-surface p-5">
            <h2 className="font-bold">Auffälligkeiten</h2>
            {notes.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Noch keine eindeutigen Auffälligkeiten (oder zu wenig Daten pro Aufgabe).</p>
            ) : (
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Themen */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopicList title="Hier gibt es die meisten Probleme" note="Themen mit der niedrigsten Quote richtig im ersten Versuch" rows={hardest(stats.topics).slice(0, 8)} good={false} />
            <TopicList title="Hier sind die Studierenden gut" note="Themen mit der höchsten Quote richtig im ersten Versuch" rows={easiest(stats.topics).slice(0, 5)} good />
          </div>

          {/* Klausuren */}
          {stats.exams.count > 0 && (
            <section className="rounded-card border border-line bg-surface p-5">
              <h2 className="font-bold">Probeklausuren</h2>
              <div className="mt-3 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Verteilung der Ergebnisse (Anzahl je 10-%-Schritt, Linie = Bestehensgrenze)</h3>
                  <Histogram values={stats.exams.histogram} />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Durchschnittliche Punkte je Kapitel</h3>
                  <ul className="space-y-2">
                    {[...stats.exams.byChapter]
                      .sort((a, b) => a.avgPercent - b.avgPercent)
                      .map((c) => (
                        <li key={c.chapter}>
                          <div className="flex justify-between text-sm">
                            <span>{chapterTitle(c.chapter)}</span>
                            <span className="tabular-nums text-muted">
                              {Math.round(c.avgPercent)} % · {c.n} Klausuren
                            </span>
                          </div>
                          <Bar value={c.avgPercent / 100} good={c.avgPercent >= 50} />
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Verlauf */}
          {stats.weeks.length > 1 && (
            <section className="rounded-card border border-line bg-surface p-5">
              <h2 className="font-bold">Nutzung pro Woche</h2>
              <p className="mb-3 text-sm text-muted">Bearbeitungen je Woche und Erfolgsquote</p>
              <ul className="space-y-1.5">
                {(() => {
                  const max = Math.max(...stats.weeks.map((w) => w.attempts));
                  return stats.weeks.slice(-12).map((w) => (
                    <li key={w.week} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
                      <span className="text-muted">{new Date(w.week * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                      <Bar value={w.attempts / max} />
                      <span className="tabular-nums text-muted">
                        {w.attempts} · {pct(w.successRate)} · {w.learners} Lernende
                      </span>
                    </li>
                  ));
                })()}
              </ul>
            </section>
          )}

          {/* Aufgaben (Tabellenansicht aller Werte) */}
          <section className="rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">Alle Aufgaben</h2>
              <label className="text-sm">
                Art{' '}
                <select className="ml-1 rounded-lg border border-line bg-surface px-2 py-1" value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="">alle</option>
                  {kinds.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th scope="col" className="px-2 py-2">Aufgabe</th>
                    {th('learners', 'Lernende')}
                    {th('firstTry', '1. Versuch')}
                    {th('solved', 'Gelöst')}
                    {th('medianSeconds', 'Median')}
                    {th('hintShare', 'Tipp')}
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {items.map((i) => (
                    <Fragment key={i.id}>
                      <tr className="border-b border-line align-top">
                        <td className="px-2 py-2">
                          <button className="text-left underline-offset-2 hover:underline" onClick={() => setOpen(open === i.id ? null : i.id)} aria-expanded={open === i.id}>
                            {itemTitle(i.id)}
                          </button>
                          <span className="block text-xs text-muted">
                            {kindOf(i.id)} · {topicTitle(i.topicId)}
                          </span>
                        </td>
                        {i.suppressed ? (
                          <td colSpan={5} className="px-2 py-2 text-right text-muted">
                            zu wenige Lernende ({i.learners}, mindestens {config.analyticsMinGroup})
                          </td>
                        ) : (
                          <>
                            <td className="px-2 py-2 text-right">{i.learners}</td>
                            <td className="px-2 py-2 text-right">{pct(i.firstTry)}</td>
                            <td className="px-2 py-2 text-right">{pct(i.solved)}</td>
                            <td className="px-2 py-2 text-right">{fmtDuration(i.medianSeconds)}</td>
                            <td className="px-2 py-2 text-right">{pct(i.hintShare)}</td>
                          </>
                        )}
                      </tr>
                      {open === i.id && !i.suppressed && (
                        <tr>
                          <td colSpan={6} className="px-2 pb-3">
                            <ItemDetail item={i} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              „1. Versuch“: Anteil der Lernenden, die beim ersten Versuch richtig lagen. „Gelöst“: irgendwann richtig. „Median“: Zeit bis zur ersten richtigen
              Antwort (in Probeklausuren wird keine Zeit je Aufgabe gemessen).
            </p>
          </section>
        </>
      )}
    </div>
  );
}
