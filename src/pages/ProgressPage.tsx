import { useRef, useState } from 'react';
import { CHAPTER_NAME, type Chapter } from '../content/mcQuestions';
import {
  exportProgress,
  importProgress,
  isFull,
  mastery,
  passed,
  passStreak,
  percentOf,
  PASS_PERCENT,
  READY_STREAK,
  READY_SURE_SHARE,
  resetProgress,
  storageLabel,
  useProgress,
  type ExamAttempt,
  type Mastery,
  type ProgressData,
} from '../progress';
import { topicsOf } from '../content/topics';
import { CHAPTERS, itemsOfTopic, practiceIds, questionIds, topicHref, topics } from '../progressCatalog';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast no-underline';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold';
const fmtDate = (t: number) =>
  new Date(t * 1000).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

/* ---------------- Pruefungsreife ---------------- */

export function readiness(d: ProgressData) {
  const streak = passStreak(d.exams);
  const allQ = CHAPTERS.flatMap((c) => questionIds[c]);
  const sure = allQ.filter((id) => mastery(d.items[id]) === 'sicher').length;
  const sureShare = allQ.length ? sure / allQ.length : 0;
  const anyPassed = d.exams.some(passed);
  let title: string;
  let text: string;
  if (streak >= READY_STREAK && sureShare >= READY_SURE_SHARE) {
    title = 'Prüfungsreif';
    text = `Du hast die letzten ${streak} vollständigen Probeklausuren bestanden und beherrschst die Wissensfragen. Du schaffst das!`;
  } else if (streak >= READY_STREAK) {
    title = 'Fast prüfungsreif';
    text = `Die Probeklausuren sitzen. Festige noch die Wissensfragen, bis mindestens ${Math.round(READY_SURE_SHARE * 100)} % sicher sind.`;
  } else if (anyPassed) {
    title = 'Auf gutem Weg';
    text = `Du hast schon bestanden. Schaffe ${READY_STREAK} vollständige Probeklausuren in Folge, dann bist du prüfungsreif.`;
  } else if (d.exams.length) {
    title = 'Dranbleiben';
    text = 'Schau dir an, in welchen Kapiteln Punkte fehlen, übe gezielt und versuche es erneut. Jede Klausur bringt dich weiter.';
  } else {
    title = 'Los geht’s';
    text = 'Mach deine erste Probeklausur. Danach siehst du hier, wo du stehst und was noch fehlt.';
  }
  return { streak, sure, total: allQ.length, sureShare, title, text, ready: streak >= READY_STREAK && sureShare >= READY_SURE_SHARE };
}

