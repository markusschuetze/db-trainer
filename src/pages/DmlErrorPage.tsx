import { useMemo, useState } from 'react';
import { track } from '../analytics';
import { dmlErrorTasks, ERROR_CAUSE, type DmlErrorTask, type ErrorCode } from '../content/dmlErrors';
import { MARKTPLATZ_RELATIONS } from '../content/scenarios/marktplatz';
import { isDone, markDone } from '../progress';

const btn = 'rounded-lg bg-brand px-4 py-2 font-semibold text-brand-contrast disabled:opacity-50';
const CONSTRAINTS = [
  'Nutzerin.Email: UNIQUE und NOT NULL, muss „@“ gefolgt von einem Punkt enthalten',
  'Hersteller.IBAN: muss mit „978“ beginnen (CHAR(22))',
  'Artikel.Kategorie: nur Elektronik, Haushalt oder Spielzeug; Artikel.Hersteller: NOT NULL',
  'kaufen.Preis: NOT NULL und mindestens 0',
  'Komponente.Stueckkosten: zwischen 0 und 100',
  'Alle Fremdschlüssel wie im Schema angegeben',
];

export const shuffle = <T,>(a: T[]): T[] => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

/** Eine Aufgabe "Fehler erkennen" mit eigenem Zustand; onNext wird nach dem Prüfen oder Überspringen aufgerufen. */
export function DmlErrorCard({ task, onNext }: { task: DmlErrorTask; onNext: () => void }) {
  const [lines, setLines] = useState<number[]>([]);
  const [none, setNone] = useState(false);
  const [cause, setCause] = useState<Record<number, ErrorCode | ''>>({});
  const [checked, setChecked] = useState(false);
  const [started] = useState(Date.now());

  const expected = task.errors.map((e) => e.line);
  const linesOk = none ? expected.length === 0 : expected.length === lines.length && expected.every((l) => lines.includes(l));
  const causesOk = task.errors.every((e) => !!cause[e.line] && e.causes.includes(cause[e.line] as ErrorCode));
  const allOk = linesOk && (none || causesOk);
  const canCheck = none || (lines.length > 0 && lines.every((l) => cause[l]));

  const check = () => {
    setChecked(true);
    if (allOk) markDone(`dmlerr:${task.id}`);
    track({ k: 'i', i: `dmlerr:${task.id}`, tp: 'sql-dml', ch: 'SQL', ok: allOk ? 1 : 0, s: Math.min(3600, Math.round((Date.now() - started) / 1000)), a: 1, h: 0, src: 'u' });
  };

  return (
    <section className="min-w-0 rounded-card border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">{task.title}</h2>
          <ol className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 font-mono text-sm" aria-label="Skript mit Zeilennummern">
            {task.statements.map((s, i) => (
              <li key={i} className="flex gap-3 py-0.5">
                <span className="w-6 shrink-0 text-right text-muted">{i + 1}</span>
                <span className="whitespace-pre">{s}</span>
              </li>
            ))}
          </ol>

          <fieldset className="mt-4" disabled={checked}>
            <legend className="font-semibold">Welche Zeilen erzeugen einen Fehler?</legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              {task.statements.map((_, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lines.includes(i + 1)}
                    onChange={(e) => {
                      setNone(false);
                      setLines(e.target.checked ? [...lines, i + 1] : lines.filter((l) => l !== i + 1));
                    }}
                  />
                  Zeile {i + 1}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={none}
                  onChange={(e) => {
                    setNone(e.target.checked);
                    if (e.target.checked) setLines([]);
                  }}
                />
                Kein Fehler
              </label>
            </div>
          </fieldset>

          {lines.length > 0 && (
            <fieldset className="mt-4 space-y-2" disabled={checked}>
              <legend className="font-semibold">Woran liegt es?</legend>
              {[...lines].sort((a, b) => a - b).map((l) => {
                const exp = task.errors.find((e) => e.line === l);
                return (
                  <label key={l} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-16">Zeile {l}</span>
                    <select
                      className={`rounded border bg-surface px-2 py-1 ${checked ? (exp && cause[l] && exp.causes.includes(cause[l] as ErrorCode) ? 'border-ok' : 'border-bad') : 'border-line'}`}
                      value={cause[l] ?? ''}
                      onChange={(e) => setCause({ ...cause, [l]: e.target.value as ErrorCode })}
                      aria-label={`Ursache für Zeile ${l}`}
                    >
                      <option value="">bitte wählen</option>
                      {(Object.keys(ERROR_CAUSE) as ErrorCode[]).map((c) => (
                        <option key={c} value={c}>
                          {ERROR_CAUSE[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </fieldset>
          )}

          {checked && (
            <div role="status" className={`mt-4 rounded-lg p-3 text-sm ${allOk ? 'bg-ok-bg' : 'bg-bad-bg'}`}>
              <strong className={allOk ? 'text-ok' : 'text-bad'}>{allOk ? 'Richtig.' : 'Nicht ganz.'}</strong>{' '}
              {expected.length === 0 ? 'In diesem Skript entsteht kein Fehler.' : `Fehler in Zeile ${expected.join(', ')}.`}
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink">
                {task.errors.map((e) => (
                  <li key={e.line}>
                    <strong>Zeile {e.line}</strong> ({e.causes.map((c) => c).join(' oder ')}): {e.why}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-ink">{task.why}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {!checked ? (
              <button className={btn} disabled={!canCheck} onClick={check}>
                Prüfen
              </button>
            ) : (
              <button className={btn} onClick={onNext}>
                Nächste Aufgabe
              </button>
            )}
            {!checked && (
              <button className="rounded-lg border border-line bg-surface px-4 py-2 font-semibold" onClick={onNext}>
                Überspringen
              </button>
            )}
          </div>
    </section>
  );
}

/** Schema und Bedingungen des Marktplatzes als Nachschlagehilfe */
export function MarktplatzAside() {
  return (
    <aside className="h-fit min-w-0 rounded-card border border-line bg-surface p-5 text-sm">
          <h2 className="font-bold">Schema (Marktplatz)</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {MARKTPLATZ_RELATIONS.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-bold">Bedingungen</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {CONSTRAINTS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
    </aside>
  );
}

export function DmlErrorPage() {
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const order = useMemo(() => {
    const undone = dmlErrorTasks.filter((t) => !isDone(`dmlerr:${t.id}`));
    const done = dmlErrorTasks.filter((t) => isDone(`dmlerr:${t.id}`));
    return [...shuffle(undone), ...shuffle(done)];
  }, [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const task = order[pos];
  const next = () => {
    if (pos + 1 < order.length) setPos(pos + 1);
    else {
      setRound(round + 1);
      setPos(0);
    }
  };

  return (
    <>
      <a href="#/dml" className="inline-block py-2 text-sm underline">
        ← SQL-DML
      </a>
      <h1 className="mt-2 text-3xl font-bold">DML-Fehler erkennen</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Bestimme für jedes Skript, ob und wo ein Fehler entsteht. Die Skripte sind voneinander unabhängig, alle Tabellen sind zu
        Beginn leer. Wie in SQL Developer läuft ein Skript nach einem Fehler weiter, mit COMMIT und ROLLBACK wie in Oracle.
      </p>
      <p className="mt-2 text-sm font-semibold" aria-live="polite">
        Aufgabe {pos + 1} von {order.length} · {dmlErrorTasks.filter((t) => isDone(`dmlerr:${t.id}`)).length} erledigt
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DmlErrorCard key={`${task.id}-${round}`} task={task} onNext={next} />
        <MarktplatzAside />
      </div>
    </>
  );
}
