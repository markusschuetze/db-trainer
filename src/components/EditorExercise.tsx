import { useRef, useState, type ReactNode } from 'react';
import { track } from '../analytics';
import type { CheckResult } from '../sql/ddlGrading';
import type { StatementResult } from '../sql/oracle';
import { loadDraft, markDone, saveDraft } from '../progress';
import { SqlEditor } from './SqlEditor';
import { CheckList, StatementOutput } from './SqlOutput';

export interface EditorRun {
  results: StatementResult[];
  checks: CheckResult[];
  passed: boolean;
  /** zusaetzliche Ansicht unter der Ausgabe (Schema, Ergebnisvergleich, Diff) */
  details?: ReactNode;
}

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const btnGhost = 'rounded-lg border border-line bg-surface px-4 py-2 font-semibold disabled:opacity-50';

/** Gemeinsames Geruest fuer alle SQL-Aufgaben (DDL, DQL, DML). */
export function EditorExercise({
  progressId,
  backHref,
  backLabel,
  title,
  topic,
  task,
  aside,
  hints,
  solution,
  starter = '',
  ready,
  loadError,
  freshNote,
  run,
  nextHref,
  tracking,
}: {
  progressId: string;
  backHref: string;
  backLabel: string;
  title: string;
  topic: string;
  task: string;
  aside?: ReactNode;
  hints: string[];
  solution: string;
  starter?: string;
  ready: boolean;
  loadError?: string;
  freshNote: string;
  run: (code: string, grade: boolean) => EditorRun;
  nextHref?: string;
  /** Messung fuer die anonyme Lernstatistik */
  tracking?: { id: string; topicId: string; chapter: string; level: number };
}) {
  const started = useRef(Date.now());
  const [code, setCode] = useState(() => loadDraft(progressId, starter));
  const [out, setOut] = useState<EditorRun | null>(null);
  const [graded, setGraded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const update = (v: string) => {
    setCode(v);
    saveDraft(progressId, v);
  };
  const execute = (grade: boolean) => {
    if (!ready) return;
    const r = run(code, grade);
    setOut(r);
    setGraded(grade);
    if (grade) {
      if (tracking)
        track({
          k: 'i',
          i: tracking.id,
          tp: tracking.topicId,
          ch: tracking.chapter,
          ok: r.passed ? 1 : 0,
          s: Math.min(3600, Math.round((Date.now() - started.current) / 1000)),
          a: attempts + 1,
          h: hintsShown,
          lv: tracking.level,
          src: 'u',
        });
      setAttempts((a) => a + 1);
      if (r.passed) markDone(progressId);
    }
  };

  return (
    <>
      <a href={backHref} className="text-sm underline">
        ← {backLabel}
      </a>
      <h1 className="mt-2 text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted">{topic}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="min-w-0 space-y-4">
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-2 font-bold">Aufgabe</h2>
            <p className="whitespace-pre-line text-sm leading-6">{task}</p>
          </div>
          {aside}
          <div className="rounded-card border border-line bg-surface p-5">
            <h2 className="mb-2 font-bold">Tipps</h2>
            {hintsShown === 0 && <p className="text-sm text-muted">Noch keine Tipps aufgedeckt.</p>}
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {hints.slice(0, hintsShown).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ol>
            {hintsShown < hints.length && (
              <button className={`${btnGhost} mt-3 text-sm`} onClick={() => setHintsShown((n) => n + 1)}>
                Tipp {hintsShown + 1} von {hints.length} zeigen
              </button>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          <SqlEditor value={code} onChange={update} onRun={() => execute(false)} label="SQL-Editor" />
          <div className="flex flex-wrap items-center gap-3">
            <button className={btnGhost} onClick={() => execute(false)} disabled={!ready} title="Strg/Cmd + Enter">
              Ausführen
            </button>
            <button className={btn} onClick={() => execute(true)} disabled={!ready}>
              Prüfen
            </button>
            {attempts > 0 && !showSolution && (
              <button className={btnGhost} onClick={() => setShowSolution(true)}>
                Musterlösung zeigen
              </button>
            )}
            <button
              className="ml-auto text-sm text-muted underline"
              onClick={() => {
                update(starter);
                setOut(null);
              }}
            >
              Zurücksetzen
            </button>
          </div>
          {!ready && !loadError && <p className="text-sm text-muted">Datenbank wird geladen …</p>}
          {loadError && <p className="text-sm text-bad">Datenbank konnte nicht geladen werden: {loadError}</p>}
          <p className="text-xs text-muted">{freshNote} Fehler stoppen das Skript nicht, wie in SQL Developer.</p>

          {graded && out && <CheckList checks={out.checks} passed={out.passed} nextHref={nextHref} />}

          {showSolution && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Musterlösung</h2>
              <p className="mb-2 text-sm text-muted">Andere Schreibweisen sind genauso richtig, solange die Prüfung besteht.</p>
              <pre className="overflow-x-auto rounded-lg bg-bg p-3 font-mono text-xs leading-5">{solution}</pre>
            </div>
          )}

          {out && (
            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-2 font-bold">Ausgabe</h2>
              <StatementOutput results={out.results} />
              {out.details}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