function StreakDots({ streak }: { streak: number }) {
  return (
    <div className="flex gap-2" aria-label={`${Math.min(streak, READY_STREAK)} von ${READY_STREAK} Probeklausuren in Folge bestanden`}>
      {Array.from({ length: READY_STREAK }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold ${
            i < streak ? 'border-ok bg-ok text-surface' : 'border-line text-muted'
          }`}
        >
          {i < streak ? '✓' : i + 1}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Verlaufsdiagramm (Saeulen mit Bestehensgrenze) ---------------- */

function HistoryChart({ exams }: { exams: ExamAttempt[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = exams.slice(-20);
  const W = 640,
    H = 200,
    padL = 48,
    padR = 8,
    padT = 12,
    padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const slot = innerW / Math.max(shown.length, 6);
  const barW = Math.min(24, slot * 0.6);
  const y = (p: number) => padT + innerH - (innerH * p) / 100;
  const h = hover !== null ? shown[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Ergebnisse der Probeklausuren in Prozent">
        {[0, 50, 100].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-muted">
              {t} %
            </text>
          </g>
        ))}
        {shown.map((e, i) => {
          const p = percentOf(e);
          const x = padL + slot * i + (slot - barW) / 2;
          const top = y(p);
          const r = Math.min(4, (y(0) - top) / 2);
          return (
            <g key={e.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* grosszuegige Trefferflaeche */}
              <rect x={padL + slot * i} y={padT} width={slot} height={innerH} fill="transparent" />
              {p > 0 && (
                <path
                  d={`M ${x} ${y(0)} V ${top + r} Q ${x} ${top} ${x + r} ${top} H ${x + barW - r} Q ${x + barW} ${top} ${x + barW} ${top + r} V ${y(0)} Z`}
                  className={isFull(e) ? 'fill-data' : 'fill-muted'}
                  opacity={hover === null || hover === i ? 1 : 0.5}
                />
              )}
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="10" className="fill-muted">
                {exams.length - shown.length + i + 1}
              </text>
            </g>
          );
        })}
        {/* Bestehensgrenze */}
        <line x1={padL} x2={W - padR} y1={y(PASS_PERCENT)} y2={y(PASS_PERCENT)} className="stroke-ink" strokeWidth={1.5} />
        <text x={W - padR} y={y(PASS_PERCENT) - 5} textAnchor="end" fontSize="11" className="fill-ink">
          Bestehensgrenze
        </text>
      </svg>
      {h && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow">
          <strong>Klausur {exams.indexOf(h) + 1}</strong> · {fmtDate(h.t)}
          <br />
          {h.p.toLocaleString('de-DE')} von {h.x} Punkten ({percentOf(h).toFixed(0)} %) · {passed(h) ? '✓ bestanden' : '✗ nicht bestanden'}
          <br />
          {isFull(h) ? 'vollständig (zählt für Prüfungsreife)' : `${h.c.length} Kapitel, ${h.m} Min.`}
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-data" aria-hidden /> vollständige Probeklausur
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted" aria-hidden /> Teilklausur (einzelne Kapitel oder 30 Min.)
        </span>
      </div>
    </div>
  );
}

/* ---------------- Fragenkatalog-Balken ---------------- */

const MASTERY_ORDER: Mastery[] = ['sicher', 'gelernt', 'falsch', 'neu'];
const MASTERY_CLASS: Record<Mastery, string> = {
  sicher: 'bg-ok',
  gelernt: 'bg-warn',
  falsch: 'bg-bad',
  neu: 'bg-line',
};
const MASTERY_LABEL: Record<Mastery, string> = {
  sicher: 'sicher (2× in Folge richtig)',
  gelernt: 'gelernt (zuletzt richtig)',
  falsch: 'zuletzt falsch',
  neu: 'noch nicht beantwortet',
};

function MasteryBar({ counts, total, label }: { counts: Record<Mastery, number>; total: number; label: string }) {
  return (
    <div
      className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full"
      role="img"
      aria-label={`${label}: ${MASTERY_ORDER.map((m) => `${counts[m]} ${m}`).join(', ')}`}
    >
      {MASTERY_ORDER.map((m) =>
        counts[m] > 0 ? <span key={m} className={MASTERY_CLASS[m]} style={{ width: `${(100 * counts[m]) / total}%` }} /> : null,
      )}
    </div>
  );
}

function countMastery(d: ProgressData, ids: string[]) {
  const c: Record<Mastery, number> = { sicher: 0, gelernt: 0, falsch: 0, neu: 0 };
  for (const id of ids) c[mastery(d.items[id])]++;
  return c;
}

/* ---------------- Seite ---------------- */

function chapterExamPercent(d: ProgressData, c: Chapter): number | null {
  const recent = d.exams.filter((e) => e.k[c]).slice(-3);
  if (!recent.length) return null;
  const [p, x] = recent.reduce(([a, b], e) => [a + e.k[c]![0], b + e.k[c]![1]], [0, 0]);
  return x ? (100 * p) / x : null;
}

/** Treffer ueber alle Versuche (Probeklausur und Lernen) zu den Aufgaben eines Themas */
function topicStats(d: ProgressData, topicId: string) {
  let seen = 0,
    right = 0;
  for (const i of itemsOfTopic(topicId)) {
    const s = d.items[i.id];
    if (s) {
      seen += s[0];
      right += s[1];
    }
  }
  return { seen, right };
}

function weakTopics(d: ProgressData) {
  return topics
    .map((t) => {
      const s = topicStats(d, t.id);
      return { t, seen: s.seen, rate: s.seen ? s.right / s.seen : 1 };
    })
    .filter((x) => x.seen >= 2 && x.rate < 0.75)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3);
}

export function ProgressPage() {
  const d = useProgress();
  const r = readiness(d);
  const weak = weakTopics(d);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const passedCount = d.exams.filter(passed).length;
  const best = d.exams.length ? Math.max(...d.exams.map(percentOf)) : null;
  const last5 = d.exams.slice(-5);
  const avg5 = last5.length ? last5.reduce((s, e) => s + percentOf(e), 0) / last5.length : null;
  const allQ = CHAPTERS.flatMap((c) => questionIds[c]);
  const qCounts = countMastery(d, allQ);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `db-trainer-fortschritt-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <a href="#/" className="text-sm underline">
        ← Übersicht
      </a>
      <h1 className="mt-2 text-3xl font-bold">Dein Fortschritt</h1>
      <p className="mt-1 text-sm text-muted">{storageLabel()}</p>

      {/* Pruefungsreife */}
      <section className={`mt-6 rounded-card border-2 p-5 ${r.ready ? 'border-ok bg-ok-bg' : 'border-line bg-surface'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">Prüfungsreife</p>
            <h2 className="mt-1 text-3xl font-bold">{r.title}</h2>
            <p className="mt-2">{r.text}</p>
          </div>
          <div className="text-center">
            <StreakDots streak={r.streak} />
            <p className="mt-2 text-xs text-muted">
              {Math.min(r.streak, READY_STREAK)} von {READY_STREAK} in Folge bestanden
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="#/pruefung" className={btn}>
            Probeklausur starten
          </a>
          <a href="#/lernen" className={`${btnGhost} no-underline`}>
            Wissensfragen lernen
          </a>
        </div>
        <p className="mt-3 text-xs text-muted">
          Für die Prüfungsreife zählen vollständige Probeklausuren (alle Kapitel, mindestens 60 Minuten), bestanden ab{' '}
          {PASS_PERCENT} %, und mindestens {Math.round(READY_SURE_SHARE * 100)} % der Wissensfragen „sicher“. Das ist eine Lernhilfe, keine Garantie für die
          echte Klausur.
        </p>
      </section>

      {/* Kennzahlen */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Probeklausuren', String(d.exams.length)],
          ['Davon bestanden', String(passedCount)],
          ['Bestes Ergebnis', best === null ? '–' : `${best.toFixed(0)} %`],
          ['Schnitt letzte 5', avg5 === null ? '–' : `${avg5.toFixed(0)} %`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-card border border-line bg-surface p-4">
            <p className="text-sm text-muted">{l}</p>
            <p className="mt-1 text-2xl font-semibold">{v}</p>
          </div>
        ))}
      </section>

      {/* Verlauf */}
      {d.exams.length > 0 && (
        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <h2 className="font-bold">Verlauf der Probeklausuren</h2>
          <p className="mb-3 text-sm text-muted">Ergebnis in Prozent, die letzten {Math.min(20, d.exams.length)} Klausuren</p>
          <HistoryChart exams={d.exams} />
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold">Als Tabelle</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 pr-3">Nr.</th>
                    <th className="py-1 pr-3">Datum</th>
                    <th className="py-1 pr-3">Umfang</th>
                    <th className="py-1 pr-3 text-right">Punkte</th>
                    <th className="py-1 pr-3 text-right">Prozent</th>
                    <th className="py-1">Ergebnis</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {[...d.exams].reverse().map((e, i) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="py-1 pr-3">{d.exams.length - i}</td>
                      <td className="py-1 pr-3">{fmtDate(e.t)}</td>
                      <td className="py-1 pr-3">{isFull(e) ? 'vollständig' : `${e.c.length} Kap., ${e.m} Min.`}</td>
                      <td className="py-1 pr-3 text-right">
                        {e.p.toLocaleString('de-DE')} / {e.x}
                      </td>
                      <td className="py-1 pr-3 text-right">{percentOf(e).toFixed(0)} %</td>
                      <td className="py-1">{passed(e) ? '✓ bestanden' : '✗ nicht bestanden'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}

      {/* Wissensfragen gesamt */}
      <section className="mt-6 rounded-card border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold">Fragenkatalog</h2>
          <span className="text-sm text-muted">
            {qCounts.sicher} von {allQ.length} sicher
          </span>
        </div>
        <div className="mt-3">
          <MasteryBar counts={qCounts} total={allQ.length} label="Fragenkatalog" />
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
          {MASTERY_ORDER.map((m) => (
            <li key={m} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded-sm ${MASTERY_CLASS[m]}`} aria-hidden />
              {MASTERY_LABEL[m]}: {qCounts[m]}
            </li>
          ))}
        </ul>
      </section>

      {/* Schwachstellen */}
      {weak.length > 0 && (
        <section className="mt-6 rounded-card border border-line bg-surface p-5">
          <h2 className="font-bold">Hier lohnt sich Üben</h2>
          <p className="mb-3 text-sm text-muted">Themen mit der niedrigsten Trefferquote in Probeklausuren und beim Lernen.</p>
          <ul className="space-y-2">
            {weak.map(({ t, rate, seen }) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bg p-3">
                <span>
                  <span className="font-semibold">{t.title}</span>
                  <span className="block text-xs text-muted">
                    {CHAPTER_NAME[t.chapter]} · {Math.round(rate * 100)} % richtig bei {seen} Versuchen
                  </span>
                </span>
                <span className="flex gap-3 text-sm">
                  <a href={`#/lernen/${t.id}`} className="underline">
                    Fragen lernen
                  </a>
                  {itemsOfTopic(t.id).some((i) => i.kind === 'uebung') && (
                    <a href={topicHref(t.id)} className="underline">
                      Üben
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Kapitel und Themen */}
      <section className="mt-6 rounded-card border border-line bg-surface p-5">
        <h2 className="mb-1 font-bold">Nach Kapiteln und Themen</h2>
        <p className="mb-4 text-sm text-muted">
          Probeklausur-Ergebnis (Schnitt der letzten 3), gelöste Übungen und sichere Wissensfragen. Aufklappen zeigt die Themen
          der Vorlesungsfolien.
        </p>
        <ul className="divide-y divide-line">
          {CHAPTERS.map((c) => {
            const exam = chapterExamPercent(d, c);
            const prac = practiceIds[c];
            const doneN = prac.filter((id) => d.done.includes(id)).length;
            const q = questionIds[c];
            const qc = countMastery(d, q);
            return (
              <li key={c} className="py-3">
              <details>
              <summary className="grid cursor-pointer list-none gap-3 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))] sm:items-center">
                <span className="font-semibold">
                  <span aria-hidden className="mr-1 text-muted">▸</span>
                  {CHAPTER_NAME[c]}
                </span>
                <div className="text-sm">
                  <span className="text-muted">Klausur: </span>
                  {exam === null ? '–' : (
                    <span>
                      {exam.toFixed(0)} % {exam >= PASS_PERCENT ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted">Übungen: </span>
                  {prac.length ? `${doneN} / ${prac.length}` : '–'}
                </div>
                <div className="text-sm">
                  <span className="text-muted">Fragen sicher: </span>
                  {qc.sicher} / {q.length}
                  <div className="mt-1">
                    <MasteryBar counts={qc} total={q.length} label={`Wissensfragen ${CHAPTER_NAME[c]}`} />
                  </div>
                </div>
              </summary>
              <ul className="mt-3 space-y-2 pl-5">
                {topicsOf(c).map((t) => {
                  const its = itemsOfTopic(t.id);
                  const pr = its.filter((i) => i.kind === 'uebung');
                  const qs = its.filter((i) => i.kind === 'frage');
                  const st = topicStats(d, t.id);
                  return (
                    <li key={t.id} className="grid gap-2 rounded-lg bg-bg p-3 text-sm sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] sm:items-center">
                      <span>
                        <span className="font-semibold">{t.title}</span>
                        <span className="block text-xs text-muted">Folien: {t.slides}</span>
                      </span>
                      <span>
                        <span className="text-muted">Treffer: </span>
                        {st.seen ? `${Math.round((100 * st.right) / st.seen)} %` : '–'}
                      </span>
                      <span>
                        <span className="text-muted">Übungen: </span>
                        {pr.length ? `${pr.filter((i) => d.done.includes(i.id)).length} / ${pr.length}` : '–'}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3">
                        <span>
                          <span className="text-muted">Fragen: </span>
                          {qs.filter((i) => mastery(d.items[i.id]) === 'sicher').length} / {qs.length}
                        </span>
                        <a href={`#/lernen/${t.id}`} className="underline">
                          lernen
                        </a>
                        {pr.length > 0 && (
                          <a href={topicHref(t.id)} className="underline">
                            üben
                          </a>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              </details>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Sichern / Laden */}
      <section className="mt-6 rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold">Fortschritt sichern</h2>
        <p className="mt-1 text-sm text-muted">
          Als Datei speichern und auf einem anderen Gerät wieder laden. Beim Laden wird zusammengeführt, es geht nichts verloren.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button className={btnGhost} onClick={download}>
            Als Datei speichern
          </button>
          <button className={btnGhost} onClick={() => fileRef.current?.click()}>
            Datei laden
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setMsg(importProgress(await f.text()) ? 'Fortschritt geladen und zusammengeführt.' : 'Die Datei ist kein gültiger Fortschritt.');
              e.target.value = '';
            }}
          />
          {!confirmReset ? (
            <button className="ml-auto text-sm text-muted underline" onClick={() => setConfirmReset(true)}>
              Fortschritt zurücksetzen
            </button>
          ) : (
            <span className="ml-auto flex flex-wrap items-center gap-2 text-sm">
              Wirklich alles löschen?
              <button
                className="rounded-lg border border-bad px-3 py-1 font-semibold text-bad"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMsg('Fortschritt zurückgesetzt.');
                }}
              >
                Ja, löschen
              </button>
              <button className="underline" onClick={() => setConfirmReset(false)}>
                Abbrechen
              </button>
            </span>
          )}
        </div>
        {msg && (
          <p role="status" className="mt-2 text-sm">
            {msg}
          </p>
        )}
      </section>
    </>
  );
}
